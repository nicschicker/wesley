"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/core/supabase/admin";
import { createClient } from "@/core/supabase/server";
import { hashInvitationCode, normalizeInvitationCode } from "@/core/auth/invitation-code";

export type RegisterState = { error?: string; fields?: Record<string, string> };

const schema = z.object({
  code: z.string(),
  displayName: z.string().trim().min(1, "Bitte gib deinen Namen ein.").max(60),
  email: z.string().trim().toLowerCase().email("Diese E-Mail-Adresse ist ungültig."),
  password: z.string().min(10, "Das Passwort braucht mindestens 10 Zeichen.").max(128),
});

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = {
    code: String(formData.get("code") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const fields = { code: raw.code, displayName: raw.displayName, email: raw.email };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, fields };

  const code = normalizeInvitationCode(parsed.data.code);
  if (!code) return { error: "Der Einladungscode hat das Format WES-XXXX-XXXX.", fields };

  const admin = createAdminClient();

  // 1. Einladung atomar reservieren
  const { data: invitation, error: inviteError } = await admin
    .rpc("consume_invitation", { p_code_hash: hashInvitationCode(code) })
    .maybeSingle<{ id: string; grants_admin: boolean }>();
  if (inviteError || !invitation) {
    return { error: "Dieser Einladungscode ist ungültig, abgelaufen oder schon verwendet.", fields };
  }

  // 2. Konto anlegen (bestätigt, da die Einladung die Person ausweist)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.displayName },
  });
  if (createError || !created.user) {
    // Einladung wieder freigeben, damit sie nicht verloren ist
    await admin.from("invitations").update({ used_at: null }).eq("id", invitation.id);
    const exists = createError?.message?.toLowerCase().includes("already");
    return {
      error: exists
        ? "Für diese E-Mail gibt es schon ein Konto. Melde dich an."
        : "Das Konto konnte nicht angelegt werden. Prüfe das Passwort und versuch es erneut.",
      fields,
    };
  }

  // 3. Einladung der Person zuordnen, ggf. Admin-Rechte vergeben
  await admin.from("invitations").update({ used_by: created.user.id }).eq("id", invitation.id);
  if (invitation.grants_admin) {
    await admin.from("profiles").update({ is_admin: true }).eq("id", created.user.id);
  }

  // 4. Direkt einloggen
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  redirect("/heute");
}
