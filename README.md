# Leben in Deutschland – Alle 16 Bundesländer (Vollversion mit 460 Fragen, Übersetzungen & Cloud-Sync)

Eine moderne, vollständig offline-fähige Progressive Web App (PWA) zur Vorbereitung auf den deutschen **Einbürgerungstest („Leben in Deutschland“)** für **alle 16 Bundesländer**:

- **Vollständiger Fragenkatalog enthalten:** Alle **300 allgemeinen Bundesfragen** (`src/data/general.json`) + alle **160 Landesfragen (10 pro Bundesland)** (`src/data/states.json`) + alle **43 offiziellen Bildtafeln** (`public/images/`).
- **6 optionale Übersetzungssprachen integriert:** Auf Wunsch lassen sich Frage, Antwortmöglichkeiten und Kurzerklärung parallel auf **Ukrainisch (`uk`), Englisch (`en`), Türkisch (`tr`), Arabisch (`ar`), Persisch (`fa`) oder Urdu (`ur`)** einblenden (`public/translations/`). Während einer laufenden Prüfungssimulation bleibt der Test wie beim echten BAMF-Test rein auf Deutsch.
- **Konto-Anmeldung & Echtzeit-Synchronisierung (Supabase):** Synchronisiert Bundesland, Lernfortschritt, Fehlerliste, Übersetzungssprache, Design-Modus, KI-Cache und Gemini API-Schlüssel sicher per Row-Level Security (RLS) zwischen PC und Smartphone.
- **KI-Lernhilfe (Google Gemini BYOK):** Erklärt jede Frage zusätzlich auf Knopfdruck in einfachem Deutsch (A2–B1: *1. Kurz erklärt*, *2. Wichtige Wörter*, *3. Eselsbrücke*) inkl. Offline-Cache.

---

## Lokal starten & bauen

```powershell
# Entwicklungsserver starten
npm run dev

# Produktions-Build inkl. Offline-PWA erstellen
npm run build

# Produktions-Build lokal testen
npm run preview
```

---

## Supabase Cloud-Sync einrichten

1. Erstelle ein kostenloses Projekt auf [supabase.com](https://supabase.com).
2. Führe im **SQL Editor** einmalig den Inhalt aus [`supabase/schema.sql`](./supabase/schema.sql) aus.
3. Hinterlege `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` in deiner lokalen `.env`-Datei (siehe `.env.example`) sowie in den *Environment Variables* deines Hosting-Anbieters (z. B. Vercel oder Cloudflare Pages).
