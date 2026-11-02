import { dayOfMonth, isoWeekday, lastDayOfMonth, WEEKDAYS_SHORT } from "@/core/date";

export type TaskStatus = "open" | "in_progress" | "waiting" | "done";
export type TaskPriority = "high" | "medium" | "low";

export type Recurrence =
  | { freq: "daily" }
  | { freq: "weekly"; weekdays: number[] } // ISO 1–7
  | { freq: "monthly"; day: number }; // 1–31, fällt in kurzen Monaten auf den letzten Tag

export type Task = {
  id: string;
  area_id: string | null;
  title: string;
  notes: string;
  kind: "one_off" | "recurring";
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  recurrence: Recurrence | null;
  module: string;
  completed_at: string | null;
  created_at: string;
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "Offen",
  in_progress: "In Arbeit",
  waiting: "Wartet",
  done: "Erledigt",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = { high: "Hoch", medium: "Mittel", low: "Tief" };
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Ist ein wiederkehrender Task an diesem Tag fällig? */
export function isDueOn(rec: Recurrence | null, iso: string): boolean {
  if (!rec) return false;
  switch (rec.freq) {
    case "daily":
      return true;
    case "weekly":
      return rec.weekdays.includes(isoWeekday(iso));
    case "monthly":
      return dayOfMonth(iso) === Math.min(rec.day, lastDayOfMonth(iso));
  }
}

export function describeRecurrence(rec: Recurrence | null): string {
  if (!rec) return "";
  switch (rec.freq) {
    case "daily":
      return "täglich";
    case "weekly": {
      const d = [...rec.weekdays].sort();
      if (d.join() === "1,2,3,4,5") return "werktags";
      return d.map((n) => WEEKDAYS_SHORT[n - 1]).join(", ");
    }
    case "monthly":
      return `monatlich am ${rec.day}.`;
  }
}

/** Aus Formularfeldern eine Wiederholung bauen (oder null für einmalig). */
export function parseRecurrence(freq: string, weekdays: string[], day: string): Recurrence | null {
  if (freq === "daily") return { freq: "daily" };
  if (freq === "weekly") {
    const w = [...new Set(weekdays.map(Number).filter((n) => n >= 1 && n <= 7))].sort();
    return w.length ? { freq: "weekly", weekdays: w } : null;
  }
  if (freq === "monthly") {
    const n = Number(day);
    return n >= 1 && n <= 31 ? { freq: "monthly", day: Math.floor(n) } : null;
  }
  return null;
}

/** Sortierung: nach Priorität (dann Fälligkeit) oder nach Modul (dann Priorität). */
export function sortTasks(tasks: Task[], mode: "priority" | "module"): Task[] {
  const due = (t: Task) => t.due_date ?? "9999-12-31";
  return [...tasks].sort((a, b) => {
    if (mode === "module") {
      const ma = a.module || "￿";
      const mb = b.module || "￿";
      if (ma !== mb) return ma.localeCompare(mb, "de-CH");
    }
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    const d = due(a).localeCompare(due(b));
    if (d !== 0) return d;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function isOverdue(t: Task, today: string): boolean {
  return t.kind === "one_off" && t.status !== "done" && !!t.due_date && t.due_date < today;
}
