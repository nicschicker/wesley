"use client";

import { useActionState, useState } from "react";
import { Copy } from "lucide-react";
import { createInvitation, type CreateInviteState } from "./actions";
import styles from "./admin.module.css";

export function InviteForm() {
  const [state, action, pending] = useActionState<CreateInviteState, FormData>(createInvitation, {});
  const [copied, setCopied] = useState(false);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form action={action} className={styles.form}>
      <div className={styles.row}>
        <div className="field" style={{ flex: "2 1 220px" }}>
          <label htmlFor="note">Für wen?</label>
          <input id="note" name="note" className="input" placeholder="z. B. Kollege Marco" maxLength={80} />
        </div>
        <div className="field" style={{ flex: "1 1 120px" }}>
          <label htmlFor="days">Gültig (Tage)</label>
          <input id="days" name="days" type="number" min={1} max={30} defaultValue={7} className="input" />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Erstelle …" : "Einladung erstellen"}
      </button>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.code && (
        <div className={styles.codeBox} role="status">
          <p className="label">Neuer Code, wird nur jetzt angezeigt</p>
          <p className={styles.code}>{state.code}</p>
          <button type="button" className="btn btn-secondary" onClick={() => copy(state.code!)}>
            <Copy size={18} strokeWidth={1.75} aria-hidden /> {copied ? "Kopiert" : "Code kopieren"}
          </button>
        </div>
      )}
    </form>
  );
}
