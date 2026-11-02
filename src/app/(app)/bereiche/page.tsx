import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { todayISO } from "@/core/date";
import { listAreas, listTasks } from "@/modules/tasks/queries";
import { isOverdue } from "@/modules/tasks/model";
import { AREA_SUBTITLE } from "@/modules/tasks/areas";
import s from "./bereiche.module.css";

export const metadata = { title: "Bereiche · Wesley" };

function hrefFor(slug: string, kind: string) {
  if (kind === "sport") return "/sport";
  if (kind === "money") return "/flouz";
  return `/bereiche/${slug}`;
}

export default async function BereichePage() {
  await requireUser();
  const today = todayISO();
  const [areas, tasks] = await Promise.all([listAreas(), listTasks()]);

  return (
    <>
      <header className="page-head">
        <h1>Bereiche</h1>
      </header>
      <ul className={s.list}>
        {areas.map((a) => {
          const own = tasks.filter((t) => t.area_id === a.id && t.kind === "one_off" && t.status !== "done");
          const overdue = own.filter((t) => isOverdue(t, today)).length;
          return (
            <li key={a.id}>
              <Link href={hrefFor(a.slug, a.kind)} className={s.row}>
                <span className={s.main}>
                  <span className={s.name}>{a.name}</span>
                  <span className="small">{AREA_SUBTITLE[a.slug]}</span>
                </span>
                {a.kind === "tasks" && (
                  <span className={s.count}>
                    <span className={s.num}>{own.length}</span>
                    <span className="small">{overdue > 0 ? <span className={s.overdue}>{overdue} überfällig</span> : "offen"}</span>
                  </span>
                )}
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden className={s.chev} />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
