import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { todayISO } from "@/core/date";
import { getAreaBySlug, listGoals, listTasks, completedOn } from "@/modules/tasks/queries";
import { isDueOn, sortTasks, type TaskStatus } from "@/modules/tasks/model";
import { QuickAdd } from "@/modules/tasks/ui/QuickAdd";
import { TaskItem } from "@/modules/tasks/ui/TaskItem";
import { GoalsSection } from "@/modules/tasks/ui/GoalsSection";
import { AREA_SUBTITLE } from "@/modules/tasks/areas";
import s from "@/modules/tasks/ui/tasks.module.css";

const FILTERS: { key: "alle" | TaskStatus; label: string }[] = [
  { key: "alle", label: "Alle offenen" },
  { key: "open", label: "Offen" },
  { key: "in_progress", label: "In Arbeit" },
  { key: "waiting", label: "Wartet" },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  return { title: `${area.name} · Wesley` };
}

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const { status = "alle" } = await searchParams;
  const area = await getAreaBySlug(slug);
  const today = todayISO();
  const [tasks, goals, doneToday] = await Promise.all([listTasks(area.id), listGoals(area.id), completedOn(today)]);

  const withModule = area.sort_mode === "module";
  const modules = [...new Set(tasks.map((t) => t.module).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de-CH"));

  const routines = tasks.filter((t) => t.kind === "recurring");
  const routinesToday = routines.filter((t) => isDueOn(t.recurrence, today));
  const routinesOther = routines.filter((t) => !isDueOn(t.recurrence, today));
  const oneOff = tasks.filter((t) => t.kind === "one_off");
  const open = sortTasks(
    oneOff.filter((t) => t.status !== "done" && (status === "alle" || t.status === status)),
    area.sort_mode,
  );
  const done = oneOff.filter((t) => t.status === "done");

  // Bei Škola nach Modul gruppieren
  const groups: { label: string; items: typeof open }[] = [];
  if (withModule) {
    for (const t of open) {
      const label = t.module || "Ohne Modul";
      const g = groups.find((x) => x.label === label);
      if (g) g.items.push(t);
      else groups.push({ label, items: [t] });
    }
  } else {
    groups.push({ label: "", items: open });
  }

  const itemProps = { today, withModule, modules };

  return (
    <>
      <header className="page-head">
        <p className="label">{AREA_SUBTITLE[area.slug] ?? "Bereich"}</p>
        <h1>{area.name}</h1>
      </header>

      <div className="two-col">
        <div style={{ display: "grid", gap: "var(--s-6)", minWidth: 0 }}>
          <section className={s.section} aria-labelledby="h-tasks">
            <div className={s.sectionHead}>
              <h2 id="h-tasks">Tasks</h2>
              <span className="small">sortiert nach {withModule ? "Modul und Priorität" : "Priorität und Fälligkeit"}</span>
            </div>
            <QuickAdd areaId={area.id} withModule={withModule} modules={modules} />
            <nav className="tabs" aria-label="Nach Status filtern">
              {FILTERS.map((f) => (
                <Link key={f.key} href={f.key === "alle" ? `/bereiche/${slug}` : `/bereiche/${slug}?status=${f.key}`} className="tab-link" aria-current={status === f.key ? "true" : undefined}>
                  {f.label}
                </Link>
              ))}
            </nav>

            {open.length === 0 ? (
              <div className="empty-box">
                <p>{status === "alle" ? "Keine offenen Tasks." : "Keine Tasks mit diesem Status."}</p>
                <p className="small">Erfasse oben einen neuen Task. Über das Regler-Symbol setzt du Priorität, Fälligkeit{withModule ? ", Modul" : ""} und Wiederholung.</p>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.label || "all"}>
                  {g.label && <p className={`label ${s.groupLabel}`}>{g.label}</p>}
                  <ul className={s.list}>{g.items.map((t) => <TaskItem key={t.id} task={t} {...itemProps} />)}</ul>
                </div>
              ))
            )}

            {done.length > 0 && (
              <details className={s.doneBlock}>
                <summary>Erledigt ({done.length})</summary>
                <ul className={s.list}>{done.map((t) => <TaskItem key={t.id} task={t} {...itemProps} />)}</ul>
              </details>
            )}
          </section>

          {routines.length > 0 && (
            <section className={s.section} aria-labelledby="h-routines">
              <div className={s.sectionHead}>
                <h2 id="h-routines">Routinen</h2>
                <span className="small">{routinesToday.filter((t) => doneToday.has(t.id)).length} von {routinesToday.length} heute erledigt</span>
              </div>
              {routinesToday.length > 0 && (
                <ul className={s.list}>{routinesToday.map((t) => <TaskItem key={t.id} task={t} doneToday={doneToday.has(t.id)} {...itemProps} />)}</ul>
              )}
              {routinesOther.length > 0 && (
                <details className={s.doneBlock}>
                  <summary>Heute nicht fällig ({routinesOther.length})</summary>
                  <ul className={s.list}>{routinesOther.map((t) => <TaskItem key={t.id} task={t} {...itemProps} />)}</ul>
                </details>
              )}
            </section>
          )}
        </div>

        <GoalsSection areaId={area.id} goals={goals} />
      </div>
    </>
  );
}
