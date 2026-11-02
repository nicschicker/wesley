import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Trash2, X } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { formatDate, todayISO } from "@/core/date";
import { getGroup } from "@/modules/flouz/queries";
import { formatMoney, openDebts } from "@/modules/flouz/money";
import { deleteExpense, removeMember, settleBetween, toggleSettled } from "@/modules/flouz/actions";
import { AddMemberForm, EditGroupForm, ExpenseForm } from "@/modules/flouz/ui/forms";
import ts from "@/modules/tasks/ui/tasks.module.css";
import s from "@/modules/flouz/ui/flouz.module.css";

export const metadata = { title: "Gruppe · Flouz · Wesley" };

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { group, members, expenses } = await getGroup(id);
  const name = new Map(members.map((m) => [m.id, m.id === user.id ? "Du" : m.name]));
  const who = (uid: string) => name.get(uid) ?? "Ehemaliges Mitglied";
  const debts = openDebts(expenses);

  return (
    <>
      <header className="page-head">
        <Link href="/flouz" className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} aria-hidden /> Alle Gruppen
        </Link>
        <h1>{group.name}</h1>
      </header>

      <div className="two-col">
        <div style={{ display: "grid", gap: "var(--s-6)", minWidth: 0 }}>
          <section className={ts.section} aria-labelledby="h-debts">
            <h2 id="h-debts">Offene Schulden</h2>
            {debts.length === 0 ? (
              <p className="small">Alles ausgeglichen.</p>
            ) : (
              <ul className={s.debts}>
                {debts.map((d) => (
                  <li key={`${d.from}-${d.to}-${d.currency}`} className={s.debt}>
                    <span>
                      <strong>{who(d.from)}</strong> {d.from === user.id ? "schuldest" : "schuldet"} <strong>{d.to === user.id ? "dir" : who(d.to)}</strong>
                    </span>
                    <span className={`${s.debtAmount} ${d.to === user.id ? s.plus : d.from === user.id ? s.minus : ""}`}>{formatMoney(d.cents, d.currency)}</span>
                    <form action={settleBetween}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <input type="hidden" name="from" value={d.from} />
                      <input type="hidden" name="to" value={d.to} />
                      <input type="hidden" name="currency" value={d.currency} />
                      <button type="submit" className="btn btn-secondary">Beglichen</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={ts.section} aria-labelledby="h-expenses">
            <div className={ts.sectionHead}>
              <h2 id="h-expenses">Ausgaben</h2>
              <span className="small">{expenses.length}</span>
            </div>
            <ExpenseForm groupId={group.id} members={members} me={user.id} currency={group.default_currency} today={todayISO()} />
            {expenses.length === 0 ? (
              <div className="empty-box"><p className="small">Noch keine Ausgaben. Erfasse die erste mit Betrag, Währung und wer bezahlt hat.</p></div>
            ) : (
              <ul className={s.expenses}>
                {expenses.map((e) => (
                  <li key={e.id} className={s.expense}>
                    <div className={s.expenseHead}>
                      <span>
                        <strong>{e.description}</strong>
                        <br />
                        <span className="small">{formatDate(e.day)} · bezahlt von {who(e.paid_by)}</span>
                      </span>
                      <span className={s.expenseAmount}>{formatMoney(e.amount_cents, e.currency)}</span>
                    </div>
                    <div className={s.splits} aria-label="Anteile">
                      {e.splits.map((sp) =>
                        sp.user_id === e.paid_by ? (
                          <span key={sp.user_id} className={`${s.split} ${s.splitPayer}`} title="Eigener Anteil der zahlenden Person">
                            {who(sp.user_id)} {formatMoney(sp.share_cents, e.currency)}
                          </span>
                        ) : (
                          <form key={sp.user_id} action={toggleSettled}>
                            <input type="hidden" name="expense_id" value={e.id} />
                            <input type="hidden" name="group_id" value={group.id} />
                            <input type="hidden" name="user_id" value={sp.user_id} />
                            <input type="hidden" name="settled" value={sp.settled ? "false" : "true"} />
                            <button type="submit" className={`${s.split} ${sp.settled ? s.splitPaid : ""}`}
                              aria-label={`Anteil ${who(sp.user_id)}: ${sp.settled ? "beglichen, als offen markieren" : "offen, als beglichen markieren"}`}>
                              {sp.settled ? <Check size={14} strokeWidth={2.5} aria-hidden /> : <X size={14} strokeWidth={2.5} aria-hidden />}
                              {who(sp.user_id)} {formatMoney(sp.share_cents, e.currency)}
                            </button>
                          </form>
                        ),
                      )}
                    </div>
                    <div className={s.expenseFoot}>
                      <span className="small">
                        {e.splits.every((sp) => sp.settled || sp.user_id === e.paid_by) ? "Vollständig beglichen" : "Antippen, um einen Anteil als beglichen zu markieren"}
                      </span>
                      <form action={deleteExpense}>
                        <input type="hidden" name="expense_id" value={e.id} />
                        <input type="hidden" name="group_id" value={group.id} />
                        <button type="submit" className="btn btn-quiet" aria-label={`Ausgabe «${e.description}» löschen`}>
                          <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div style={{ display: "grid", gap: "var(--s-6)", minWidth: 0 }}>
          <section className={ts.section} aria-labelledby="h-members">
            <h2 id="h-members">Mitglieder</h2>
            <ul className={s.members}>
              {members.map((m) => (
                <li key={m.id} className={s.member}>
                  {m.id === user.id ? `${m.name} (du)` : m.name}
                  <form action={removeMember}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <input type="hidden" name="user_id" value={m.id} />
                    <button type="submit" className="btn btn-quiet" aria-label={m.id === user.id ? "Gruppe verlassen" : `${m.name} entfernen`}>
                      <X size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <AddMemberForm groupId={group.id} />
          </section>

          <section className={ts.section} aria-labelledby="h-settings">
            <h2 id="h-settings">Gruppe bearbeiten</h2>
            <EditGroupForm groupId={group.id} name={group.name} currency={group.default_currency} />
          </section>
        </div>
      </div>
    </>
  );
}
