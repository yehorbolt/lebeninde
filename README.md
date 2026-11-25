<div align="center">

# 🇩🇪 Leben in Deutschland – PWA

**Complete, offline-ready Progressive Web App for preparing for the German Citizenship Exam (*Einbürgerungstest / Test „Leben in Deutschland“*) across all 16 Bundesländer.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?logo=pwa&logoColor=white)](https://vite-pwa-org.netlify.app/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Realtime_Sync-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI_Tutor_(BYOK)-F59E0B?logo=googlegemini&logoColor=white)](https://ai.google.dev/)

</div>

---

## ✨ Features

- **Complete 460-Question Catalog:** Includes all **300 general federal questions** plus **160 regional state questions** (10 for each of Germany's **16 Bundesländer**) and all **43 official coat-of-arms, map, and chart images**.
- **All 16 Bundesländer Supported:** Switch your federal state anytime (*Baden-Württemberg, Bayern, Berlin, Brandenburg, Bremen, Hamburg, Hessen, Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen, Rheinland-Pfalz, Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thüringen*). Dashboard stats, catalog filters, and exam simulations adapt automatically.
- **Study Mode (*Fragenkatalog*):**
  - Filter by *Alle*, *Allgemein (300)*, *Selected Bundesland (10)*, *Offen* (unanswered), *Fehler* (mistakes), or by *Thema*.
  - Instant green/red answer feedback, built-in offline explanations, and a quick-jump question navigator grid.
- **Realistic Exam Simulator (*Prüfungssimulation*):**
  - Generates an authentic **33-question exam** (30 random general questions + 3 random questions from your selected Bundesland).
  - **60-minute countdown timer** with no answer hints during the test.
  - Detailed results screen (*Ergebnis*) checking both official thresholds (**17/33** for *Einbürgerungstest*, **15/33** for *Integrationskurs*) with full question-by-question review.
- **Optional Multi-Language Translations:**
  - Toggle parallel translations for questions, options, and explanations in **6 helper languages**: **Ukrainian (`UK`)**, **English (`EN`)**, **Turkish (`TR`)**, **Arabic (`AR`)**, **Persian (`FA`)**, and **Urdu (`UR`)** (with automatic RTL layout support).
  - Active timed exams remain strictly in German to mirror real BAMF exam conditions.
- **AI Tutor in Simple German (*KI-Lernhilfe — BYOK*):**
  - Bring your own free Google Gemini API key (`gemini-2.5-flash` by default) to generate clear **A2–B1 *Einfache Sprache*** explanations structured into:
    1. **Kurz erklärt** *(Why the answer is right in 2–3 simple sentences)*
    2. **Wichtige Wörter** *(Key vocabulary explained in everyday German)*
    3. **Eselsbrücke** *(A short memory trick)*
  - Every generated AI explanation is cached locally and synced for instant offline reuse.
- **Cross-Device Cloud Sync (PC ↔ Smartphone):**
  - Works 100% locally per device without an account (`localStorage`), or sign in via **Supabase Auth** (Email/Password or Google) to automatically merge and live-sync your progress, mistakes, Bundesland, translation preference, theme, AI cache, and Gemini API key across devices, protected by PostgreSQL **Row-Level Security (RLS)**.
- **Installable Offline PWA:**
  - Pre-caches all 460 questions, 43 images, and translation dictionaries via Workbox Service Worker.
  - Optimized for mobile & iPhone Dynamic Island / Home Indicator safe areas (`viewport-fit=cover`), with Dark Mode by default and a Light/Dark toggle.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 6 |
| **Styling & Icons** | Tailwind CSS (Dark/Light mode), `lucide-react` |
| **State & Offline Storage** | `zustand` with `persist` middleware (`localStorage`) |
| **Auth & Cloud Sync** | `@supabase/supabase-js` (PostgreSQL + Row-Level Security + Realtime) |
| **AI Tutor** | Google Gemini REST API (`generativelanguage.googleapis.com`) |
| **PWA & Caching** | `vite-plugin-pwa` + Workbox (`generateSW`, `autoUpdate`) |

---

## 📁 Project Structure

```text
├── public/
│   ├── images/               # 43 official question images (federal & 16 states)
│   ├── translations/         # On-demand JSON dictionaries (uk, en, tr, ar, fa, ur)
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── components/
│   │   ├── AiExplanationBox.tsx
│   │   ├── AuthSyncModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExamSimulator.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── SettingsModal.tsx
│   │   └── StudyCatalog.tsx
│   ├── data/
│   │   ├── bundeslaender.ts  # Metadata for all 16 German federal states
│   │   ├── general.json      # 300 general questions ("001"–"300")
│   │   ├── states.json       # 160 regional questions ("bw-01"–"th-10")
│   │   └── index.ts
│   ├── hooks/
│   │   └── useCloudSync.ts   # Automatic merge, Realtime listener & debounced push
│   ├── services/
│   │   ├── aiTutor.ts        # Gemini A2–B1 explanation client
│   │   ├── supabase.ts       # Supabase Auth & RLS sync client
│   │   └── translations.ts   # Lazy translation loader & cache
│   ├── store/
│   │   └── useAppStore.ts    # Persisted Zustand store
│   └── types/
│       └── question.ts
└── supabase/
    └── schema.sql            # Idempotent table, RLS policies & Realtime setup
```

---

## 🚀 Getting Started Locally

### 1. Clone & Install

```bash
git clone https://github.com/yehorbolt/lebeninde.git
cd lebeninde
npm install
```

### 2. Configure Environment Variables *(Optional — for Cloud Sync)*

Copy `.env.example` to `.env` and add your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> Without `.env`, the app still works completely offline using local device storage (`localStorage`), or you can enter Supabase credentials directly inside the app's **Konto & Geräte-Sync** modal.

### 3. Run Development or Production Preview

```bash
# Start local & LAN dev server (accessible on phone via Wi-Fi)
npm run dev

# Type-check & build production PWA bundle into dist/
npm run build

# Preview production PWA locally
npm run preview
```

---

## ☁️ Setting Up Supabase (Cross-Device Sync)

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
   - Creates `public.user_sync_data`
   - Enables strict **Row-Level Security** (`auth.uid() = user_id`)
   - Adds `user_sync_data` to `supabase_realtime`
3. Copy your **Project URL** and **`anon` `public` key** from **Project Settings → API**.
4. *(Optional)* Under **Authentication → URL Configuration**, set **Site URL** to your deployed domain (e.g. `https://your-app.vercel.app`).

---

## 🌐 Deploying for Free (Vercel / Cloudflare Pages)

1. Import your GitHub repository into [Vercel](https://vercel.com/new) or [Cloudflare Pages](https://pages.cloudflare.com).
2. Keep the standard Vite build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Environment Variables**.
4. Deploy! To install on mobile:
   - **iOS (Safari):** Tap **Share** → **Add to Home Screen** (*Zum Home-Bildschirm*).
   - **Android (Chrome):** Tap **⋮ Menu** → **Install app** (*App installieren*).

---

## 📜 Credits & Disclaimer

- Question catalog based on the official **BAMF Gesamtfragenkatalog zum Test „Leben in Deutschland“**.
- Structured question & multi-language translation dataset adapted from [abdullahbutt/leben-in-deutschland-test](https://github.com/abdullahbutt/leben-in-deutschland-test) (CC BY-NC 4.0).
- **Disclaimer:** This project is an independent study tool for educational preparation and is not affiliated with the *Bundesamt für Migration und Flüchtlinge (BAMF)*. Answers involving current political officeholders can change after elections—always verify against the latest official catalog at [bamf.de](https://www.bamf.de).
