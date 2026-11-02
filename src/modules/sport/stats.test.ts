import { describe, expect, it } from "vitest";
import { aggregateByDay, epley } from "./stats";

describe("Trainings-Statistik", () => {
  it("Epley: 100 kg × 5 ≈ 116.7 kg", () => {
    expect(epley(100, 5)).toBeCloseTo(116.67, 1);
    expect(epley(100, 1)).toBe(100);
  });

  it("fasst Sätze pro Tag zusammen, älteste zuerst", () => {
    const stats = aggregateByDay([
      { day: "2026-11-02", reps: 8, weight_kg: 80 },
      { day: "2026-11-02", reps: 5, weight_kg: 90 },
      { day: "2026-10-30", reps: 10, weight_kg: 70 },
    ]);
    expect(stats.map((s) => s.day)).toEqual(["2026-10-30", "2026-11-02"]);
    expect(stats[1]).toMatchObject({ sets: 2, bestWeight: 90, bestReps: 5, volume: 1090 });
    expect(stats[1].est1rm).toBe(105);
  });

  it("Körpergewicht-Übungen: max. Wiederholungen statt Gewicht", () => {
    const [s] = aggregateByDay([
      { day: "2026-11-02", reps: 12, weight_kg: null },
      { day: "2026-11-02", reps: 9, weight_kg: null },
    ]);
    expect(s).toMatchObject({ bestWeight: null, bestReps: 12, volume: 0, est1rm: null });
  });
});
