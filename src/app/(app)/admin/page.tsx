import { requireAdmin } from "@/core/auth/session";
import { createAdminClient } from "@/core/supabase/admin";
import { InviteForm } from "./InviteForm";
import { revokeInvitation } from "./actions";
import styles from "./admin.module.css";

export const metadata = { title: "Admin · Wesley" };

type Invitation = {
  id: string;
  note: string;
  grants_admin: boolean;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Zurich" }).format(new Date(iso));

function statusOf(inv: Invitation): { text: string; tone: "ok" | "used" | "expired" } {
  if (inv.used_by) return { text: "Verwendet", tone: "used" };
  if (new Date(inv.expires_at) < new Date()) return { text: "Abgelaufen", tone: "expired" };
  return { text: "Offen", tone: "ok" };
}

export default async function AdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: invitations }, { count: users }] = await Promise.all([
    db.from("invitations").select("id, note, grants_admin, expires_at, used_at, used_by, created_at").order("created_at", { ascending: false }).limit(50),
    db.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <div className={styles.head}>
        <h1>Admin</h1>
        <p className="small">{users ?? 0} {users === 1 ? "Person nutzt" : "Personen nutzen"} Wesley.</p>
      </div>

      <section className={styles.section} aria-labelledby="h-new">
        <h2 id="h-new">Kollegen einladen</h2>
        <InviteForm />
      </section>

      <section className={styles.section} aria-labelledby="h-list">
        <h2 id="h-list">Einladungen</h2>
        {!invitations?.length ? (
          <p className="small">Noch keine Einladungen.</p>
        ) : (
          <ul className={styles.list}>
            {(invitations as Invitation[]).map((inv) => {
              const s = statusOf(inv);
              return (
                <li key={inv.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <p>{inv.note || "Ohne Notiz"}{inv.grants_admin ? " · Admin" : ""}</p>
                    <p className="small">Erstellt {fmt(inv.created_at)} · gültig bis {fmt(inv.expires_at)}</p>
                  </div>
                  <span className={`${styles.chip} ${styles[s.tone]}`}>{s.text}</span>
                  {s.tone === "ok" && (
                    <form action={revokeInvitation}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button type="submit" className="btn btn-quiet">Zurückziehen</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
