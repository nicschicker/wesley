export const TZ = "Europe/Zurich";

/** Heutiges Datum in Zürich als YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** ISO-Wochentag: Montag = 1 … Sonntag = 7. */
export function isoWeekday(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function lastDayOfMonth(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** TT.MM.JJJJ */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

/** Kurzform für Listen: «heute», «morgen», «gestern» oder TT.MM. */
export function relativeDay(iso: string, today: string = todayISO()): string {
  const diff = Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  if (diff === 0) return "heute";
  if (diff === 1) return "morgen";
  if (diff === -1) return "gestern";
  const [, m, d] = iso.split("-");
  return `${d}.${m}.`;
}

export function addDays(iso: string, days: number): string {
  const t = Date.parse(`${iso}T12:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
