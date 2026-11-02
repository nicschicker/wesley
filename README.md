# Wesley

Persönliche Alltags-App: Tasks, Termine, Jahrestage, News und Restaurants an einem Ort.
Jede Person sieht nur ihre eigenen Daten. Registrierung nur mit Einladung.

**Live:** https://wesley-app.netlify.app

**Stand:** Grundgerüst mit Login, Registrierung per Einladung, Admin-Seite und
Startseite «Heute». Die Module folgen schrittweise.

## Dienste und Kosten

| Dienst | Plan | Kreditkarte | Was passiert beim Limit |
|---|---|---|---|
| Netlify | Free | nein | Projekt wird pausiert, keine Rechnung |
| Supabase | Free | nein | Projekt pausiert bei Inaktivität bzw. Limits blockieren, keine Rechnung |
| GitHub | Free | nein | Actions-Minuten reichen für CI und den täglichen Ping |

## Einrichtung

### 1. Supabase

Das Projekt `wesley` (Region Zürich) und alle Tabellen sind bereits angelegt.
Einmalig in Supabase einstellen:

1. **Öffentliche Registrierung ausschalten:** Authentication → Sign In / Providers →
   «Allow new users to sign up» **aus**. Konten entstehen dann nur noch über die
   Einladungen der App.
2. **Secret Key kopieren:** Project Settings → API Keys → «Secret keys» → Schlüssel
   kopieren (nie weitergeben, nie in den Code).

### 2. Netlify

Projekt `wesley-app`, verbunden mit diesem Repository. Jeder Push auf `main` deployt automatisch.

- Umgebungsvariablen (Project configuration → Environment variables):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- `netlify.toml` nimmt die zwei öffentlichen Werte vom Geheimnis-Scan aus. Der Scan bleibt für
  den Secret Key aktiv.
- Zugriff: Die Live-Seite ist öffentlich (Login übernimmt die App), Vorschau-Deploys nur mit
  Netlify-Team-Login.

### 3. Supabase wach halten

Der GitHub-Job «Supabase wach halten» ruft täglich `https://wesley-app.netlify.app/api/health` auf.
Ändert sich die URL, im Repository unter Settings → Secrets and variables → Actions → Variables
`APP_URL` setzen.

### 4. Erstes Konto

Auf der App-URL `/registrieren` öffnen und den Admin-Einladungscode verwenden.
Danach unter «Admin» Codes für Kollegen erstellen.

## Lokal entwickeln

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```

Prüfen: `npm run lint && npm run typecheck && npm test && npm run build`

Mehr zum Aufbau: [ARCHITECTURE.md](ARCHITECTURE.md) · Design: [DESIGN.md](DESIGN.md)
