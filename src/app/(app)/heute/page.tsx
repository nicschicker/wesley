import { requireUser } from "@/core/auth/session";
import styles from "./heute.module.css";

export const metadata = { title: "Heute · Wesley" };

function todayParts() {
  const now = new Date();
  const tz = "Europe/Zurich";
  return {
    weekday: new Intl.DateTimeFormat("de-CH", { weekday: "long", timeZone: tz }).format(now),
    date: new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: tz }).format(now),
    hour: Number(new Intl.DateTimeFormat("de-CH", { hour: "numeric", hour12: false, timeZone: tz }).format(now)),
  };
}

function greeting(hour: number) {
  if (hour < 11) return "Guten Morgen";
  if (hour < 17) return "Hallo";
  return "Guten Abend";
}

export default async function HeutePage() {
  const user = await requireUser();
  const t = todayParts();
  // Platzhalter bis das Tasks-Modul steht
  const done = 0;
  const total = 0;

  return (
    <>
      <header className={styles.matchday}>
        <div className={styles.dateBlock}>
          <p className="label">{t.weekday}</p>
          <p className={styles.date}>{t.date}</p>
          <p className="small">{greeting(t.hour)}, {user.displayName}.</p>
        </div>
        <div className={styles.score} aria-label={`Tagesroutine: ${done} von ${total} erledigt`}>
          <p className="label">Tagesroutine</p>
          <p className={styles.scoreValue}>
            {done}<span className={styles.colon}>:</span>{total}
          </p>
          <div className={styles.bar}><div className={styles.barFill} style={{ width: total ? `${(done / total) * 100}%` : "0%" }} /></div>
        </div>
      </header>

      <p className="notice">
        Wesley ist eine private App auf Gratis-Diensten. Speichere hier keine vertraulichen Informationen
        deines Arbeitgebers wie Kundennamen, Schadenfälle oder interne Zahlen.
      </p>

      <div className={styles.grid}>
        <section className={styles.section} aria-labelledby="h-tasks">
          <h2 id="h-tasks">Heute fällig</h2>
          <div className={styles.empty}>
            <p>Hier erscheinen deine fälligen Tasks und Tagesroutinen.</p>
            <p className="small">Das Tasks-Modul ist der nächste Bauschritt.</p>
          </div>
        </section>
        <aside className={styles.side}>
          <section className={styles.section} aria-labelledby="h-cal">
            <h2 id="h-cal">Termine</h2>
            <div className={styles.empty}><p className="small">Outlook-Termine folgen mit dem Kalender-Modul.</p></div>
          </section>
          <section className={styles.section} aria-labelledby="h-ann">
            <h2 id="h-ann">Bald</h2>
            <div className={styles.empty}><p className="small">Geburtstage und Jahrestage folgen mit dem Jahrestage-Modul.</p></div>
          </section>
        </aside>
      </div>
    </>
  );
}
