import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { visibleModules } from "@/core/modules";
import { MODULE_ICONS } from "@/core/ui/icons";
import { logout } from "@/app/(auth)/login/actions";
import s from "../bereiche/bereiche.module.css";

export const metadata = { title: "Mehr · Wesley" };

export default async function MehrPage() {
  const user = await requireUser();
  const items = visibleModules(user.isAdmin).filter((m) => m.placement !== "tabs" && !m.mobileTab);

  return (
    <>
      <header className="page-head">
        <h1>Mehr</h1>
        <p className="small">Angemeldet als {user.displayName}</p>
      </header>
      <ul className={s.list}>
        {items.map((m) => {
          const Icon = MODULE_ICONS[m.icon];
          const inner = (
            <>
              <span className={s.main} style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <Icon size={22} strokeWidth={1.75} aria-hidden />
                <span className={s.name} style={{ fontSize: 20 }}>{m.label}</span>
              </span>
              <span className="small">{m.ready ? "" : "demnächst"}</span>
              <ChevronRight size={20} strokeWidth={1.75} aria-hidden className={s.chev} />
            </>
          );
          return (
            <li key={m.id}>
              {m.ready ? <Link href={m.href} className={s.row}>{inner}</Link> : <span className={s.row} style={{ opacity: 0.5 }}>{inner}</span>}
            </li>
          );
        })}
      </ul>
      <form action={logout}>
        <button type="submit" className="btn btn-secondary"><LogOut size={18} strokeWidth={1.75} aria-hidden /> Abmelden</button>
      </form>
    </>
  );
}
