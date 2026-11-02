"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/core/auth/session";
import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import { fromCents, splitEqually, toCents } from "./money";

// Alle Schreibzugriffe laufen im Namen der Person; Row Level Security erlaubt nur Gruppenmitgliedern Zugriff.
// Einzige Ausnahme: die Suche nach einem Konto per E-Mail (Admin-Client, gibt nur die ID zurück).

export type FlouzState = { error?: string; ok?: boolean };

const uuid = z.string().uuid();
const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Währung als dreistelliger Code, z. B. CHF, EUR oder HRK.");

function refresh(groupId?: string) {
  revalidatePath("/flouz");
  if (groupId) revalidatePath(`/flouz/${groupId}`);
}

export async function createGroup(_prev: FlouzState, fd: FormData): Promise<FlouzState> {
  const user = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const cur = currency.safeParse(fd.get("currency") || "CHF");
  if (!name || name.length > 60) return { error: "Bitte einen Gruppennamen mit höchstens 60 Zeichen eingeben." };
  if (!cur.success) return { error: cur.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: group, error } = await supabase
    .from("expense_groups")
    .insert({ name, default_currency: cur.data, created_by: user.id })
    .select("id")
    .single();
  if (error || !group) return { error: "Die Gruppe konnte nicht erstellt werden." };
  const { error: memberError } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id });
  if (memberError) {
    await supabase.from("expense_groups").delete().eq("id", group.id);
    return { error: "Die Gruppe konnte nicht erstellt werden." };
  }
  refresh();
  redirect(`/flouz/${group.id}`);
}

export async function updateGroup(_prev: FlouzState, fd: FormData): Promise<FlouzState> {
  await requireUser();
  const id = uuid.safeParse(fd.get("group_id"));
  const name = String(fd.get("name") ?? "").trim();
  const cur = currency.safeParse(fd.get("currency") || "CHF");
  if (!id.success) return { error: "Gruppe nicht gefunden." };
  if (!name || name.length > 60) return { error: "Bitte einen Gruppennamen mit höchstens 60 Zeichen eingeben." };
  if (!cur.success) return { error: cur.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("expense_groups").update({ name, default_currency: cur.data }).eq("id", id.data);
  if (error) return { error: "Die Änderung konnte nicht gespeichert werden." };
  refresh(id.data);
  return { ok: true };
}

export async function deleteGroup(_prev: FlouzState, fd: FormData): Promise<FlouzState> {
  await requireUser();
  const id = uuid.safeParse(fd.get("group_id"));
  if (!id.success) return { error: "Gruppe nicht gefunden." };
  if (fd.get("confirm") !== "on") return { error: "Bitte bestätige, dass die Gruppe mit allen Ausgaben gelöscht wird." };
  const supabase = await createClient();
  const { error } = await supabase.from("expense_groups").delete().eq("id", id.data);
  if (error) return { error: "Die Gruppe konnte nicht gelöscht werden." };
  refresh();
  redirect("/flouz");
}

export async function addMember(_prev: FlouzState, fd: FormData): Promise<FlouzState> {
  await requireUser();
  const id = uuid.safeParse(fd.get("group_id"));
  const email = z.string().trim().toLowerCase().email().safeParse(fd.get("email"));
  if (!id.success) return { error: "Gruppe nicht gefunden." };
  if (!email.success) return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };

  const supabase = await createClient();
  // Nur wer selbst Mitglied ist, darf suchen und hinzufügen
  const { data: own } = await supabase.from("expense_groups").select("id").eq("id", id.data).maybeSingle();
  if (!own) return { error: "Gruppe nicht gefunden." };

  const { data: profile } = await createAdminClient().from("profiles").select("id").eq("email", email.data).maybeSingle();
  if (!profile) return { error: "Diese Person nutzt Wesley noch nicht. Lade sie zuerst ein (Admin → Einladung erstellen)." };

  const { error } = await supabase.from("group_members").insert({ group_id: id.data, user_id: profile.id });
  if (error) return { error: error.code === "23505" ? "Diese Person ist schon in der Gruppe." : "Die Person konnte nicht hinzugefügt werden." };
  refresh(id.data);
  return { ok: true };
}

