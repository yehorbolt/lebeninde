import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  BookMarked,
  ArrowLeft,
  Sparkles,
  ListOrdered,
} from 'lucide-react';
import {
  BUNDESLAND_BY_CODE,
  KURSBUCH_CHAPTERS,
  KURSBUCH_CHAPTER_BY_ID,
  generalQuestions,
  getQuestionsForChapter,
  getQuestionsForState,
  getStateQuestions,
  getTopicsForState,
} from '../data';
import type { Question } from '../types/question';
import {
  getMasteryLevel,
  getSpacedRepetitionPriority,
  useAppStore,
  type CatalogFilter,
} from '../store/useAppStore';
import { QuestionCard } from './QuestionCard';

interface StudyCatalogProps {
  onOpenSettings: () => void;
}

export const StudyCatalog: React.FC<StudyCatalogProps> = ({ onOpenSettings }) => {
  const selectedState = useAppStore((s) => s.selectedState);
  const catalogFilter = useAppStore((s) => s.catalogFilter);
  const selectedTopic = useAppStore((s) => s.selectedTopic);
  const selectedChapterId = useAppStore((s) => s.selectedChapterId);
  const setCatalogFilter = useAppStore((s) => s.setCatalogFilter);
  const setSelectedTopic = useAppStore((s) => s.setSelectedTopic);
  const setSelectedChapterId = useAppStore((s) => s.setSelectedChapterId);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const progress = useAppStore((s) => s.progress);
  const recordAnswer = useAppStore((s) => s.recordAnswer);

  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const stateQuestions = useMemo(() => getStateQuestions(selectedState), [selectedState]);
  const activeQuestions = useMemo(() => getQuestionsForState(selectedState), [selectedState]);
  const activeTopics = useMemo(() => getTopicsForState(selectedState), [selectedState]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, number | undefined>>({});
  const [showJumpGrid, setShowJumpGrid] = useState(false);

  // Smart Spaced-Repetition ordering ('smart' puts Unsicher & Neu first; 'numeric' keeps catalog order)
  const [sortOrder, setSortOrder] = useState<'smart' | 'numeric'>('smart');
  const [orderedSnapshotIds, setOrderedSnapshotIds] = useState<string[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Live counts for filter badges
  const { openCount, mistakeCount } = useMemo(() => {
    let open = 0;
    let mistakes = 0;
    for (const q of activeQuestions) {
      const p = progress[q.id];
      if (!p) open++;
      else if (!p.isCorrect) mistakes++;
    }
    return { openCount: open, mistakeCount: mistakes };
  }, [activeQuestions, progress]);

  useEffect(() => {
    if (catalogFilter === 'topic' && (!selectedTopic || !activeTopics.includes(selectedTopic))) {
      setSelectedTopic(activeTopics[0] ?? '');
    }
  }, [catalogFilter, selectedTopic, activeTopics, setSelectedTopic]);

  // Default sort mode: Smart priority when practicing a Kursbuch chapter or mistakes; numeric for 'all'
  useEffect(() => {
    if (catalogFilter === 'chapter' || catalogFilter === 'mistakes') {
      setSortOrder('smart');
    }
  }, [catalogFilter, selectedChapterId]);

  // Build stable ordered list of question IDs when filter, chapter, state, sortOrder, or manual refresh changes
  useEffect(() => {
    const currentProgress = useAppStore.getState().progress;
    const pool = getQuestionsForState(selectedState);

    let baseList: Question[] = [];
    switch (catalogFilter) {
      case 'general':
        baseList = generalQuestions;
        break;
      case 'state':
        baseList = getStateQuestions(selectedState);
        break;
      case 'chapter':
        baseList = getQuestionsForChapter(selectedChapterId);
        break;
      case 'topic':
        baseList = selectedTopic ? pool.filter((q) => q.topic === selectedTopic) : pool;
        break;
      case 'mistakes':
        baseList = pool.filter((q) => currentProgress[q.id] && !currentProgress[q.id].isCorrect);
        break;
      case 'unanswered':
        baseList = pool.filter((q) => !currentProgress[q.id]);
        break;
      case 'all':
      default:
        baseList = pool;
        break;
    }

    const sorted =
      sortOrder === 'smart'
        ? [...baseList].sort((a, b) => {
            const pa = getSpacedRepetitionPriority(currentProgress[a.id]);
            const pb = getSpacedRepetitionPriority(currentProgress[b.id]);
            if (pa !== pb) return pa - pb;
            return a.id.localeCompare(b.id);
          })
        : baseList;

    setOrderedSnapshotIds(sorted.map((q) => q.id));
    setCurrentIndex(0);
    setSessionAnswers({});
    setShowJumpGrid(false);
  }, [catalogFilter, selectedTopic, selectedChapterId, selectedState, sortOrder, refreshCounter]);

  const questionMap = useMemo(() => {
    const map: Record<string, Question> = {};
    for (const q of activeQuestions) {
      map[q.id] = q;
    }
    return map;
  }, [activeQuestions]);

  const filteredQuestions = useMemo(
    () => orderedSnapshotIds.map((id) => questionMap[id]).filter((q): q is Question => Boolean(q)),
    [orderedSnapshotIds, questionMap]
  );

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQuestion = filteredQuestions[safeIndex];
  const activeChapter = KURSBUCH_CHAPTER_BY_ID[selectedChapterId];

  const handleSelectFilter = (nextFilter: CatalogFilter) => {
    if (nextFilter === catalogFilter) {
      setRefreshCounter((c) => c + 1);
    } else {
      setCatalogFilter(nextFilter);
    }
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (!currentQuestion) return;
    const isCorrect = optionIdx === currentQuestion.correctIndex;
    setSessionAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIdx }));
    recordAnswer(currentQuestion.id, optionIdx, isCorrect);
  };

  const handleResetCurrentAnswer = () => {
    if (!currentQuestion) return;
    setSessionAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const filterButtons: Array<{ id: CatalogFilter; label: string; count?: number }> = [
    { id: 'all', label: 'Alle', count: activeQuestions.length },
    { id: 'chapter', label: 'Kursbuch' },
    { id: 'general', label: `Allgemein (${generalQuestions.length})` },
    { id: 'state', label: `${stateInfo.name} (${stateQuestions.length})` },
    { id: 'unanswered', label: 'Neu', count: openCount },
    { id: 'mistakes', label: 'Unsicher', count: mistakeCount },
    { id: 'topic', label: 'Thema' },
  ];

  return (
    <div className="space-y-4">
      {/* Segmented Filter & Sort Bar */}
      <section className="bento-card p-3.5 sm:p-4 space-y-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {filterButtons.map((btn) => {
            const active = catalogFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleSelectFilter(btn.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  active
                    ? 'bg-[#141413] text-white dark:bg-white dark:text-[#0B0D10] shadow-sm'
                    : 'bg-[#F3F1EC] dark:bg-white/[0.05] text-stone-600 dark:text-slate-300 hover:bg-stone-200/70 dark:hover:bg-white/[0.1]'
                }`}
              >
                <span>{btn.label}</span>
                {btn.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold tabular-nums ${
                      active
                        ? 'bg-white/20 text-white dark:bg-black/15 dark:text-[#0B0D10]'
                        : 'bg-white dark:bg-[#14171D] text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    {btn.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Kursbuch Chapter Selector Banner */}
        {catalogFilter === 'chapter' && (
          <div className="pt-2 border-t hairline-divider flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setActiveView('kursbuch')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Zur Kapitelübersicht</span>
            </button>

            <div className="relative flex-1 sm:max-w-md">
              <BookMarked className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Kursbuch-Kapitel auswählen"
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full rounded-xl glass-inset pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {KURSBUCH_CHAPTERS.map((ch) => (
                  <option key={ch.chapterId} value={ch.chapterId}>
                    Kap. {ch.chapterId}: {ch.title} ({ch.pages})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Topic Selector when 'topic' filter is active */}
        {catalogFilter === 'topic' && (
          <div className="pt-1">
            <label htmlFor="topic-select" className="sr-only">
              Thema auswählen
            </label>
            <select
              id="topic-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full rounded-xl glass-inset px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {activeTopics.map((topic) => (
                <option key={topic} value={topic}>
                  Thema: {topic}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* iOS Segmented Sort Switch (Smart Spaced-Repetition vs Numeric) + Refresh */}
        {filteredQuestions.length > 1 && (
          <div className="pt-2 border-t hairline-divider flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="inline-flex items-center p-0.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-white/40 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSortOrder('smart')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                  sortOrder === 'smart'
                    ? 'bg-white/90 dark:bg-white/[0.15] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Lern-Fokus</span>
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('numeric')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                  sortOrder === 'numeric'
                    ? 'bg-white/90 dark:bg-white/[0.15] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ListOrdered className="w-3 h-3" />
                <span>Nach Nr.</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-stone-500 dark:text-slate-400">
              {activeChapter && catalogFilter === 'chapter' && (
                <span className="hidden sm:inline font-medium">{activeChapter.pages}</span>
              )}
              <button
                type="button"
                onClick={() => setRefreshCounter((c) => c + 1)}
                className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Neu sortieren</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Empty State */}
      {!currentQuestion ? (
        <section className="bento-card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#141413] dark:text-white">
              {catalogFilter === 'mistakes'
                ? 'Keine unsicheren Fragen vorhanden!'
                : catalogFilter === 'unanswered'
                ? 'Alle Fragen wurden bereits beantwortet!'
                : 'Keine Fragen für diesen Filter gefunden.'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto">
              {catalogFilter === 'mistakes'
                ? 'Du hast aktuell keine falsch beantworteten Fragen offen. Lerne im Kursbuch weiter oder starte eine Prüfungssimulation.'
                : 'Wechsle auf „Alle“ oder wähle ein Kapitel im Kursbuch.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveView('kursbuch')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
            >
              <BookMarked className="w-4 h-4" />
              <span>Nach Kursbuch</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogFilter('all')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F3F1EC] dark:bg-white/[0.07] text-[#141413] dark:text-white transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Alle Fragen</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Editorial Question Card */}
          <QuestionCard
            question={currentQuestion}
            mode="study"
            selectedAnswer={sessionAnswers[currentQuestion.id]}
            onSelectAnswer={handleSelectAnswer}
            onResetAnswer={handleResetCurrentAnswer}
            showAiTutor={true}
            onOpenSettings={onOpenSettings}
            positionLabel={`${safeIndex + 1} / ${filteredQuestions.length}`}
          />

          {/* Navigation Controls */}
          <div className="bento-card p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold glass-inset text-slate-900 dark:text-slate-100 disabled:opacity-40 hover:bg-white/60 dark:hover:bg-white/[0.12] transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>

              <button
                type="button"
                onClick={() => setShowJumpGrid((v) => !v)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold glass-inset text-slate-800 dark:text-slate-200 hover:border-amber-500/50 transition tabular-nums"
                aria-expanded={showJumpGrid}
              >
                <Grid className="w-4 h-4 text-amber-500" />
                <span>
                  {safeIndex + 1} / {filteredQuestions.length}
                </span>
              </button>

              <button
                type="button"
                disabled={safeIndex >= filteredQuestions.length - 1}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(filteredQuestions.length - 1, i + 1))
                }
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-slate-950 disabled:opacity-40 hover:bg-amber-400 transition"
              >
                <span>Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Expandable Jump-to-Question Navigator with 4 Mastery Colors */}
            {showJumpGrid && (
              <div className="pt-3 border-t hairline-divider space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                  <span className="font-semibold">Frage direkt wählen:</span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Gemeistert
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Gelernt
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Unsicher
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredQuestions.map((q, idx) => {
                    const lvl = getMasteryLevel(progress[q.id]);
                    const isCurrent = idx === safeIndex;
                    let colorClass =
                      'bg-[#F3F1EC] dark:bg-white/[0.05] text-stone-600 dark:text-slate-300 border-transparent';
                    if (lvl === 'gemeistert') {
                      colorClass =
                        'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
                    } else if (lvl === 'gelernt') {
                      colorClass =
                        'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
                    } else if (lvl === 'unsicher') {
                      colorClass =
                        'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowJumpGrid(false);
                        }}
                        title={`Frage ${q.id}`}
                        className={`h-9 rounded-lg text-xs font-bold border transition tabular-nums ${colorClass} ${
                          isCurrent ? 'ring-2 ring-amber-500' : 'hover:opacity-85'
                        }`}
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
