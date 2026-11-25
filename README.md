# Leben in Deutschland – Alle 16 Bundesländer (PWA mit Cloud-Sync & KI-Hilfe)

Eine moderne, offline-fähige Progressive Web App (PWA) zur Vorbereitung auf den deutschen **Einbürgerungstest („Leben in Deutschland“)** für **alle 16 Bundesländer** – inklusive **Konto-Anmeldung & Echtzeit-Synchronisierung zwischen PC und Smartphone (Supabase)** sowie **KI-Lernhilfe in Einfacher Sprache (A2–B1)**.

---

## Funktionen im Überblick

- **Alle 16 Bundesländer integriert:** Wähle jederzeit dein Bundesland (von Baden-Württemberg und Bayern bis Berlin, NRW oder Thüringen). Startseite, Fragenkatalog und Prüfungssimulation passen sich sofort an.
- **Persönliche Gerätedaten & Cloud-Synchronisierung (PC ↔ Smartphone):**
  - **Lokal pro Gerät:** Ohne Konto speichert jedes Gerät den Fortschritt automatisch offline in `localStorage`.
  - **Mit Konto (Supabase Auth + Realtime):** Nach Anmeldung per E-Mail/Passwort oder Google werden **Bundesland, Lernfortschritt, Fehlerliste, Design-Modus, KI-Cache und dein Gemini API-Schlüssel** automatisch und geschützt per Row-Level Security (RLS) zwischen PC und Smartphone synchronisiert.
- **100 % deutsche Benutzeroberfläche:** Intuitives Deutsch im Dunkel- oder Hellmodus (Standard: Dunkelmodus).
- **Prüfungssimulation:** 30 allgemeine Fragen + 3 Fragen deines gewählten Bundeslandes, 60-Minuten-Timer, Fragenübersicht und Auswertung (17/33 Einbürgerung, 15/33 Integrationskurs).
- **KI-Lernhilfe (Google Gemini BYOK):** Erklärt jede Frage auf Knopfdruck in einfachem Deutsch (*1. Kurz erklärt*, *2. Wichtige Wörter*, *3. Eselsbrücke*) inkl. Offline-Cache.

---

## Lokal starten

```powershell
# Entwicklungsserver starten
npm run dev

# Produktions-Build inkl. PWA Service Worker erstellen
npm run build

# Produktions-Build lokal testen
npm run preview
```

---

## Konto-Anmeldung & Geräte-Synchronisierung einrichten (Supabase)

Damit du dich am PC und Smartphone einloggen und deine Daten live abgleichen kannst:

1. Erstelle ein kostenloses Projekt auf [supabase.com](https://supabase.com).
2. Öffne im Supabase-Dashboard den **SQL Editor**, kopiere den Inhalt aus [`supabase/schema.sql`](./supabase/schema.sql) hinein und klicke auf **Run**. *(Dadurch wird die Tabelle `user_sync_data` inkl. strikter Row-Level Security und Realtime-Sync erstellt.)*
3. Kopiere unter **Project Settings → API** deine **Project URL** und den **`anon` `public` Key**.
4. Du hast **zwei Möglichkeiten**, die Zugangsdaten einzutragen:
   - **Variante A (`.env`-Datei für Deployment & Entwicklung):** Erstelle im Projektordner eine Datei `.env` (siehe `.env.example`):
     ```env
     VITE_SUPABASE_URL=https://dein-projekt.supabase.co
     VITE_SUPABASE_ANON_KEY=dein-anon-public-key
     ```
   - **Variante B (Direkt in der App ohne Neustart):** Klicke oben rechts in der App auf **Anmelden** und trage URL + Anon-Key direkt im Verbindungsformular ein.

*(Optional für Google-Login: Aktiviere in Supabase unter **Authentication → Providers → Google** den Google-Provider.)*

---

## Vollständigen Fragenkatalog (300 Allgemein + 160 Landesfragen) einbinden

Standardmäßig enthält die App **60 realistische Beispielfragen** (**12 allgemeine Fragen** in `src/data/general.json` + **je 3 offizielle Landesfragen für alle 16 Bundesländer = 48 Fragen** in `src/data/states.json`).

### Bundesland-Kürzel (`StateCode` in `src/types/question.ts`)

| Kürzel (`category`) | Bundesland | Beispiel-IDs (`id`) |
| :--- | :--- | :--- |
| `bw` | Baden-Württemberg | `"bw-01"` bis `"bw-10"` |
| `by` | Bayern | `"by-01"` bis `"by-10"` |
| `be` | Berlin | `"be-01"` bis `"be-10"` |
| `bb` | Brandenburg | `"bb-01"` bis `"bb-10"` |
| `hb` | Bremen | `"hb-01"` bis `"hb-10"` |
| `hh` | Hamburg | `"hh-01"` bis `"hh-10"` |
| `he` | Hessen | `"he-01"` bis `"he-10"` |
| `mv` | Mecklenburg-Vorpommern | `"mv-01"` bis `"mv-10"` |
| `ni` | Niedersachsen | `"ni-01"` bis `"ni-10"` |
| `nw` | Nordrhein-Westfalen | `"nw-01"` bis `"nw-10"` |
| `rp` | Rheinland-Pfalz | `"rp-01"` bis `"rp-10"` |
| `sl` | Saarland | `"sl-01"` bis `"sl-10"` |
| `sn` | Sachsen | `"sn-01"` bis `"sn-10"` |
| `st` | Sachsen-Anhalt | `"st-01"` bis `"st-10"` |
| `sh` | Schleswig-Holstein | `"sh-01"` bis `"sh-10"` |
| `th` | Thüringen | `"th-01"` bis `"th-10"` |

### Dateien ersetzen

1. **Allgemeine Fragen (300 Stück):** Ersetze `src/data/general.json` (`category: "general"`, IDs `"001"` bis `"300"`).
2. **Landesfragen aller 16 Bundesländer (16 × 10 = 160 Stück):** Ersetze `src/data/states.json` durch alle 160 Landesfragen mit dem jeweiligen Kürzel in `category` (z. B. `"by"`, `"be"`, `"nw"`).
3. **Abbildungen:** Lege alle Fragebilder in `public/images/` ab (z. B. `public/images/q-021.png` → `"image": "/images/q-021.png"`).
4. Führe `npm run build` aus, um alle Fragen und Bilder für die Offline-Nutzung im PWA-Cache zu bündeln.