export async function removeMember(fd: FormData) {
  const user = await requireUser();
  const groupId = uuid.parse(fd.get("group_id"));
  const userId = uuid.parse(fd.get("user_id"));
  const supabase = await createClient();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  refresh(groupId);
  if (userId === user.id) redirect("/flouz");
}

const expenseSchema = z.object({
  group_id: uuid,
  description: z.string().trim().min(1, "Bitte eine Beschreibung eingeben.").max(120),
  amount: z.number().positive("Der Betrag muss grösser als 0 sein.").max(10_000_000),
  currency,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen."),
  paid_by: uuid,
  participants: z.array(uuid).min(1, "Bitte mindestens eine Person auswählen, auf die aufgeteilt wird."),
});

export async function addExpense(_prev: FlouzState, fd: FormData): Promise<FlouzState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse({
    group_id: fd.get("group_id"),
    description: fd.get("description") ?? "",
    amount: Number(String(fd.get("amount") ?? "").replace(",", ".").replace(/['\s]/g, "")),
    currency: fd.get("currency") ?? "",
    day: fd.get("day") ?? "",
    paid_by: fd.get("paid_by"),
    participants: fd.getAll("participants").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const total = toCents(d.amount);
  const shares = splitEqually(total, d.participants);
  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({ group_id: d.group_id, description: d.description, amount: fromCents(total), currency: d.currency, day: d.day, paid_by: d.paid_by, created_by: user.id })
    .select("id")
    .single();
  if (error || !expense) return { error: "Die Ausgabe konnte nicht gespeichert werden. Ist die zahlende Person Mitglied der Gruppe?" };

  const rows = [...shares.entries()].map(([user_id, cents]) => ({
    expense_id: expense.id,
    group_id: d.group_id,
    user_id,
    share: fromCents(cents),
    // Der eigene Anteil der zahlenden Person ist automatisch beglichen
    settled: user_id === d.paid_by,
    settled_at: user_id === d.paid_by ? new Date().toISOString() : null,
  }));
  const { error: splitError } = await supabase.from("expense_splits").insert(rows);
  if (splitError) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { error: "Die Aufteilung konnte nicht gespeichert werden. Nichts wurde gespeichert." };
  }
  refresh(d.group_id);
  return { ok: true };
}

export async function deleteExpense(fd: FormData) {
  await requireUser();
  const id = uuid.parse(fd.get("expense_id"));
  const groupId = uuid.parse(fd.get("group_id"));
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  refresh(groupId);
}

/** «Beglichen» für einen Anteil umschalten. */
export async function toggleSettled(fd: FormData) {
  await requireUser();
  const expenseId = uuid.parse(fd.get("expense_id"));
  const groupId = uuid.parse(fd.get("group_id"));
  const userId = uuid.parse(fd.get("user_id"));
  const settled = fd.get("settled") === "true";
  const supabase = await createClient();
  await supabase
    .from("expense_splits")
    .update({ settled, settled_at: settled ? new Date().toISOString() : null })
    .eq("expense_id", expenseId)
    .eq("user_id", userId);
  refresh(groupId);
}

/** Alle offenen Schulden zwischen zwei Personen in einer Währung als beglichen markieren. */
export async function settleBetween(fd: FormData) {
  await requireUser();
  const groupId = uuid.parse(fd.get("group_id"));
  const from = uuid.parse(fd.get("from"));
  const to = uuid.parse(fd.get("to"));
  const cur = currency.parse(fd.get("currency"));
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("expenses")
    .select("id, paid_by")
    .eq("group_id", groupId)
    .eq("currency", cur)
    .in("paid_by", [from, to]);
  const now = new Date().toISOString();
  for (const e of rows ?? []) {
    const debtor = e.paid_by === to ? from : to;
    await supabase
      .from("expense_splits")
      .update({ settled: true, settled_at: now })
      .eq("expense_id", e.id)
      .eq("user_id", debtor)
      .eq("settled", false);
  }
  refresh(groupId);
}
