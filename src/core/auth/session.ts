import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

/** Eingeloggte Person laden oder zum Login umleiten. */
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_admin")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name || user.email?.split("@")[0] || "",
    isAdmin: profile?.is_admin ?? false,
  };
}

/** Nur für Admin-Seiten und -Aktionen. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/heute");
  return user;
}
