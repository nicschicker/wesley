"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import styles from "../auth.module.css";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className={styles.form}>
      <div className={styles.heading}>
        <h1>Anmelden</h1>
        <p className="small">Mit deiner E-Mail und deinem Passwort.</p>
      </div>
      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input id="email" name="email" type="email" autoComplete="username webauthn" required className="input" />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Melde an …" : "Anmelden"}
      </button>
      <p className={styles.footer}>
        Neu hier? <Link href="/registrieren">Mit Einladungscode registrieren</Link>
      </p>
    </form>
  );
}
