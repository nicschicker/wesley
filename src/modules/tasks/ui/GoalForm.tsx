"use client";

import { useActionState, useEffect, useRef } from "react";
import { createGoal, updateGoal, type ActionState } from "../actions";
import type { Goal } from "../queries";
import s from "./tasks.module.css";

export function GoalForm({ areaId, goal }: { areaId: string; goal?: Goal }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(goal ? updateGoal : createGoal, {});
  const form = useRef<HTMLFormElement>(null);
  const p = goal ? `g-${goal.id.slice(0, 8)}` : "g-new";

  useEffect(() => {
    if (state.ok && !goal) form.current?.reset();
  }, [state, goal]);

  return (
    <form ref={form} action={action} className={s.formGrid}>
      {goal ? <input type="hidden" name="id" value={goal.id} /> : <input type="hidden" name="area_id" value={areaId} />}
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${p}-title`}>Ziel</label>
        <input id={`${p}-title`} name="title" className="input" defaultValue={goal?.title} required maxLength={160} placeholder="z. B. Bachelorarbeit mit 5.5 abschliessen" />
      </div>
      <div className="field">
        <label htmlFor={`${p}-date`}>Bis</label>
        <input id={`${p}-date`} name="target_date" type="date" className="input" defaultValue={goal?.target_date ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`${p}-progress`}>Fortschritt (%)</label>
        <input id={`${p}-progress`} name="progress" type="number" min={0} max={100} step={5} className="input" defaultValue={goal?.progress ?? 0} />
      </div>
      <div className="field">
        <label htmlFor={`${p}-status`}>Status</label>
        <select id={`${p}-status`} name="status" className="input" defaultValue={goal?.status ?? "active"}>
          <option value="active">Aktiv</option>
          <option value="achieved">Erreicht</option>
          <option value="dropped">Verworfen</option>
        </select>
      </div>
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${p}-notes`}>Notiz</label>
        <textarea id={`${p}-notes`} name="notes" className="input" rows={2} defaultValue={goal?.notes} maxLength={4000} />
      </div>
      <div className={s.formActions}>
        <button type="submit" className={goal ? "btn btn-primary" : "btn btn-secondary"} disabled={pending}>
          {pending ? "Speichere …" : goal ? "Speichern" : "Ziel hinzufügen"}
        </button>
        {state.ok && goal && !pending && <span className="small" role="status">Gespeichert</span>}
        {state.error && <p className="error" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}
