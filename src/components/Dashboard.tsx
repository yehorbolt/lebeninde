import React from 'react';
import {
  BookOpen,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  CircleDot,
  Sparkles,
  ChevronRight,
  MapPin,
  Cloud,
} from 'lucide-react';
import {
  BUNDESLAENDER,
  BUNDESLAND_BY_CODE,
  getQuestionsForState,
  getTopicsForState,
} from '../data';
import type { StateCode } from '../types/question';
import { useAppStore } from '../store/useAppStore';

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
  const progress = useAppStore((s) => s.progress);
  const apiKey = useAppStore((s) => s.apiKey);
  const authUser = useAppStore((s) => s.authUser);
  const openCatalogWithFilter = useAppStore((s) => s.openCatalogWithFilter);

  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const activeQuestions = getQuestionsForState(selectedState);
  const activeTopics = getTopicsForState(selectedState);

  const totalCount = activeQuestions.length;
  let correctCount = 0;
  let mistakeCount = 0;

  for (const q of activeQuestions) {
    const entry = progress[q.id];
    if (entry) {
      if (entry.isCorrect) {
        correctCount++;
      } else {
        mistakeCount++;
      }
    }
  }

  const openCount = Math.max(0, totalCount - correctCount - mistakeCount);
  const masteryPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Bundesland Selector & Overall Mastery Card */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
        {/* Bundesland Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col shrink-0"
              aria-hidden="true"
            >
              <div className="h-1/2" style={{ backgroundColor: stateInfo.flagColors[0] }} />
              <div className="h-1/2" style={{ backgroundColor: stateInfo.flagColors[1] }} />
            </div>
            <div>
              <label
                htmlFor="dashboard-state-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Dein Bundesland (16 Regionen)
              </label>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Landeshauptstadt: <strong className="text-slate-700 dark:text-slate-200">{stateInfo.capital}</strong>
              </div>
            </div>
          </div>

          <div className="relative sm:min-w-[240px]">
            <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="dashboard-state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as StateCode)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {BUNDESLAENDER.map((bl) => (
                <option key={bl.code} value={bl.code}>
                  {bl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mastery Progress Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Dein Lernfortschritt
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Fortschritt für <strong className="text-slate-800 dark:text-slate-200">{stateInfo.name}</strong>:{' '}
              <strong className="text-slate-800 dark:text-slate-200">{correctCount}</strong> von{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> richtig
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {masteryPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
          role="progressbar"
          aria-valuenow={masteryPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Lernfortschritt in Prozent"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${masteryPercent}%` }}
          />
        </div>

        {/* Summary Pills */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Richtig</span>
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {correctCount}
            </div>
          </div>

          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5">
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Fehler</span>
            </div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
              {mistakeCount}
            </div>
          </div>

          <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 p-2.5">
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              <CircleDot className="w-3.5 h-3.5" />
              <span>Offen</span>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {openCount}
            </div>
          </div>
        </div>
      </section>

      {/* Primary Quick-Start Action Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Schnellstart
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Fragenkatalog */}
          <button
            type="button"
            onClick={() => openCatalogWithFilter('all')}
            className="group text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 p-5 shadow-sm transition active:scale-[0.99] flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3.5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Fragenkatalog</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Alle {totalCount} Fragen inkl. {stateInfo.name} in Ruhe üben.
              </p>
            </div>
          </button>

          {/* Card 2: Fehler wiederholen */}
          <button
            type="button"
            onClick={() => openCatalogWithFilter('mistakes')}
            className="group text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 p-5 shadow-sm transition active:scale-[0.99] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    mistakeCount > 0
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {mistakeCount === 1 ? '1 Fehler' : `${mistakeCount} Fehler`}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Fehler wiederholen</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {mistakeCount > 0
                  ? 'Übe gezielt die Fragen, die zuletzt falsch waren.'
                  : 'Aktuell keine offenen Fehler – super gemacht!'}
              </p>
            </div>
          </button>

          {/* Card 3: Prüfungssimulation */}
          <button
            type="button"
            onClick={onStartExam}
            className="group text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 p-5 shadow-sm transition active:scale-[0.99] flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3.5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Prüfungssimulation</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Test für {stateInfo.name} mit 60-Minuten-Timer.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Topics Breakdown */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Nach Themen üben
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {activeTopics.length} Themengebiete
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeTopics.map((topic) => {
            const topicQuestions = activeQuestions.filter((q) => q.topic === topic);
            const topicCorrect = topicQuestions.filter((q) => progress[q.id]?.isCorrect).length;
            const topicPct =
              topicQuestions.length > 0
                ? Math.round((topicCorrect / topicQuestions.length) * 100)
                : 0;
            const isRegionalTopic = topic === stateInfo.name;

            return (
              <button
                key={topic}
                type="button"
                onClick={() =>
                  isRegionalTopic
                    ? openCatalogWithFilter('state')
                    : openCatalogWithFilter('topic', topic)
                }
                className="text-left rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 hover:border-amber-500/40 transition"
              >
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
                  <span className="truncate">
                    {isRegionalTopic ? `Landesfragen: ${topic}` : topic}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                    {topicCorrect}/{topicQuestions.length}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${topicPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Cross-Device Cloud Sync Banner when logged out */}
      {!authUser && (
        <section className="rounded-2xl bg-sky-500/10 border border-sky-500/25 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Cloud className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <strong className="font-semibold">PC & Smartphone synchronisieren:</strong> Melde dich
              mit deinem Konto an, um Fortschritt, Bundesland und Einstellungen automatisch auf
              allen Geräten abzugleichen.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition"
          >
            Anmelden / Sync
          </button>
        </section>
      )}

      {/* AI Tutor Status Banner if no API Key set */}
      {!apiKey.trim() && (
        <section className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <strong className="font-semibold">Tipp – KI-Lernhilfe aktivieren:</strong> Hinterlege
              in den Einstellungen deinen kostenlosen Google Gemini API-Schlüssel, um dir jede Frage
              in einfacher Sprache erklären zu lassen.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
          >
            Schlüssel eingeben
          </button>
        </section>
      )}
    </div>
  );
};
