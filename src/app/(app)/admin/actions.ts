"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/core/auth/session";
import { createAdminClient } from "@/core/supabase/admin";
import { generateInvitationCode, hashInvitationCode } from "@/core/auth/invitation-code";

export type CreateInviteState = { code?: string; error?: string };

const schema = z.object({
  note: z.string().trim().max(80).default(""),
  days: z.coerce.number().int().min(1).max(30).default(7),
});

/** Neue Einladung. Der Klartext-Code wird genau einmal angezeigt, gespeichert wird nur der Hash. */
export async function createInvitation(_prev: CreateInviteState, formData: FormData): Promise<CreateInviteState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({ note: formData.get("note") ?? "", days: formData.get("days") ?? 7 });
  if (!parsed.success) return { error: "Bitte Notiz (max. 80 Zeichen) und 1–30 Tage Gültigkeit angeben." };

  const code = generateInvitationCode();
  const expires = new Date(Date.now() + parsed.data.days * 86_400_000).toISOString();
  const { error } = await createAdminClient().from("invitations").insert({
    code_hash: hashInvitationCode(code),
    note: parsed.data.note,
    created_by: admin.id,
    expires_at: expires,
  });
  if (error) return { error: "Die Einladung konnte nicht gespeichert werden. Bitte erneut versuchen." };

  revalidatePath("/admin");
  return { code };
}

export async function revokeInvitation(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  // Nur unbenutzte Einladungen zurückziehen
  await createAdminClient().from("invitations").delete().eq("id", id).is("used_at", null);
  revalidatePath("/admin");
}
