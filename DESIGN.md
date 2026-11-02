# DESIGN.md · Wesley

Persönliche Alltags-App für Tasks, Termine, Jahrestage, News und Restaurants.
Gefühl: **ruhig, präzise, sportlich**. Wie eine gute Matchday-Anzeige:
klare Zahlen, starke Hierarchie, ein Farbakzent mit Absicht. Kein Dashboard-Kitsch.

Grundlage: eigene Entscheidungen aus Icon und Anforderungen. Die Richtung ist
nicht aus einem Vergleich mit realen Referenz-Websites abgeleitet.

---

## 1. Farbe

Ein Akzent (Oranje), ein Zweitakzent nur für externe Termine (Holland-Blau),
sonst warme Neutraltöne mit leichtem Orange-Stich. Orange ist nie Fliesstextfarbe
auf hellem Grund, dafür gibt es `--primary-ink`.

| Token | Hell | Dunkel | Rolle |
|---|---|---|---|
| `--bg` | `#F6F4F1` | `#13100D` | Seitenhintergrund |
| `--surface` | `#FFFFFF` | `#1C1814` | Karten, Panels, Eingabefelder |
| `--surface-sunk` | `#EEEBE6` | `#0E0C0A` | Eingelassene Flächen, Tab-Leiste |
| `--line` | `#E1DCD5` | `#2E2822` | Trennlinien, Ränder |
| `--ink` | `#16120E` | `#F3EEE8` | Haupttext, Rückennummer-Ziffern |
| `--ink-soft` | `#5E554C` | `#ADA397` | Sekundärtext, Metadaten |
| `--ink-faint` | `#8C8278` | `#7A7066` | Platzhalter, deaktiviert |
| `--primary` | `#F26B12` | `#FF7A24` | Primärbuttons, aktive Navigation, Fortschritt |
| `--on-primary` | `#16120E` | `#16120E` | Text/Icons auf Orange (Kontrast ≥ 6:1) |
| `--primary-ink` | `#B04604` | `#FF9A55` | Links und orange Text auf `--bg`/`--surface` (≥ 4.5:1) |
| `--primary-wash` | `#FDE8D8` | `#3A2212` | Hervorhebung, ausgewählte Zeile |
| `--blue` | `#21468B` | `#7FA2E3` | Nur Outlook-Termine im Kalender |
| `--blue-wash` | `#E3EAF6` | `#18233A` | Hintergrund von Outlook-Terminen |
| `--success` | `#1E7F47` | `#5CC88A` | Erledigt |
| `--warning` | `#9A6A00` | `#E5B341` | Wartet, Limit fast erreicht |
| `--danger` | `#B3261E` | `#F2867F` | Überfällig, Fehler, Löschen |

Jahrestage tragen kein eigenes Farbsystem: Sie erscheinen mit `--primary` als
gefülltem Punkt.

## 2. Typografie

Zwei Familien aus einer Schriftsippe, damit alles zusammenhält:

- **Barlow Condensed** (600, 700): Titel, Zahlen, Datum, Zähler. Erinnert an
  Trikotnummern und Anzeigetafeln, ohne verspielt zu sein.
- **Barlow** (400, 500, 600): Fliesstext, Bedienelemente, Labels.
- Ziffern überall mit `font-variant-numeric: tabular-nums`.
- Fallback: `"Arial Narrow", system-ui, sans-serif` bzw. `system-ui, sans-serif`.

| Stufe | Grösse / Zeilenhöhe | Schrift | Verwendung |
|---|---|---|---|
| `display` | 48 / 48 | Condensed 700 | Datum auf «Heute», grosse Zähler |
| `h1` | 32 / 36 | Condensed 700 | Seitentitel |
| `h2` | 24 / 28 | Condensed 600 | Abschnitts- und Widget-Titel |
| `h3` | 18 / 24 | Barlow 600 | Kartentitel |
| `body` | 16 / 24 | Barlow 400 | Standardtext, Task-Titel |
| `small` | 14 / 20 | Barlow 400/500 | Metadaten, Zeiten |
| `label` | 12 / 16 | Barlow 600, +0.06em, Grossbuchstaben | Abschnittslabels, Chips |

Titel mit `text-wrap: balance`. Fliesstext höchstens 68 Zeichen breit.

## 3. Abstände & Layout

- 4er-Raster: `4, 8, 12, 16, 24, 32, 48, 64`.
- Seitenrand mobil 16 px (mit Safe-Area), Desktop 32 px.
- Inhaltsbreite maximal 1120 px.
- **Mobil:** untere Tab-Leiste mit 4 Zielen: Heute · Tasks · Kalender · Mehr.
  Darüber schwebt ein runder Schnellerfassen-Button.
