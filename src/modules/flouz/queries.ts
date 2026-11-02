import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import { toCents, type ExpenseForBalance } from "./money";

export type Member = { id: string; name: string };
export type GroupSummary = { id: string; name: string; default_currency: string; members: number };
export type Split = { user_id: string; share_cents: number; settled: boolean };
export type Expense = {
  id: string;
  description: string;
  amount_cents: number;
  currency: string;
  day: string;
  paid_by: string;
  splits: Split[];
};

export async function listGroups(): Promise<GroupSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_groups")
    .select("id, name, default_currency, group_members(count)")
    .order("created_at", { ascending: false });
  return (data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    default_currency: g.default_currency,
    members: (g.group_members as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

/** Alle offenen Anteile in allen Gruppen der Person (für die Übersicht). */
export async function allOpenExpenses(): Promise<(ExpenseForBalance & { group_id: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("group_id, paid_by, currency, expense_splits(user_id, share, settled)")
    .limit(2000);
  return (data ?? []).map((e) => ({
    group_id: e.group_id,
    paid_by: e.paid_by,
    currency: e.currency,
    splits: (e.expense_splits ?? []).map((s) => ({ user_id: s.user_id, share_cents: toCents(Number(s.share)), settled: s.settled })),
  }));
}

export async function getGroup(id: string) {
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("expense_groups")
    .select("id, name, default_currency, created_by")
    .eq("id", id)
    .maybeSingle();
  if (!group) notFound();

  const [{ data: memberRows }, { data: expenseRows }] = await Promise.all([
    supabase.from("group_members").select("user_id, profiles(display_name)").eq("group_id", id).order("added_at"),
    supabase
      .from("expenses")
      .select("id, description, amount, currency, day, paid_by, created_at, expense_splits(user_id, share, settled)")
      .eq("group_id", id)
      .order("day", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const members: Member[] = (memberRows ?? []).map((m) => ({
    id: m.user_id,
    name: (m.profiles as unknown as { display_name: string } | null)?.display_name || "Unbekannt",
  }));

  const expenses: Expense[] = (expenseRows ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount_cents: toCents(Number(e.amount)),
    currency: e.currency,
    day: e.day,
    paid_by: e.paid_by,
    splits: (e.expense_splits ?? []).map((s) => ({ user_id: s.user_id, share_cents: toCents(Number(s.share)), settled: s.settled })),
  }));

  return { group, members, expenses };
}
