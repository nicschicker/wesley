"use client";

import { useActionState } from "react";
import { updateTask, type ActionState } from "../actions";
import type { Task } from "../model";
import { RecurrenceFields } from "./RecurrenceFields";
import s from "./tasks.module.css";

export function TaskEditForm({ task, withModule, modules }: { task: Task; withModule: boolean; modules: string[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateTask, {});
  const p = `t-${task.id.slice(0, 8)}`;

  return (
    <form action={action} className={s.formGrid}>
      <input type="hidden" name="id" value={task.id} />
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${p}-title`}>Titel</label>
        <input id={`${p}-title`} name="title" className="input" defaultValue={task.title} required maxLength={200} />
      </div>
      {withModule && (
        <div className="field">
          <label htmlFor={`${p}-module`}>Modul</label>
          <input id={`${p}-module`} name="module" className="input" list={`${p}-modules`} defaultValue={task.module} maxLength={60} />
          <datalist id={`${p}-modules`}>{modules.map((m) => <option key={m} value={m} />)}</datalist>
        </div>
      )}
      <div className="field">
        <label htmlFor={`${p}-status`}>Status</label>
        <select id={`${p}-status`} name="status" className="input" defaultValue={task.status}>
          <option value="open">Offen</option>
          <option value="in_progress">In Arbeit</option>
          <option value="waiting">Wartet</option>
          <option value="done">Erledigt</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${p}-priority`}>Priorität</label>
        <select id={`${p}-priority`} name="priority" className="input" defaultValue={task.priority}>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Tief</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${p}-due`}>Fällig am</label>
        <input id={`${p}-due`} name="due_date" type="date" className="input" defaultValue={task.due_date ?? ""} />
      </div>
      <RecurrenceFields idPrefix={p} initial={task.recurrence} />
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${p}-notes`}>Notiz</label>
        <textarea id={`${p}-notes`} name="notes" className="input" rows={3} defaultValue={task.notes} maxLength={4000} />
      </div>
      <div className={s.formActions}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Speichere …" : "Speichern"}</button>
        {state.ok && !pending && <span className="small" role="status">Gespeichert</span>}
        {state.error && <p className="error" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}
