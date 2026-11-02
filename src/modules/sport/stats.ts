export type SetRow = { day: string; reps: number; weight_kg: number | null };

export type DayStat = {
  day: string;
  sets: number;
  bestWeight: number | null; // schwerstes Gewicht des Tages
  bestReps: number; // Wiederholungen beim schwersten Satz (bzw. max. Wdh. ohne Gewicht)
  volume: number; // Summe Wdh. × kg
  est1rm: number | null; // geschätztes 1RM nach Epley, bester Satz des Tages
};

/** Epley-Formel; bei 1 Wiederholung = Gewicht. */
export function epley(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Sätze einer Übung pro Trainingstag zusammenfassen, älteste zuerst. */
export function aggregateByDay(rows: SetRow[]): DayStat[] {
  const byDay = new Map<string, SetRow[]>();
  for (const r of rows) {
    const list = byDay.get(r.day) ?? [];
    list.push(r);
    byDay.set(r.day, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, sets]) => {
      const weighted = sets.filter((s) => s.weight_kg != null && s.weight_kg > 0);
      let bestWeight: number | null = null;
      let bestReps = 0;
      let est1rm: number | null = null;
      for (const s of weighted) {
        const w = s.weight_kg as number;
        if (bestWeight === null || w > bestWeight || (w === bestWeight && s.reps > bestReps)) {
          bestWeight = w;
          bestReps = s.reps;
        }
        const e = epley(w, s.reps);
        if (est1rm === null || e > est1rm) est1rm = e;
      }
      if (bestWeight === null) bestReps = Math.max(0, ...sets.map((s) => s.reps));
      const volume = weighted.reduce((sum, s) => sum + s.reps * (s.weight_kg as number), 0);
      return {
        day,
        sets: sets.length,
        bestWeight,
        bestReps,
        volume: Math.round(volume * 10) / 10,
        est1rm: est1rm === null ? null : Math.round(est1rm * 10) / 10,
      };
    });
}

export function formatKg(n: number | null): string {
  if (n === null) return "–";
  return `${Number.isInteger(n) ? n : n.toFixed(1)} kg`;
}
