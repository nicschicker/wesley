import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { todayISO } from "@/core/date";
import { completedOn, listAreas, listTasks } from "@/modules/tasks/queries";
import { isDueOn, isOverdue, sortTasks } from "@/modules/tasks/model";
import { TaskItem } from "@/modules/tasks/ui/TaskItem";
import ts from "@/modules/tasks/ui/tasks.module.css";
import styles from "./heute.module.css";

export const metadata = { title: "Heute · Wesley" };

function todayParts() {
  const now = new Date();
  const tz = "Europe/Zurich";
  return {
    weekday: new Intl.DateTimeFormat("de-CH", { weekday: "long", timeZone: tz }).format(now),
    date: new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: tz }).format(now),
    hour: Number(new Intl.DateTimeFormat("de-CH", { hour: "numeric", hour12: false, timeZone: tz }).format(now)),
  };
}

function greeting(hour: number) {
  if (hour < 11) return "Guten Morgen";
  if (hour < 17) return "Hallo";
  return "Guten Abend";
}

export default async function HeutePage() {
  const user = await requireUser();
  const t = todayParts();
  const today = todayISO();
  const [areas, tasks, doneToday] = await Promise.all([listAreas(), listTasks(), completedOn(today)]);
  const areaName = new Map(areas.map((a) => [a.id, a.name]));

  const routines = tasks.filter((x) => x.kind === "recurring" && isDueOn(x.recurrence, today));
  const done = routines.filter((x) => doneToday.has(x.id)).length;
  const total = routines.length;
  const complete = total > 0 && done === total;

  const oneOffOpen = tasks.filter((x) => x.kind === "one_off" && x.status !== "done");
  const due = sortTasks(oneOffOpen.filter((x) => x.due_date && x.due_date <= today), "priority");
  const inProgress = sortTasks(
    oneOffOpen.filter((x) => x.status === "in_progress" && !(x.due_date && x.due_date <= today)),
    "priority",
  );
  const overdueCount = due.filter((x) => isOverdue(x, today)).length;

  return (
    <>
      <header className={styles.matchday}>
        <div className={styles.dateBlock}>
          <p className="label">{t.weekday}</p>
          <p className={styles.date}>{t.date}</p>
          <p className="small">{greeting(t.hour)}, {user.displayName}.</p>
        </div>
        <div className={styles.score} aria-label={`Tagesroutine: ${done} von ${total} erledigt`}>
          <p className="label">Tagesroutine</p>
          <p className={`${styles.scoreValue} ${complete ? styles.scoreDone : ""}`}>
            {done}<span className={styles.colon}>:</span>{total}
          </p>
          <div className={styles.bar}><div className={styles.barFill} style={{ width: total ? `${(done / total) * 100}%` : "0%" }} /></div>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={ts.section} aria-labelledby="h-due">
          <div className={ts.sectionHead}>
            <h2 id="h-due">Heute fällig</h2>
            {overdueCount > 0 && <span className={ts.overdue}>{overdueCount} überfällig</span>}
          </div>
          {due.length === 0 ? (
            <div className="empty-box">
              <p>Nichts fällig. Gut so.</p>
              <p className="small">Tasks mit Fälligkeitsdatum aus allen Bereichen erscheinen hier.</p>
            </div>
          ) : (
            <ul className={ts.list}>
              {due.map((x) => <TaskItem key={x.id} task={x} today={today} areaName={areaName.get(x.area_id ?? "")} />)}
            </ul>
          )}

          {inProgress.length > 0 && (
            <>
              <h2 style={{ marginTop: "var(--s-5)" }}>In Arbeit</h2>
              <ul className={ts.list}>
                {inProgress.map((x) => <TaskItem key={x.id} task={x} today={today} areaName={areaName.get(x.area_id ?? "")} />)}
              </ul>
            </>
          )}
        </section>

        <aside className={styles.side}>
          <section className={ts.section} aria-labelledby="h-routines">
            <h2 id="h-routines">Routinen heute</h2>
            {routines.length === 0 ? (
              <div className="empty-box">
                <p className="small">
                  Lege in einem Bereich einen Task mit Wiederholung «Täglich» oder «An Wochentagen» an, z. B. in{" "}
                  <Link href="/bereiche/harbejt">Harbejt</Link>. Er zählt dann hier zum Spielstand.
                </p>
              </div>
            ) : (
              <ul className={ts.list}>
                {routines.map((x) => (
                  <TaskItem key={x.id} task={x} today={today} doneToday={doneToday.has(x.id)} areaName={areaName.get(x.area_id ?? "")} />
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
