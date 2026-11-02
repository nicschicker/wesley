# Wesley

Persönliche Alltags-App: Tasks, Termine, Jahrestage, News und Restaurants an einem Ort.
Jede Person sieht nur ihre eigenen Daten. Registrierung nur mit Einladung.

**Stand:** Grundgerüst mit Login, Registrierung per Einladung, Admin-Seite und
Startseite «Heute». Die Module folgen schrittweise.

## Dienste und Kosten

| Dienst | Plan | Kreditkarte | Was passiert beim Limit |
|---|---|---|---|
| Vercel | Hobby | nein | Deployments/Funktionen werden gebremst, keine Rechnung |
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

### 2. Vercel

1. vercel.com → Add New → Project → GitHub-Repository `wesley` importieren.
2. Bei «Environment Variables» eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wizyosikcfywqdxfbvqa.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable Key aus Supabase
   - `SUPABASE_SECRET_KEY` = Secret Key aus Schritt 1.2
3. Deploy. Die URL lautet dann etwa `https://wesley-xyz.vercel.app`.

### 3. GitHub: Supabase wach halten

Repository → Settings → Secrets and variables → Actions → Tab «Variables» →
neue Variable `APP_URL` mit der Vercel-URL. Der Job «Supabase wach halten» ruft dann
täglich `/api/health` auf.

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
