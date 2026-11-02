# Prompt 02 · Bereiche, Sport-Tracking und Flouz

## Ziel
Wesley bekommt sechs feste Bereiche pro Person. Vier davon sind Task-Bereiche mit langfristigen
Zielen, zwei haben eigene Spezialfunktionen: ein Trainingstagebuch (Sport) und geteilte Ausgaben
nach dem Vorbild von Splitwise (Flouz).

## Bereiche (für jede Person automatisch angelegt)
| Bereich | Bedeutung | Typ | Sortierung |
|---|---|---|---|
| Harbejt | Arbeit | Tasks + Ziele | Priorität, dann Fälligkeit |
| Škola | Schule (kroatisch) | Tasks + Ziele, Modul-Feld | Modul, dann Priorität |
| Familie | Familie | Tasks + Ziele | Priorität, dann Fälligkeit |
| Freundin | Beziehung | Tasks + Ziele | Priorität, dann Fälligkeit |
| Sport | Training | Trainingstagebuch | nach Datum |
| Flouz | Finanzen | geteilte Ausgaben in Gruppen | nach Datum |

## Tasks (Harbejt, Škola, Familie, Freundin)
- Felder: Titel, Status (Offen, In Arbeit, Wartet, Erledigt), Priorität (hoch, mittel, tief),
  Fälligkeit, Notiz, Wiederholung (keine, täglich, an Wochentagen, monatlich), bei Škola zusätzlich Modul.
- Status direkt in der Liste änderbar, alle Felder in einem aufklappbaren Bearbeitungsfeld.
- Schnellerfassung oben, Enter legt den Task an.
- Wiederkehrende Tasks erscheinen als «Routinen» und werden pro Tag abgehakt. Um Mitternacht
  (Europe/Zurich) gelten sie automatisch wieder als offen, der Verlauf bleibt erhalten.
- Erledigte Tasks einklappbar, überfällige rot markiert.

## Langfristige Ziele (gleiche vier Bereiche)
Titel, Notiz, Zieldatum, Fortschritt in Prozent, Status (aktiv, erreicht, verworfen).

## Sport
- Übungsliste mit gängigen Übungen vorbefüllt, eigene Übungen ergänzbar.
- Training erfassen: Datum, beliebig viele Übungen, pro Übung beliebig viele Sätze mit
  Wiederholungen und Gewicht (kg, leer = Körpergewicht).
- Verlauf der letzten Trainings, Training löschen.
- Fortschritt pro Übung: schwerster Satz und Volumen pro Trainingstag als Diagramm und Tabelle.

## Flouz
- Gruppen erstellen, umbenennen und löschen. Das dürfen alle Mitglieder einer Gruppe.
- Mitglieder per E-Mail hinzufügen. Sie müssen ein Wesley-Konto haben (Einladung über Admin).
- Ausgabe erfassen: Beschreibung, Betrag, Währung (CHF, EUR, USD, GBP, beliebiger ISO-Code),
  Datum, bezahlt von, aufgeteilt auf ausgewählte Mitglieder (gleichmässig, auf den Rappen genau).
- Pro Anteil «beglichen ja/nein» umschaltbar, plus «alles beglichen» pro Ausgabe.
- Saldo pro Person und Währung aus allen offenen Anteilen. Keine automatische Währungsumrechnung,
  weil dafür eine externe Kursquelle nötig wäre. Salden werden je Währung getrennt geführt.

## Sicherheit
- Alles Persönliche bleibt `user_id = auth.uid()`.
- Flouz ist die einzige geteilte Funktion: Lesen und Schreiben nur für Mitglieder der jeweiligen
  Gruppe (Hilfsfunktion `is_group_member`), Zahler und Anteile müssen Gruppenmitglieder sein
  (Datenbank-Trigger). Andere Personen sehen von dir nur Namen in gemeinsamen Gruppen.
- RLS-Tests gegen die echte Datenbank.

## Navigation
Mobil: Heute · Bereiche · Sport · Flouz · Mehr. Desktop: alle Bereiche direkt in der Seitenleiste.
«Heute» zeigt fällige und überfällige Tasks aus allen Bereichen und die Routinen als Spielstand.
