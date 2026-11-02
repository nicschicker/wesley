import { NextResponse } from "next/server";
import { createAdminClient } from "@/core/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Leichter Health-Check. Wird täglich von GitHub Actions aufgerufen,
 * damit das Gratis-Supabase-Projekt nicht pausiert. Gibt keine Daten preis.
 */
export async function GET() {
  try {
    const { error } = await createAdminClient().from("profiles").select("id", { head: true, count: "exact" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
