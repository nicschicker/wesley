"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { register, type RegisterState } from "./actions";
import styles from "../auth.module.css";

function RegisterForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, {});
  const f = state.fields;

  return (
    <form action={action} className={styles.form}>
      <div className={styles.heading}>
        <h1>Registrieren</h1>
        <p className="small">Wesley ist nur mit Einladung nutzbar. Den Code bekommst du von Nic.</p>
      </div>
      <div className="field">
        <label htmlFor="code">Einladungscode</label>
        <input
          id="code" name="code" required className="input" placeholder="WES-XXXX-XXXX"
          autoCapitalize="characters" autoComplete="off"
          defaultValue={f?.code ?? params.get("einladung") ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="displayName">Dein Name</label>
        <input id="displayName" name="displayName" required className="input" autoComplete="given-name" defaultValue={f?.displayName} />
      </div>
      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" defaultValue={f?.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort</label>
        <input id="password" name="password" type="password" required minLength={10} className="input" autoComplete="new-password" />
        <p className="small">Mindestens 10 Zeichen. Face ID kannst du danach in den Einstellungen einrichten.</p>
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Lege Konto an …" : "Konto anlegen"}
      </button>
      <p className={styles.footer}>
        Schon ein Konto? <Link href="/login">Anmelden</Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
