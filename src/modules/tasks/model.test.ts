import { describe, expect, it } from "vitest";
import { isDueOn, parseRecurrence, sortTasks, describeRecurrence, type Task } from "./model";

const base: Task = {
  id: "1", area_id: null, title: "x", notes: "", kind: "one_off", status: "open",
  priority: "medium", due_date: null, recurrence: null, module: "", completed_at: null,
  created_at: "2026-11-01T00:00:00Z",
};

describe("Wiederholungen", () => {
  it("täglich ist immer fällig", () => {
    expect(isDueOn({ freq: "daily" }, "2026-11-02")).toBe(true);
  });
  it("wöchentlich nach ISO-Wochentag (02.11.2026 ist ein Montag)", () => {
    expect(isDueOn({ freq: "weekly", weekdays: [1] }, "2026-11-02")).toBe(true);
    expect(isDueOn({ freq: "weekly", weekdays: [2, 3] }, "2026-11-02")).toBe(false);
    expect(isDueOn({ freq: "weekly", weekdays: [7] }, "2026-11-08")).toBe(true);
  });
  it("monatlich am 31. fällt in kurzen Monaten auf den letzten Tag", () => {
    expect(isDueOn({ freq: "monthly", day: 31 }, "2026-11-30")).toBe(true);
    expect(isDueOn({ freq: "monthly", day: 31 }, "2026-02-28")).toBe(true);
    expect(isDueOn({ freq: "monthly", day: 15 }, "2026-11-14")).toBe(false);
  });
  it("Formular wird korrekt gelesen", () => {
    expect(parseRecurrence("weekly", ["3", "1", "1", "9"], "")).toEqual({ freq: "weekly", weekdays: [1, 3] });
    expect(parseRecurrence("weekly", [], "")).toBeNull();
    expect(parseRecurrence("none", [], "")).toBeNull();
    expect(describeRecurrence({ freq: "weekly", weekdays: [1, 2, 3, 4, 5] })).toBe("werktags");
  });
});

describe("Sortierung", () => {
  const tasks: Task[] = [
    { ...base, id: "a", priority: "low", module: "Mathe" },
    { ...base, id: "b", priority: "high", module: "Recht" },
    { ...base, id: "c", priority: "high", module: "Mathe", due_date: "2026-11-10" },
    { ...base, id: "d", priority: "high", module: "", due_date: "2026-11-05" },
  ];
  it("nach Priorität, dann Fälligkeit", () => {
    expect(sortTasks(tasks, "priority").map((t) => t.id)).toEqual(["d", "c", "b", "a"]);
  });
  it("nach Modul, dann Priorität; ohne Modul zuletzt", () => {
    expect(sortTasks(tasks, "module").map((t) => t.id)).toEqual(["c", "a", "b", "d"]);
  });
});
