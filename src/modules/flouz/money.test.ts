import { describe, expect, it } from "vitest";
import { myBalance, openDebts, splitEqually, toCents } from "./money";

describe("Aufteilen", () => {
  it("verteilt 100.00 auf 3 Personen auf den Rappen genau", () => {
    const m = splitEqually(10000, ["a", "b", "c"]);
    expect([...m.values()]).toEqual([3334, 3333, 3333]);
    expect([...m.values()].reduce((x, y) => x + y)).toBe(10000);
  });
  it("rundet Eingaben korrekt in Rappen", () => {
    expect(toCents(12.345)).toBe(1235);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe("Offene Schulden", () => {
  const exp = (paid_by: string, currency: string, splits: [string, number, boolean?][]) => ({
    paid_by,
    currency,
    splits: splits.map(([user_id, share_cents, settled]) => ({ user_id, share_cents, settled: !!settled })),
  });

  it("eigener Anteil der zahlenden Person ist keine Schuld", () => {
    expect(openDebts([exp("a", "CHF", [["a", 5000], ["b", 5000]])])).toEqual([
      { from: "b", to: "a", currency: "CHF", cents: 5000 },
    ]);
  });

  it("verrechnet gegenseitige Schulden und trennt Währungen", () => {
    const debts = openDebts([
      exp("a", "CHF", [["a", 3000], ["b", 3000]]),
      exp("b", "CHF", [["a", 1000], ["b", 1000]]),
      exp("b", "EUR", [["a", 2000], ["b", 2000]]),
    ]);
    expect(debts).toEqual([
      { from: "b", to: "a", currency: "CHF", cents: 2000 },
      { from: "a", to: "b", currency: "EUR", cents: 2000 },
    ]);
    const mine = myBalance(debts, "a");
    expect(mine.get("CHF")).toBe(2000);
    expect(mine.get("EUR")).toBe(-2000);
  });

  it("beglichene Anteile zählen nicht", () => {
    expect(openDebts([exp("a", "CHF", [["b", 5000, true]])])).toEqual([]);
  });
});
