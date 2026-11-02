/** Geldbeträge intern immer in Rappen/Cents (ganze Zahlen), um Rundungsfehler zu vermeiden. */

export const CURRENCIES = ["CHF", "EUR", "USD", "GBP"] as const;

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency: string): string {
  const value = fromCents(Math.abs(cents));
  try {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** Betrag gleichmässig verteilen; übrige Rappen gehen der Reihe nach an die ersten Personen. */
export function splitEqually(totalCents: number, userIds: string[]): Map<string, number> {
  const n = userIds.length;
  const result = new Map<string, number>();
  if (n === 0) return result;
  const base = Math.floor(totalCents / n);
  let rest = totalCents - base * n;
  for (const id of userIds) {
    result.set(id, base + (rest > 0 ? 1 : 0));
    if (rest > 0) rest--;
  }
  return result;
}

export type ExpenseForBalance = {
  paid_by: string;
  currency: string;
  splits: { user_id: string; share_cents: number; settled: boolean }[];
};

export type Debt = { from: string; to: string; currency: string; cents: number };

/**
 * Offene Schulden aus allen nicht beglichenen Anteilen, paarweise verrechnet.
 * Der Anteil der zahlenden Person selbst zählt nie als Schuld.
 */
export function openDebts(expenses: ExpenseForBalance[]): Debt[] {
  // Schlüssel: "a|b|CUR" mit a < b; positiver Wert = a schuldet b
  const net = new Map<string, number>();
  for (const e of expenses) {
    for (const s of e.splits) {
      if (s.settled || s.user_id === e.paid_by || s.share_cents === 0) continue;
      const [a, b] = [s.user_id, e.paid_by].sort();
      const key = `${a}|${b}|${e.currency}`;
      const sign = s.user_id === a ? 1 : -1; // Schuldner ist a → positiv
      net.set(key, (net.get(key) ?? 0) + sign * s.share_cents);
    }
  }
  const debts: Debt[] = [];
  for (const [key, cents] of net) {
    if (cents === 0) continue;
    const [a, b, currency] = key.split("|");
    debts.push(cents > 0 ? { from: a, to: b, currency, cents } : { from: b, to: a, currency, cents: -cents });
  }
  return debts.sort((x, y) => x.currency.localeCompare(y.currency) || y.cents - x.cents);
}

/** Saldo aus Sicht einer Person pro Währung: positiv = bekommt Geld, negativ = schuldet. */
export function myBalance(debts: Debt[], me: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of debts) {
    if (d.to === me) out.set(d.currency, (out.get(d.currency) ?? 0) + d.cents);
    if (d.from === me) out.set(d.currency, (out.get(d.currency) ?? 0) - d.cents);
  }
  return out;
}
