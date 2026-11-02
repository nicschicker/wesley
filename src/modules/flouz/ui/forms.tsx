"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addExpense, addMember, createGroup, deleteGroup, updateGroup, type FlouzState } from "../actions";
import { CURRENCIES } from "../money";
import type { Member } from "../queries";
import s from "./flouz.module.css";

function CurrencyField({ id, defaultValue }: { id: string; defaultValue: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>Währung</label>
      <input id={id} name="currency" className="input" list={`${id}-list`} defaultValue={defaultValue} maxLength={3} autoCapitalize="characters" required />
      <datalist id={`${id}-list`}>{CURRENCIES.map((c) => <option key={c} value={c} />)}</datalist>
    </div>
  );
}

export function CreateGroupForm() {
  const [state, action, pending] = useActionState<FlouzState, FormData>(createGroup, {});
  return (
    <form action={action} className={s.formGrid}>
      <div className="field" style={{ gridColumn: "span 2" }}>
        <label htmlFor="g-name">Name der Gruppe</label>
        <input id="g-name" name="name" className="input" maxLength={60} required placeholder="z. B. Ferien Split 2027" />
      </div>
      <CurrencyField id="g-cur" defaultValue="CHF" />
      <div className={s.actions}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Erstelle …" : "Gruppe erstellen"}</button>
        {state.error && <p className="error" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}

export function EditGroupForm({ groupId, name, currency }: { groupId: string; name: string; currency: string }) {
  const [state, action, pending] = useActionState<FlouzState, FormData>(updateGroup, {});
  const [delState, delAction, delPending] = useActionState<FlouzState, FormData>(deleteGroup, {});
  return (
    <div className={s.stack}>
      <form action={action} className={s.formGrid}>
        <input type="hidden" name="group_id" value={groupId} />
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label htmlFor="eg-name">Name</label>
          <input id="eg-name" name="name" className="input" defaultValue={name} maxLength={60} required />
        </div>
        <CurrencyField id="eg-cur" defaultValue={currency} />
        <div className={s.actions}>
          <button type="submit" className="btn btn-secondary" disabled={pending}>Speichern</button>
          {state.ok && !pending && <span className="small" role="status">Gespeichert</span>}
          {state.error && <p className="error" role="alert">{state.error}</p>}
        </div>
      </form>
      <form action={delAction} className={s.danger}>
        <input type="hidden" name="group_id" value={groupId} />
        <label className={s.confirm}>
          <input type="checkbox" name="confirm" /> Gruppe mit allen Ausgaben endgültig löschen
        </label>
        <button type="submit" className="btn btn-secondary" disabled={delPending}>Gruppe löschen</button>
        {delState.error && <p className="error" role="alert">{delState.error}</p>}
      </form>
    </div>
  );
}

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<FlouzState, FormData>(addMember, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className={s.inline}>
      <input type="hidden" name="group_id" value={groupId} />
      <label htmlFor="m-email" className="sr-only">E-Mail der Person</label>
      <input id="m-email" name="email" type="email" className="input" placeholder="E-Mail eines Wesley-Kontos" required />
      <button type="submit" className="btn btn-secondary" disabled={pending}>Hinzufügen</button>
      {state.error && <p className="error" role="alert" style={{ flexBasis: "100%" }}>{state.error}</p>}
    </form>
  );
}

export function ExpenseForm({ groupId, members, me, currency, today }: { groupId: string; members: Member[]; me: string; currency: string; today: string }) {
  const [state, action, pending] = useActionState<FlouzState, FormData>(addExpense, {});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} strokeWidth={2} aria-hidden /> Ausgabe erfassen
      </button>
    );
  }

  return (
    <form ref={ref} action={action} className={`${s.formGrid} ${s.panel}`}>
      <input type="hidden" name="group_id" value={groupId} />
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor="e-desc">Wofür?</label>
        <input id="e-desc" name="description" className="input" maxLength={120} required placeholder="z. B. Abendessen Konoba" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="e-amount">Betrag</label>
        <input id="e-amount" name="amount" className="input" inputMode="decimal" required placeholder="0.00" />
      </div>
      <CurrencyField id="e-cur" defaultValue={currency} />
      <div className="field">
        <label htmlFor="e-day">Datum</label>
        <input id="e-day" name="day" type="date" className="input" defaultValue={today} required />
      </div>
      <div className="field">
        <label htmlFor="e-paid">Bezahlt von</label>
        <select id="e-paid" name="paid_by" className="input" defaultValue={me}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.id === me ? `${m.name} (du)` : m.name}</option>)}
        </select>
      </div>
      <fieldset className={s.participants}>
        <legend className="small">Gleichmässig aufteilen auf</legend>
        {members.map((m) => (
          <label key={m.id} className={s.participant}>
            <input type="checkbox" name="participants" value={m.id} defaultChecked /> {m.id === me ? `${m.name} (du)` : m.name}
          </label>
        ))}
      </fieldset>
      <div className={s.actions}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Speichere …" : "Ausgabe speichern"}</button>
        <button type="button" className="btn btn-quiet" onClick={() => setOpen(false)}>Abbrechen</button>
        {state.error && <p className="error" role="alert" style={{ flexBasis: "100%" }}>{state.error}</p>}
      </div>
    </form>
  );
}
