import { Trash2 } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { formatDate, todayISO } from "@/core/date";
import { exerciseSets, listExercises, listWorkouts, trainedExerciseIds } from "@/modules/sport/queries";
import { aggregateByDay, formatKg } from "@/modules/sport/stats";
import { deleteWorkout } from "@/modules/sport/actions";
import { WorkoutForm } from "@/modules/sport/ui/WorkoutForm";
import { AddExerciseForm } from "@/modules/sport/ui/AddExerciseForm";
import { ProgressChart } from "@/modules/sport/ui/ProgressChart";
import { AutoSubmitSelect } from "@/modules/tasks/ui/AutoSubmitSelect";
import ts from "@/modules/tasks/ui/tasks.module.css";
import s from "@/modules/sport/ui/sport.module.css";

export const metadata = { title: "Sport · Wesley" };

function describeSets(sets: { reps: number; weight_kg: number | null }[]) {
  // Gleiche Sätze zusammenfassen: «3 × 10 × 60 kg»
  const parts: string[] = [];
  let i = 0;
  while (i < sets.length) {
    let j = i;
    while (j + 1 < sets.length && sets[j + 1].reps === sets[i].reps && sets[j + 1].weight_kg === sets[i].weight_kg) j++;
    const n = j - i + 1;
    const w = sets[i].weight_kg !== null ? ` × ${formatKg(sets[i].weight_kg)}` : "";
    parts.push(`${n > 1 ? `${n} × ` : ""}${sets[i].reps}${w}`);
    i = j + 1;
  }
  return parts.join(", ");
}

export default async function SportPage({ searchParams }: { searchParams: Promise<{ uebung?: string }> }) {
  await requireUser();
  const { uebung } = await searchParams;
  const today = todayISO();
  const [exercises, workouts, trained] = await Promise.all([listExercises(), listWorkouts(), trainedExerciseIds()]);
  const trainedList = exercises.filter((e) => trained.has(e.id));
  const selected = trainedList.find((e) => e.id === uebung) ?? trainedList[0];
  const stats = selected ? aggregateByDay(await exerciseSets(selected.id)) : [];
  const best = stats.reduce<number | null>((m, d) => (d.bestWeight !== null && (m === null || d.bestWeight > m) ? d.bestWeight : m), null);

  return (
    <>
      <header className="page-head">
        <p className="label">Training</p>
        <h1>Sport</h1>
      </header>

      <div className="two-col">
        <div style={{ display: "grid", gap: "var(--s-6)", minWidth: 0 }}>
          <section className={ts.section} aria-labelledby="h-new">
            <h2 id="h-new">Training erfassen</h2>
            <WorkoutForm exercises={exercises} today={today} />
          </section>

          <section className={ts.section} aria-labelledby="h-history">
            <h2 id="h-history">Letzte Trainings</h2>
            {workouts.length === 0 ? (
              <div className="empty-box"><p>Noch keine Trainings gespeichert.</p><p className="small">Dein erstes Training erscheint hier mit allen Sätzen.</p></div>
            ) : (
              <ul className={s.history}>
                {workouts.map((w) => (
                  <li key={w.id} className={s.workout}>
                    <div className={s.workoutHead}>
                      <span className={s.workoutDate}>{formatDate(w.day)}</span>
                      <form action={deleteWorkout}>
                        <input type="hidden" name="id" value={w.id} />
                        <button type="submit" className="btn btn-quiet" aria-label={`Training vom ${formatDate(w.day)} löschen`}>
                          <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                        </button>
                      </form>
                    </div>
                    {w.note && <p className="small">{w.note}</p>}
                    {w.exercises.map((ex, i) => (
                      <div key={i} className={s.exLine}>
                        <span>{ex.name}</span>
                        <span className={s.exSets}>{describeSets(ex.sets)}</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div style={{ display: "grid", gap: "var(--s-6)", minWidth: 0 }}>
          <section className={ts.section} aria-labelledby="h-progress">
            <h2 id="h-progress">Fortschritt</h2>
            {!selected ? (
              <div className="empty-box"><p className="small">Sobald du ein Training gespeichert hast, siehst du hier den Verlauf pro Übung.</p></div>
            ) : (
              <>
                <form method="get" className={s.pick}>
                  <div className="field">
                    <label htmlFor="uebung">Übung</label>
                    <AutoSubmitSelect id="uebung" name="uebung" className="input" defaultValue={selected.id}>
                      {trainedList.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </AutoSubmitSelect>
                  </div>
                  <noscript><button type="submit" className="btn btn-secondary">Anzeigen</button></noscript>
                </form>
                {best !== null && <p className="small">Bestwert: <strong>{formatKg(best)}</strong></p>}
                <ProgressChart stats={stats} />
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr><th>Datum</th><th className={s.num}>Sätze</th><th className={s.num}>Schwerster Satz</th><th className={s.num}>Volumen</th><th className={s.num}>Gesch. 1RM</th></tr>
                    </thead>
                    <tbody>
                      {[...stats].reverse().slice(0, 12).map((d) => (
                        <tr key={d.day}>
                          <td>{formatDate(d.day)}</td>
                          <td className={s.num}>{d.sets}</td>
                          <td className={s.num}>{d.bestWeight !== null ? `${d.bestReps} × ${formatKg(d.bestWeight)}` : `${d.bestReps} Wdh.`}</td>
                          <td className={s.num}>{d.volume ? `${d.volume} kg` : "–"}</td>
                          <td className={s.num}>{formatKg(d.est1rm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className={ts.section} aria-labelledby="h-ex">
            <h2 id="h-ex">Übungen</h2>
            <p className="small">{exercises.length} Übungen in deiner Liste.</p>
            <AddExerciseForm />
          </section>
        </div>
      </div>
    </>
  );
}
