# Architektur · Wesley

## Überblick

```
Browser ──► Next.js auf Vercel (Seiten, Server Actions, API-Routen)
                │
                ├─► Supabase (Postgres + Auth), alle Personendaten mit Row Level Security
                └─► externe Dienste (später: Microsoft Graph, Google Places, OpenStreetMap, RSS)
```

Geheime Schlüssel existieren nur auf dem Server. Der Browser spricht nie direkt mit
externen Diensten.

## Ordner

```
src/
  core/                 geteilte Grundlagen
    auth/               Sitzung, Admin-Prüfung, Einladungscodes
    supabase/           server.ts (im Namen der Person, mit RLS)
                        admin.ts  (Secret Key, umgeht RLS, nur gezielt einsetzen)
    ui/                 Navigation und gemeinsame Komponenten
    modules.ts          Modul-Registry → Navigation
    env.ts              geprüfte Umgebungsvariablen
  modules/<name>/       ein Ordner pro Feature (ui/, server/, db/, *.test.ts)
  app/
    (auth)/             Login, Registrierung (ohne App-Rahmen)
    (app)/              alle Seiten mit Navigation
    api/                API-Routen (Health-Check, später Kalender, Restaurants)
  middleware.ts         Sitzung erneuern, nicht eingeloggte Personen zum Login
supabase/migrations/    versionierte Datenbankänderungen
```

## Sicherheitsregeln

1. Jede Tabelle mit Personendaten hat `user_id` und die Policy `user_id = auth.uid()`.
2. Server-Tabellen (`invitations`, `calendar_secrets`, `usage_counters`) haben RLS ohne
   Policies: für den Browser unsichtbar, nur mit Secret Key erreichbar.
3. `is_admin` kann niemand selbst setzen (Spaltenrechte).
4. Der Admin-Client (`createAdminClient`) wird erst nach `requireAdmin()` bzw. nach
   eigener Prüfung verwendet.
5. Zugangsdaten externer Dienste werden verschlüsselt in `calendar_secrets` abgelegt.
6. Kostenpflichtige Abfragen laufen immer über `try_consume_quota(provider, limit)`.
   Liefert die Funktion `false`, wird die Abfrage nicht ausgeführt.

## So fügst du ein neues Modul hinzu

1. Ordner `src/modules/<name>/` anlegen (Logik, Datenzugriff, Tests).
2. Falls Daten nötig: neue Migration in `supabase/migrations/` mit `user_id`,
   `enable row level security` und der Standard-Policy.
3. Seite unter `src/app/(app)/<pfad>/page.tsx` anlegen, die `requireUser()` aufruft.
4. Eintrag in `src/core/modules.ts` mit `ready: true`. Die Navigation übernimmt ihn.
5. Optional ein Widget für die Seite «Heute».
6. `npm run lint && npm run typecheck && npm test` laufen lassen.

Bestehende Module werden dabei nicht angefasst.
