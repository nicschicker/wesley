import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/core/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase-Client im Namen der eingeloggten Person.
 * Alle Abfragen laufen durch Row Level Security.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: CookieToSet[]) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // In Server Components nicht setzbar; die Middleware erneuert die Sitzung.
        }
      },
    },
  });
}
