import { z } from "zod";

/**
 * Öffentliche Werte: dürfen im Browser landen.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

/**
 * Geheime Werte: nur auf dem Server lesen. Wird erst beim ersten Aufruf geprüft,
 * damit der Build ohne Geheimnisse durchläuft.
 */
export function serverSecret(name: "SUPABASE_SECRET_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Umgebungsvariable ${name} fehlt. Siehe README, Abschnitt «Umgebungsvariablen».`);
  }
  return value;
}
