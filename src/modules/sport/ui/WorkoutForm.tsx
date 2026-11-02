"use client";

import { useActionState, useEffect, useState } from "react";
import { Copy, Plus, Trash2, X } from "lucide-react";
import { saveWorkout, type SportState } from "../actions";
import type { Exercise } from "../queries";
import s from "./sport.module.css";

type SetInput = { reps: string; weight: string };
type Block = { key: number; exerciseId: string; sets: SetInput[] };

let nextKey = 1;
const emptySet = (): SetInput => ({ reps: "", weight: "" });
const newBlock = (): Block => ({ key: nextKey++, exerciseId: "", sets: [emptySet(), emptySet(), emptySet()] });

export function WorkoutForm({ exercises, today }: { exercises: Exercise[]; today: string }) {
  const [state, action, pending] = useActionState<SportState, FormData>(saveWorkout, {});
  const [day, setDay] = useState(today);
  const [note, setNote] = useState("");
  const [blocks, setBlocks] = useState<Block[]>(() => [newBlock()]);

  useEffect(() => {
    if (state.ok) {
      setBlocks([newBlock()]);
      setNote("");
    }
  }, [state]);

  const update = (key: number, fn: (b: Block) => Block) => setBlocks((bs) => bs.map((b) => (b.key === key ? fn(b) : b)));

  const payload = JSON.stringify({
    day,
    note: note.trim(),
    exercises: blocks
      .filter((b) => b.exerciseId || b.sets.some((x) => x.reps || x.weight))
      .map((b) => ({
        exerciseId: b.exerciseId,
        sets: b.sets
          .filter((x) => x.reps !== "" || x.weight !== "")
          .map((x) => ({
            reps: Math.max(0, Math.round(Number(x.reps) || 0)),
            weight: x.weight === "" ? null : Math.max(0, Number(x.weight.replace(",", ".")) || 0),
          })),
      })),
  });

  return (
    <form action={action} className={s.form}>
      <input type="hidden" name="payload" value={payload} />
      <div className={s.headRow}>
        <div className="field">
          <label htmlFor="w-day">Datum</label>
          <input id="w-day" type="date" className="input" value={day} onChange={(e) => setDay(e.target.value)} required />
        </div>
        <div className="field" style={{ flex: "1 1 200px" }}>
          <label htmlFor="w-note">Notiz</label>
          <input id="w-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="z. B. Push-Tag, gut geschlafen" />
        </div>
      </div>

      {blocks.map((b, bi) => (
        <fieldset key={b.key} className={s.block}>
          <legend className="sr-only">Übung {bi + 1}</legend>
          <div className={s.blockHead}>
            <span className={s.blockNo}>{bi + 1}</span>
            <label htmlFor={`ex-${b.key}`} className="sr-only">Übung</label>
            <select id={`ex-${b.key}`} className="input" value={b.exerciseId} onChange={(e) => update(b.key, (x) => ({ ...x, exerciseId: e.target.value }))}>
              <option value="">Übung wählen …</option>
              {exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            {blocks.length > 1 && (
              <button type="button" className="btn btn-quiet" onClick={() => setBlocks((bs) => bs.filter((x) => x.key !== b.key))} aria-label={`Übung ${bi + 1} entfernen`}>
                <Trash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>

          <div className={s.setsHead} aria-hidden>
            <span>Satz</span><span>Wdh.</span><span>kg</span><span />
          </div>
          {b.sets.map((set, si) => (
            <div key={si} className={s.setRow}>
              <span className={s.setNo}>{si + 1}</span>
              <input
                aria-label={`Satz ${si + 1} Wiederholungen`} className="input" inputMode="numeric" value={set.reps} placeholder="10"
                onChange={(e) => update(b.key, (x) => ({ ...x, sets: x.sets.map((y, i) => (i === si ? { ...y, reps: e.target.value.replace(/[^\d]/g, "") } : y)) }))}
              />
              <input
                aria-label={`Satz ${si + 1} Gewicht in kg`} className="input" inputMode="decimal" value={set.weight} placeholder="–"
                onChange={(e) => update(b.key, (x) => ({ ...x, sets: x.sets.map((y, i) => (i === si ? { ...y, weight: e.target.value.replace(/[^\d.,]/g, "") } : y)) }))}
              />
              <button type="button" className="btn btn-quiet" aria-label={`Satz ${si + 1} entfernen`} disabled={b.sets.length === 1}
                onClick={() => update(b.key, (x) => ({ ...x, sets: x.sets.filter((_, i) => i !== si) }))}>
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ))}
          <div className={s.blockActions}>
            <button type="button" className="btn btn-quiet" onClick={() => update(b.key, (x) => ({ ...x, sets: [...x.sets, emptySet()] }))}>
              <Plus size={16} strokeWidth={2} aria-hidden /> Satz
            </button>
            <button type="button" className="btn btn-quiet" disabled={!b.sets.length}
              onClick={() => update(b.key, (x) => ({ ...x, sets: [...x.sets, { ...x.sets[x.sets.length - 1] }] }))}>
              <Copy size={16} strokeWidth={1.75} aria-hidden /> Letzten kopieren
            </button>
          </div>
        </fieldset>
      ))}

      <div className={s.formActions}>
        <button type="button" className="btn btn-secondary" onClick={() => setBlocks((bs) => [...bs, newBlock()])}>
          <Plus size={18} strokeWidth={2} aria-hidden /> Übung hinzufügen
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Speichere …" : "Training speichern"}</button>
      </div>
      <p className="small">Gewicht leer lassen bei Körpergewicht-Übungen. Leere Sätze werden ignoriert.</p>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.ok && !pending && <p className="small" role="status">Training gespeichert.</p>}
    </form>
  );
}
