import React from 'react';
import {
  BookOpen,
  BookMarked,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  ChevronRight,
  MapPin,
  Cloud,
  Award,
} from 'lucide-react';
import {
  BUNDESLAENDER,
  BUNDESLAND_BY_CODE,
  KURSBUCH_CHAPTERS,
  getQuestionsForState,
} from '../data';
import type { StateCode } from '../types/question';
import { getMasteryLevel, useAppStore } from '../store/useAppStore';

interface DashboardProps {
  onStartExam: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartExam,
  onOpenSettings,
  onOpenAuth,
}) => {
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const progress = useAppStore((s) => s.progress);
  const apiKey = useAppStore((s) => s.apiKey);
  const authUser = useAppStore((s) => s.authUser);
  const openCatalogWithFilter = useAppStore((s) => s.openCatalogWithFilter);

  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const activeQuestions = getQuestionsForState(selectedState);

  const totalCount = activeQuestions.length;
  let masteredCount = 0;
  let learnedCount = 0;
  let unsureCount = 0;
  let newCount = 0;

  for (const q of activeQuestions) {
    const level = getMasteryLevel(progress[q.id]);
    if (level === 'gemeistert') masteredCount++;
    else if (level === 'gelernt') learnedCount++;
    else if (level === 'unsicher') unsureCount++;
    else newCount++;
  }

  const answeredCorrectCount = masteredCount + learnedCount;
  const overallCorrectPct =
    totalCount > 0 ? Math.round((answeredCorrectCount / totalCount) * 100) : 0;

  // Completed Kursbuch chapters count (all questions in chapter at least 'gelernt' or 'gemeistert')
  const completedChapters = KURSBUCH_CHAPTERS.filter((ch) =>
    ch.questionIds.every((id) => getMasteryLevel(progress[id]) === 'gemeistert')
  ).length;

  // SVG Circular Gauge metrics
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const masteredArc = totalCount > 0 ? (masteredCount / totalCount) * circumference : 0;
  const learnedArc = totalCount > 0 ? (learnedCount / totalCount) * circumference : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top iOS 18 Bento Grid (12-column responsive layout) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Main Mastery Gauge Bento Tile */}
        <div className="md:col-span-7 bento-card p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                Gesamtfortschritt · {stateInfo.name}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141413] dark:text-white">
                {answeredCorrectCount}{' '}
                <span className="text-stone-400 dark:text-slate-500 font-medium text-base sm:text-lg">
                  / {totalCount} richtig
                </span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Davon <strong className="text-emerald-600 dark:text-emerald-400">{masteredCount}</strong>{' '}
                dauerhaft gemeistert (3× in Folge)
              </p>
            </div>

            {/* Circular SVG Mastery Ring */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
                <circle
                  cx="54"
                  cy="54"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-[#F3F1EC] dark:text-white/[0.06]"
                />
                {/* Learned segment (amber) */}
                {learnedArc > 0 && (
                  <circle
                    cx="54"
                    cy="54"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="9"
                    strokeDasharray={`${masteredArc + learnedArc} ${circumference}`}
                    strokeLinecap="round"
                    className="text-amber-400 transition-all duration-500"
                  />
                )}
                {/* Mastered segment (emerald) */}
                {masteredArc > 0 && (
                  <circle
                    cx="54"
                    cy="54"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="9"
                    strokeDasharray={`${masteredArc} ${circumference}`}
                    strokeLinecap="round"
                    className="text-emerald-500 transition-all duration-500"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-extrabold text-[#141413] dark:text-white tabular-nums leading-none">
                  {overallCorrectPct}%
                </span>
                <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-500 mt-0.5">
                  Richtig
                </span>
              </div>
            </div>
          </div>

          {/* 4-Stage Spaced-Repetition Pills */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="rounded-xl bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border border-emerald-500/20 px-2.5 py-2 text-center">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                Gemeistert
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {masteredCount}
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/[0.09] dark:bg-amber-500/[0.12] border border-amber-500/20 px-2.5 py-2 text-center">
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 truncate">
                Gelernt
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                {learnedCount}
              </div>
            </div>

            <div className="rounded-xl bg-rose-500/[0.08] dark:bg-rose-500/[0.12] border border-rose-500/20 px-2.5 py-2 text-center">
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 truncate">
                Unsicher
              </div>
              <div className="text-base sm:text-lg font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                {unsureCount}
              </div>
            </div>

            <div className="rounded-xl bg-[#F3F1EC] dark:bg-white/[0.04] border hairline-divider px-2.5 py-2 text-center">
              <div className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 truncate">
                Neu
              </div>
              <div className="text-base sm:text-lg font-bold text-[#141413] dark:text-slate-200 tabular-nums">
                {newCount}
              </div>
            </div>
          </div>
        </div>

        {/* Right Bento Stack: Bundesland Selector + Featured Nach Kursbuch Tile */}
        <div className="md:col-span-5 flex flex-col gap-3.5">
          {/* Bundesland Selector Tile */}
          <div className="bento-card p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg border border-stone-300 dark:border-white/15 overflow-hidden flex flex-col shrink-0"
                  aria-hidden="true"
                >
                  <div className="h-1/2" style={{ backgroundColor: stateInfo.flagColors[0] }} />
                  <div className="h-1/2" style={{ backgroundColor: stateInfo.flagColors[1] }} />
                </div>
                <label
                  htmlFor="dashboard-state-select"
                  className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500"
                >
                  Bundesland
                </label>
              </div>
              <span className="text-[11px] text-stone-400 dark:text-slate-500">
                Hauptstadt: {stateInfo.capital}
              </span>
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="dashboard-state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value as StateCode)}
                className="w-full rounded-xl bg-[#FAF9F6] dark:bg-[#1B1F27] border hairline-divider pl-9 pr-3 py-2.5 text-sm font-bold text-[#141413] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {BUNDESLAENDER.map((bl) => (
                  <option key={bl.code} value={bl.code}>
                    {bl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Nach Kursbuch Bento Card */}
          <button
            type="button"
            onClick={() => setActiveView('kursbuch')}
            className="flex-1 group bento-card p-4 sm:p-5 text-left hover:border-amber-500/50 dark:hover:border-amber-400/40 active:scale-[0.995] transition flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BookMarked className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F1EC] dark:bg-white/[0.06] text-stone-600 dark:text-slate-300">
                <Award className="w-3 h-3 text-emerald-500" />
                {completedChapters} / 12 Kapitel
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-[#141413] dark:text-white flex items-center justify-between">
                <span>Nach Kursbuch lernen</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Alle 12 Hueber-Kapitel (Modul I–III) + Landesfragen mit Smart-Wiederholung.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Quick-Start Bento Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Fragenkatalog */}
        <button
          type="button"
          onClick={() => openCatalogWithFilter('all')}
          className="group bento-card p-4 sm:p-5 text-left hover:border-sky-500/40 active:scale-[0.995] transition flex flex-col justify-between gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#141413] dark:text-white flex items-center justify-between">
              <span>Fragenkatalog</span>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
              Alle {totalCount} Fragen filtern, suchen & gezielt üben.
            </p>
          </div>
        </button>

        {/* Card 2: Fehler & Unsicher wiederholen */}
        <button
          type="button"
          onClick={() => openCatalogWithFilter('mistakes')}
          className="group bento-card p-4 sm:p-5 text-left hover:border-rose-500/40 active:scale-[0.995] transition flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                unsureCount > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {unsureCount === 1 ? '1 unsicher' : `${unsureCount} unsicher`}
            </span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#141413] dark:text-white flex items-center justify-between">
              <span>Fehler wiederholen</span>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
              {unsureCount > 0
                ? 'Trainiere deine unsicheren Fragen bis zum Status „Gemeistert“.'
                : 'Keine offenen Fehler – alles im grünen Bereich!'}
            </p>
          </div>
        </button>

        {/* Card 3: Prüfungssimulation */}
        <button
          type="button"
          onClick={onStartExam}
          className="group bento-card p-4 sm:p-5 text-left hover:border-amber-500/40 active:scale-[0.995] transition flex flex-col justify-between gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#141413] dark:text-white flex items-center justify-between">
              <span>Prüfungssimulation</span>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
              33 Zufallsfragen für {stateInfo.name} · 60 Minuten Zeit.
            </p>
          </div>
        </button>
      </section>

      {/* Subtle Compact Banners for Cloud Sync & AI Tutor */}
      {(!authUser || !apiKey.trim()) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!authUser && (
            <div className="bento-card p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Cloud className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-[#141413] dark:text-white">Geräte-Sync:</strong> Fortschritt
                  zwischen PC & Smartphone abgleichen.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F3F1EC] dark:bg-white/[0.08] text-[#141413] dark:text-white hover:opacity-85 transition"
              >
                Anmelden
              </button>
            </div>
          )}

          {!apiKey.trim() && (
            <div className="bento-card p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-[#141413] dark:text-white">KI-Lernhilfe:</strong> Fragen in
                  Einfacher Sprache (A2–B1) erklären lassen.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
              >
                Aktivieren
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
