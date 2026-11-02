import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverSecret } from "@/core/env";

/**
 * Server-Client mit Secret Key. Umgeht Row Level Security.
 * Nur für klar abgegrenzte Aufgaben verwenden (Einladungen, Kontingente, Health-Check)
 * und vorher immer selbst prüfen, ob die Person das darf.
 */
export function createAdminClient() {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverSecret("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
