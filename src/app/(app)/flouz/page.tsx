import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { allOpenExpenses, listGroups } from "@/modules/flouz/queries";
import { formatMoney, myBalance, openDebts } from "@/modules/flouz/money";
import { CreateGroupForm } from "@/modules/flouz/ui/forms";
import ts from "@/modules/tasks/ui/tasks.module.css";
import s from "@/modules/flouz/ui/flouz.module.css";

export const metadata = { title: "Flouz · Wesley" };

function BalanceLine({ cents, currency }: { cents: number; currency: string }) {
  if (cents === 0) return <span className={s.even}>ausgeglichen</span>;
  return cents > 0
    ? <span className={s.plus}>du bekommst {formatMoney(cents, currency)}</span>
    : <span className={s.minus}>du schuldest {formatMoney(cents, currency)}</span>;
}

export default async function FlouzPage() {
  const user = await requireUser();
  const [groups, expenses] = await Promise.all([listGroups(), allOpenExpenses()]);
  const total = myBalance(openDebts(expenses), user.id);

  return (
    <>
      <header className="page-head">
        <p className="label">Finanzen</p>
        <h1>Flouz</h1>
      </header>

      {total.size > 0 && (
        <section className={s.totals} aria-label="Dein Saldo über alle Gruppen">
          {[...total.entries()].map(([cur, cents]) => (
            <div key={cur} className={s.total}>
              <span className="label">{cents >= 0 ? "Du bekommst" : "Du schuldest"} · {cur}</span>
              <span className={`${s.totalValue} ${cents >= 0 ? s.plus : s.minus}`}>{formatMoney(cents, cur)}</span>
            </div>
          ))}
        </section>
      )}

      <div className="two-col">
        <section className={ts.section} aria-labelledby="h-groups">
          <h2 id="h-groups">Gruppen</h2>
          {groups.length === 0 ? (
            <div className="empty-box">
              <p>Noch keine Gruppen.</p>
              <p className="small">Erstelle eine Gruppe, z. B. für Ferien, die WG oder Ausgang, und füge Freunde mit Wesley-Konto hinzu.</p>
            </div>
          ) : (
            <ul className={s.groups}>
              {groups.map((g) => {
                const bal = myBalance(openDebts(expenses.filter((e) => e.group_id === g.id)), user.id);
                return (
                  <li key={g.id}>
                    <Link href={`/flouz/${g.id}`} className={s.groupRow}>
                      <span>
                        <span className={s.groupName}>{g.name}</span>
                        <br />
                        <span className="small">{g.members} {g.members === 1 ? "Person" : "Personen"} · {g.default_currency}</span>
                      </span>
                      <span className={s.balances}>
                        {bal.size === 0 ? <span className={s.even}>ausgeglichen</span> : [...bal.entries()].map(([cur, c]) => <BalanceLine key={cur} cents={c} currency={cur} />)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={ts.section} aria-labelledby="h-new-group">
          <h2 id="h-new-group">Neue Gruppe</h2>
          <CreateGroupForm />
          <p className="small">
            Mitglieder brauchen ein Wesley-Konto. Salden werden pro Währung geführt und nicht umgerechnet.
          </p>
        </section>
      </div>
    </>
  );
}
