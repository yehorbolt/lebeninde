import React from 'react';
import {
  BookMarked,
  ChevronRight,
  MapPin,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  BUNDESLAENDER,
  BUNDESLAND_BY_CODE,
  KURSBUCH_CHAPTERS,
  KURSBUCH_MODULES,
  getStateQuestions,
} from '../data';
import type { StateCode } from '../types/question';
import { getMasteryLevel, useAppStore } from '../store/useAppStore';

export const KursbuchView: React.FC = () => {
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const progress = useAppStore((s) => s.progress);
  const openCatalogWithChapter = useAppStore((s) => s.openCatalogWithChapter);
  const openCatalogWithFilter = useAppStore((s) => s.openCatalogWithFilter);

  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const stateQuestions = getStateQuestions(selectedState);

  // Overall Kursbuch mastery stats (300 federal questions)
  let totalMastered = 0;
  let totalLearned = 0;
  for (const ch of KURSBUCH_CHAPTERS) {
    for (const qId of ch.questionIds) {
      const lvl = getMasteryLevel(progress[qId]);
      if (lvl === 'gemeistert') totalMastered++;
      else if (lvl === 'gelernt') totalLearned++;
    }
  }
  const overallMasteredPct = Math.round((totalMastered / 300) * 100);

  // Regional stats (10 questions for selected Bundesland)
  let stateMastered = 0;
  let stateLearned = 0;
  let stateUnsure = 0;
  for (const q of stateQuestions) {
    const lvl = getMasteryLevel(progress[q.id]);
    if (lvl === 'gemeistert') stateMastered++;
    else if (lvl === 'gelernt') stateLearned++;
    else if (lvl === 'unsicher') stateUnsure++;
  }
  const stateMasteredPct =
    stateQuestions.length > 0 ? Math.round((stateMastered / stateQuestions.length) * 100) : 0;
  const stateLearnedPct =
    stateQuestions.length > 0 ? Math.round((stateLearned / stateQuestions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Bento Overview Header */}
      <section className="bento-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/25">
              <BookMarked className="w-3.5 h-3.5" />
              <span>Orientierungskurs · 12 Kapitel</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141413] dark:text-white pt-1">
              Lernen nach Kursbuch
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Alle 300 Bundesfragen passgenau sortiert nach den 12 Kapiteln des Hueber-Kursbuchs
              plus deine 10 Landesfragen. Unsichere und neue Fragen erscheinen automatisch zuerst.
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {totalMastered} <span className="text-sm font-semibold text-stone-400">/ 300</span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              Gemeistert ({overallMasteredPct}%)
            </div>
          </div>
        </div>

        {/* Multi-segment progress bar + Legend */}
        <div className="space-y-2">
          <div className="w-full h-2.5 rounded-full bg-[#F3F1EC] dark:bg-white/[0.06] overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(totalMastered / 300) * 100}%` }}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${(totalLearned / 300) * 100}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Gemeistert (ab 3× richtig)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Gelernt (1–2× richtig)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Unsicher
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Smart-Wiederholung aktiv
            </span>
          </div>
        </div>
      </section>

      {/* Modules I, II, III */}
      {KURSBUCH_MODULES.map((moduleTitle) => {
        const chapters = KURSBUCH_CHAPTERS.filter((c) => c.module === moduleTitle);
        return (
          <section key={moduleTitle} className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                {moduleTitle}
              </h2>
              <span className="text-xs text-stone-400 dark:text-slate-500">
                {chapters.length} Kapitel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chapters.map((ch) => {
                const total = ch.questionIds.length;
                let mastered = 0;
                let learned = 0;
                let unsure = 0;

                for (const id of ch.questionIds) {
                  const lvl = getMasteryLevel(progress[id]);
                  if (lvl === 'gemeistert') mastered++;
                  else if (lvl === 'gelernt') learned++;
                  else if (lvl === 'unsicher') unsure++;
                }

                const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
                const learnedPct = total > 0 ? Math.round((learned / total) * 100) : 0;
                const isComplete = mastered === total && total > 0;

                return (
                  <button
                    key={ch.chapterId}
                    type="button"
                    onClick={() => openCatalogWithChapter(ch.chapterId)}
                    className="group bento-card p-4 sm:p-4.5 text-left hover:border-amber-500/50 dark:hover:border-amber-400/40 active:scale-[0.995] transition flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#F3F1EC] dark:bg-white/[0.07] text-[#141413] dark:text-white">
                            Kap. {ch.chapterId}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-white/[0.04] text-stone-500 dark:text-slate-400">
                            {ch.pages}
                          </span>
                        </div>

                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Award className="w-3.5 h-3.5" />
                            100%
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>

                      <h3 className="text-sm sm:text-[15px] font-bold text-[#141413] dark:text-slate-100 leading-snug">
                        {ch.title}
                      </h3>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-600 dark:text-slate-300 tabular-nums">
                          <strong>{mastered}</strong> / {total} gemeistert ({masteredPct}%)
                        </span>
                        {unsure > 0 ? (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            {unsure} unsicher
                          </span>
                        ) : learned > 0 ? (
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            +{learned} gelernt
                          </span>
                        ) : null}
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#F3F1EC] dark:bg-white/[0.06] overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${masteredPct}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${learnedPct}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* 4th Section: Bundesland-Fragen */}
      <section className="space-y-2.5 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Regionalteil: Bundesland-Fragen
          </h2>

          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Bundesland wählen"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as StateCode)}
              className="rounded-lg glass-inset pl-7 pr-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {BUNDESLAENDER.map((bl) => (
                <option key={bl.code} value={bl.code}>
                  {bl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCatalogWithFilter('state')}
          className="w-full group bento-card p-5 text-left hover:border-amber-500/50 dark:hover:border-amber-400/40 active:scale-[0.997] transition space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl border border-stone-300 dark:border-white/15 overflow-hidden flex flex-col shrink-0"
                aria-hidden="true"
              >
                <div className="h-1/2" style={{ backgroundColor: stateInfo.flagColors[0] }} />
                <div className="h-1/2" style={{ backgroundColor: stateInfo.flagColors[1] }} />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Landesfragen · Landeshauptstadt {stateInfo.capital}
                </div>
                <h3 className="text-base font-bold text-[#141413] dark:text-white">
                  {stateInfo.name} ({stateQuestions.length} Fragen)
                </h3>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600 dark:text-slate-300 tabular-nums">
                <strong>{stateMastered}</strong> / {stateQuestions.length} gemeistert (
                {stateMasteredPct}%)
              </span>
              {stateUnsure > 0 ? (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {stateUnsure} unsicher
                </span>
              ) : stateLearned > 0 ? (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  +{stateLearned} gelernt
                </span>
              ) : null}
            </div>

            <div className="w-full h-2 rounded-full bg-[#F3F1EC] dark:bg-white/[0.06] overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${stateMasteredPct}%` }}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${stateLearnedPct}%` }}
              />
            </div>
          </div>
        </button>
      </section>
    </div>
  );
};
