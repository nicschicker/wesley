"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { createTask, type ActionState } from "../actions";
import { RecurrenceFields } from "./RecurrenceFields";
import s from "./tasks.module.css";

export function QuickAdd({ areaId, withModule, modules }: { areaId: string; withModule: boolean; modules: string[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createTask, {});
  const [more, setMore] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      form.current?.reset();
      form.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus();
    }
  }, [state]);

  return (
    <form ref={form} action={action} className={s.quickAdd}>
      <input type="hidden" name="area_id" value={areaId} />
      <div className={s.quickRow}>
        <label htmlFor="qa-title" className="sr-only">Neuer Task</label>
        <input id="qa-title" name="title" className="input" placeholder="Neuer Task … Enter zum Speichern" required maxLength={200} autoComplete="off" />
        <button type="button" className="btn btn-secondary" onClick={() => setMore((v) => !v)} aria-expanded={more} aria-label="Weitere Felder">
          <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden />
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending} aria-label="Task anlegen">
          <Plus size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {more && (
        <div className={s.formGrid}>
          {withModule && (
            <div className="field">
              <label htmlFor="qa-module">Modul</label>
              <input id="qa-module" name="module" className="input" list="qa-modules" maxLength={60} placeholder="z. B. Finanzmanagement" />
              <datalist id="qa-modules">{modules.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
          )}
          <div className="field">
            <label htmlFor="qa-priority">Priorität</label>
            <select id="qa-priority" name="priority" className="input" defaultValue="medium">
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Tief</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="qa-due">Fällig am</label>
            <input id="qa-due" name="due_date" type="date" className="input" />
          </div>
          <RecurrenceFields idPrefix="qa" />
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="qa-notes">Notiz</label>
            <textarea id="qa-notes" name="notes" className="input" rows={2} maxLength={4000} />
          </div>
        </div>
      )}
      {state.error && <p className="error" role="alert">{state.error}</p>}
    </form>
  );
}
