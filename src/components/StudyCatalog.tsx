import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  CheckCircle2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import {
  BUNDESLAND_BY_CODE,
  generalQuestions,
  getQuestionsForState,
  getStateQuestions,
  getTopicsForState,
} from '../data';
import { useAppStore, type CatalogFilter } from '../store/useAppStore';
import { QuestionCard } from './QuestionCard';

interface StudyCatalogProps {
  onOpenSettings: () => void;
}

export const StudyCatalog: React.FC<StudyCatalogProps> = ({ onOpenSettings }) => {
  const selectedState = useAppStore((s) => s.selectedState);
  const catalogFilter = useAppStore((s) => s.catalogFilter);
  const selectedTopic = useAppStore((s) => s.selectedTopic);
  const setCatalogFilter = useAppStore((s) => s.setCatalogFilter);
  const setSelectedTopic = useAppStore((s) => s.setSelectedTopic);
  const progress = useAppStore((s) => s.progress);
  const recordAnswer = useAppStore((s) => s.recordAnswer);

  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const stateQuestions = useMemo(() => getStateQuestions(selectedState), [selectedState]);
  const activeQuestions = useMemo(() => getQuestionsForState(selectedState), [selectedState]);
  const activeTopics = useMemo(() => getTopicsForState(selectedState), [selectedState]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, number | undefined>>({});
  const [showJumpGrid, setShowJumpGrid] = useState(false);

  // Snapshot IDs for dynamic filters ('mistakes' & 'unanswered') so cards don't vanish mid-read
  const [snapshotIds, setSnapshotIds] = useState<string[]>([]);
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

  // Ensure selectedTopic belongs to activeTopics when switching states or to 'topic' filter
  useEffect(() => {
    if (catalogFilter === 'topic' && (!selectedTopic || !activeTopics.includes(selectedTopic))) {
      setSelectedTopic(activeTopics[0] ?? '');
    }
  }, [catalogFilter, selectedTopic, activeTopics, setSelectedTopic]);

  // Capture snapshot whenever filter, selected Bundesland, or manual refresh changes
  useEffect(() => {
    const currentProgress = useAppStore.getState().progress;
    const pool = getQuestionsForState(selectedState);
    if (catalogFilter === 'mistakes') {
      const ids = pool
        .filter((q) => currentProgress[q.id] && !currentProgress[q.id].isCorrect)
        .map((q) => q.id);
      setSnapshotIds(ids);
    } else if (catalogFilter === 'unanswered') {
      const ids = pool.filter((q) => !currentProgress[q.id]).map((q) => q.id);
      setSnapshotIds(ids);
    }
    setCurrentIndex(0);
    setSessionAnswers({});
    setShowJumpGrid(false);
  }, [catalogFilter, selectedTopic, selectedState, refreshCounter]);

  const filteredQuestions = useMemo(() => {
    switch (catalogFilter) {
      case 'general':
        return generalQuestions;
      case 'state':
        return stateQuestions;
      case 'topic':
        return selectedTopic
          ? activeQuestions.filter((q) => q.topic === selectedTopic)
          : activeQuestions;
      case 'mistakes':
      case 'unanswered': {
        const idSet = new Set(snapshotIds);
        return activeQuestions.filter((q) => idSet.has(q.id));
      }
      case 'all':
      default:
        return activeQuestions;
    }
  }, [catalogFilter, selectedTopic, snapshotIds, activeQuestions, stateQuestions]);

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQuestion = filteredQuestions[safeIndex];

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
    { id: 'general', label: `Allgemein (${generalQuestions.length})` },
    { id: 'state', label: `${stateInfo.name} (${stateQuestions.length})` },
    { id: 'unanswered', label: 'Offen', count: openCount },
    { id: 'mistakes', label: 'Fehler', count: mistakeCount },
    { id: 'topic', label: 'Nach Thema' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterButtons.map((btn) => {
            const active = catalogFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleSelectFilter(btn.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{btn.label}</span>
                {btn.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                      active
                        ? 'bg-slate-950/15 text-slate-950'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {btn.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

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
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {activeTopics.map((topic) => (
                <option key={topic} value={topic}>
                  Thema: {topic}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Refresh hint for dynamic lists */}
        {(catalogFilter === 'mistakes' || catalogFilter === 'unanswered') &&
          filteredQuestions.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>
                {catalogFilter === 'mistakes'
                  ? `${filteredQuestions.length} Fragen in dieser Fehler-Runde`
                  : `${filteredQuestions.length} offene Fragen in dieser Runde`}
              </span>
              <button
                type="button"
                onClick={() => setRefreshCounter((c) => c + 1)}
                className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Liste aktualisieren</span>
              </button>
            </div>
          )}
      </section>

      {/* Empty State */}
      {!currentQuestion ? (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {catalogFilter === 'mistakes'
                ? 'Keine Fehler vorhanden!'
                : catalogFilter === 'unanswered'
                ? 'Alle Fragen wurden bereits beantwortet!'
                : 'Keine Fragen für diesen Filter gefunden.'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {catalogFilter === 'mistakes'
                ? 'Du hast aktuell keine falsch beantworteten Fragen offen. Übe im gesamten Fragenkatalog weiter oder starte eine Prüfungssimulation.'
                : 'Wechsle auf „Alle“, um sämtliche Fragen erneut durchzugehen.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCatalogFilter('all')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Alle Fragen anzeigen</span>
          </button>
        </section>
      ) : (
        <>
          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            mode="study"
            selectedAnswer={sessionAnswers[currentQuestion.id]}
            onSelectAnswer={handleSelectAnswer}
            onResetAnswer={handleResetCurrentAnswer}
            showAiTutor={true}
            onOpenSettings={onOpenSettings}
            positionLabel={`Frage ${safeIndex + 1} von ${filteredQuestions.length}`}
          />

          {/* Navigation Controls */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>

              <button
                type="button"
                onClick={() => setShowJumpGrid((v) => !v)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500/50 transition"
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

            {/* Expandable Jump-to-Question Navigator */}
            {showJumpGrid && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Direkt zu einer Frage springen:</span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Richtig
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Fehler
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredQuestions.map((q, idx) => {
                    const saved = progress[q.id];
                    const isCurrent = idx === safeIndex;
                    let colorClass =
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent';
                    if (saved?.isCorrect) {
                      colorClass =
                        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
                    } else if (saved && !saved.isCorrect) {
                      colorClass =
                        'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
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
                        className={`h-9 rounded-lg text-xs font-bold border transition ${colorClass} ${
                          isCurrent ? 'ring-2 ring-amber-500' : 'hover:opacity-85'
                        }`}
                      >
                        {idx + 1}
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
