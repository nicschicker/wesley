"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/core/supabase/server";

export type LoginState = { error?: string };

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Bitte E-Mail und Passwort eingeben." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Bewusst unspezifisch: verrät nicht, ob die E-Mail existiert
    if (error.status === 429) return { error: "Zu viele Versuche. Bitte in ein paar Minuten erneut probieren." };
    return { error: "E-Mail oder Passwort stimmt nicht." };
  }
  redirect("/heute");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