- **Ab 900 px:** linke Seitenleiste (240 px) statt Tab-Leiste; «Heute» als
  zweispaltiges Raster (Tasks links breit, Termine/Jahrestage rechts).
- Widgets stehen untereinander, nicht als gleichförmiges Kartenraster.

## 4. Form & Tiefe

- Radius: `--r-s 6px` (Chips, Inputs), `--r-m 10px` (Karten, Buttons),
  `--r-l 16px` (Sheets, Dialoge), `--r-full` (Avatar, Schnellerfassen-Button).
- Schatten: nur einer, `--shadow: 0 1px 2px rgb(22 18 14 / .06), 0 8px 24px rgb(22 18 14 / .08)`,
  ausschliesslich für schwebende Elemente (Sheets, Schnellerfassen, Menüs).
  Karten liegen flach mit `--line`-Rand.

## 5. Komponenten

- **Button primär:** `--primary` mit `--on-primary`, 44 px hoch.
  Hover etwas dunkler, Fokus 2 px Ring in `--ink` mit 2 px Abstand,
  deaktiviert 40 % Deckkraft.
- **Button sekundär:** `--surface`, Rand `--line`, Text `--ink`.
- **Button still:** nur Text in `--ink-soft`, Hover-Fläche `--surface-sunk`.
- **Task-Zeile:** Checkbox links (24 px, Rand `--ink-soft`, erledigt gefüllt
  `--success` mit Häkchen), Titel, darunter Bereich-Chip und Fälligkeit.
  Rechts Prioritätsmarke: drei kleine Balken wie eine Signalanzeige.
  Abhaken streicht den Titel durch und blendet nach 1.2 s in «Erledigt» aus.
- **Status-Chip:** Offen (Rand `--line`), In Arbeit (`--primary-wash`),
  Wartet (Rand `--warning`), Erledigt (`--success` Text), Überfällig (`--danger` Text).
- **Tagesanzeige («Heute»):** Datum in `display`, daneben die Routine als
  Spielstand, z. B. **7 : 10** (erledigt : gesamt) in Condensed mit einem
  Fortschrittsbalken in `--primary`. Das ist das Signaturelement der App.
- **Jahrestag-Karte:** Zähler gross in Condensed («in 5 Tagen»),
  Zusatz in `small` («wird 30», «2 Jahre 4 Monate»).
- **Kalender:** Wochenansicht mit Stundenraster in `--line`, Outlook-Termine
  `--blue-wash` mit 3 px Rand links in `--blue`, fällige Tasks als Chip,
  Jahrestage als oranger Punkt im Tageskopf.
- **Restaurant-Karte:** Fotostreifen (max. 3, 4:3, horizontal wischbar),
  darunter Name, Sterne + Anzahl, Preisniveau, Adresse, Öffnungsstatus.
  Ohne Fotos (OpenStreetMap): Platzhalter in `--surface-sunk` mit Besteck-Icon.
  Quellenhinweis immer sichtbar.
- **Eingabefeld:** `--surface`, Rand `--line`, Fokus Rand `--ink` und Ring.
  Fehlertext darunter in `--danger`.
- **Navigation:** aktives Ziel `--primary` (Icon) + `--ink` (Text), inaktiv `--ink-soft`.
- **Leerzustände:** kurzer Satz, was hier erscheinen wird, plus ein Button,
  der den ersten Eintrag anlegt.

## 6. Bilder & Icons

- Icons: **Lucide**, Strich 1.75 px, 20 px Standard, keine Emojis.
- App-Icon: dickes, geschwungenes weisses «W» auf orangem Verlauf (`public/icons/icon.svg`).
- Fotos nur bei Restaurants (Google) und nie dekorativ.
- Keine Illustrationen, keine Verläufe auf Text, keine Glas-Effekte.

## 7. Bewegung

- Standarddauer 160 ms, `ease-out`. Sheets 240 ms.
- Einziger «Moment»: Wenn die Tagesroutine 100 % erreicht, füllt sich der
  Spielstand-Balken und die Zahl wechselt kurz auf `--success`.
- Bei `prefers-reduced-motion` keine Animationen ausser Farbwechseln.

## 8. Sprache

Deutsch (Schweiz): «ss» statt «ß», Datum TT.MM.JJJJ, 24-h-Zeit, Woche ab Montag.
Buttons sagen, was passiert («Task anlegen», «Verbindung trennen»).
