"use client";

import { useActionState, useEffect, useRef } from "react";
import { addExercise, type SportState } from "../actions";

export function AddExerciseForm() {
  const [state, action, pending] = useActionState<SportState, FormData>(addExercise, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} style={{ display: "grid", gap: "var(--s-2)" }}>
      <label htmlFor="new-ex" className="small">Eigene Übung hinzufügen</label>
      <div style={{ display: "flex", gap: "var(--s-2)" }}>
        <input id="new-ex" name="name" className="input" maxLength={60} placeholder="z. B. Face Pulls" required />
        <button type="submit" className="btn btn-secondary" disabled={pending}>Hinzufügen</button>
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
    </form>
  );
}
