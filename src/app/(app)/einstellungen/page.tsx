import { LogOut } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { logout } from "@/app/(auth)/login/actions";

export const metadata = { title: "Einstellungen · Wesley" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <h1>Einstellungen</h1>
      <section className="card" style={{ padding: "var(--s-5)", display: "grid", gap: "var(--s-3)" }}>
        <h3>Konto</h3>
        <p>{user.displayName}</p>
        <p className="small">{user.email}</p>
        <p className="small">Face ID, Module, Kalender-Verbindungen, Export und Konto löschen folgen in den nächsten Schritten.</p>
        <form action={logout}>
          <button type="submit" className="btn btn-secondary">
            <LogOut size={18} strokeWidth={1.75} aria-hidden /> Abmelden
          </button>
        </form>
      </section>
    </>
  );
}
