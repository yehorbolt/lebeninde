import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Send,
  GraduationCap,
  Award,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import {
  BUNDESLAENDER,
  BUNDESLAND_BY_CODE,
  generalQuestions,
  getStateQuestions,
} from '../data';
import type { Question, StateCode } from '../types/question';
import { useAppStore } from '../store/useAppStore';
import { QuestionCard } from './QuestionCard';

interface ExamSimulatorProps {
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  onActiveExamChange: (isActive: boolean) => void;
  onOpenSettings: () => void;
}

const EXAM_DURATION_SECONDS = 60 * 60; // 60 minutes

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildExamQuestions(stateCode: StateCode): Question[] {
  const regionalPool = getStateQuestions(stateCode);
  const genTarget = Math.min(30, generalQuestions.length);
  const regTarget = Math.min(3, regionalPool.length);
  const pickedGeneral = shuffleArray(generalQuestions).slice(0, genTarget);
  const pickedRegional = shuffleArray(regionalPool).slice(0, regTarget);
  return [...pickedGeneral, ...pickedRegional];
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  autoStart = false,
  onAutoStartConsumed,
  onActiveExamChange,
  onOpenSettings,
}) => {
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const recordBulkAnswers = useAppStore((s) => s.recordBulkAnswers);
  const setActiveView = useAppStore((s) => s.setActiveView);

  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const statePool = useMemo(() => getStateQuestions(selectedState), [selectedState]);

  const [phase, setPhase] = useState<'intro' | 'running' | 'results'>('intro');
  const [examStateCode, setExamStateCode] = useState<StateCode>(selectedState);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');

  const startNewExam = useCallback(() => {
    const code = useAppStore.getState().selectedState;
    const generated = buildExamQuestions(code);
    setExamStateCode(code);
    setExamQuestions(generated);
    setExamAnswers({});
    setCurrentIndex(0);
    setSecondsLeft(EXAM_DURATION_SECONDS);
    setConfirmSubmit(false);
    setReviewFilter('all');
    setPhase('running');
  }, []);

  useEffect(() => {
    if (autoStart) {
      startNewExam();
      onAutoStartConsumed?.();
    }
  }, [autoStart, onAutoStartConsumed, startNewExam]);

  useEffect(() => {
    onActiveExamChange(phase === 'running');
    return () => onActiveExamChange(false);
  }, [phase, onActiveExamChange]);

  const finishExam = useCallback(
    (questionsToGrade: Question[], answersToGrade: Record<string, number>) => {
      const bulkEntries = questionsToGrade
        .filter((q) => answersToGrade[q.id] !== undefined)
        .map((q) => ({
          questionId: q.id,
          selectedIndex: answersToGrade[q.id],
          isCorrect: answersToGrade[q.id] === q.correctIndex,
        }));

      if (bulkEntries.length > 0) {
        recordBulkAnswers(bulkEntries);
      }

      setConfirmSubmit(false);
      setPhase('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [recordBulkAnswers]
  );

  // Countdown timer
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          finishExam(examQuestions, examAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, examQuestions, examAnswers, finishExam]);

  const totalCount = examQuestions.length;
  const answeredCount = Object.keys(examAnswers).length;
  const unansweredCount = Math.max(0, totalCount - answeredCount);

  const isFullExamSize = totalCount === 33;
  const passEinbuergerung = isFullExamSize ? 17 : Math.ceil(totalCount * (17 / 33));
  const passIntegrationskurs = isFullExamSize ? 15 : Math.ceil(totalCount * (15 / 33));

  const correctScore = useMemo(() => {
    if (phase !== 'results') return 0;
    return examQuestions.reduce(
      (acc, q) => acc + (examAnswers[q.id] === q.correctIndex ? 1 : 0),
      0
    );
  }, [phase, examQuestions, examAnswers]);

  const previewGeneralCount = Math.min(30, generalQuestions.length);
  const previewRegionalCount = Math.min(3, statePool.length);
  const previewTotalCount = previewGeneralCount + previewRegionalCount;

  if (phase === 'intro') {
    return (
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Prüfungssimulation
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Offizielle Testbedingungen für {stateInfo.name}
              </p>
            </div>
          </div>

          {/* Quick Bundesland selector before starting exam */}
          <div className="relative sm:min-w-[220px]">
            <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Bundesland für die Prüfung wählen"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as StateCode)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {BUNDESLAENDER.map((bl) => (
                <option key={bl.code} value={bl.code}>
                  {bl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Umfang
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {previewTotalCount} Fragen
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {previewGeneralCount} Allgemein + {previewRegionalCount} {stateInfo.name}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Bearbeitungszeit
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              60 Minuten
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keine Sofort-Lösung während des Tests
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Bestehensgrenze
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              17 / 33 Punkte
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Einbürgerung (15/33 für Integrationskurs)
            </p>
          </div>
        </div>

        {previewTotalCount < 33 && (
          <div className="rounded-xl bg-sky-500/10 border border-sky-500/25 p-3.5 text-xs sm:text-sm text-sky-800 dark:text-sky-200">
            <strong>Hinweis zum Beispieldatensatz:</strong> Aktuell sind {previewTotalCount}{' '}
            Beispielfragen für {stateInfo.name} geladen. Die Bestehensgrenze wird automatisch
            anteilig berechnet ({Math.ceil(previewTotalCount * (17 / 33))}/{previewTotalCount} für
            die Einbürgerung). Sobald der vollständige Katalog hinterlegt ist, umfasst die
            Simulation exakt 33 Zufallsfragen.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={startNewExam}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-[0.99] transition shadow-sm"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Prüfung jetzt starten</span>
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'running') {
    const currentQuestion = examQuestions[currentIndex];
    const timerUrgent = secondsLeft <= 300;
    const timerCritical = secondsLeft <= 60;

    return (
      <div className="space-y-4">
        {/* Sticky Exam Top Status Bar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold font-mono ${
                timerCritical
                  ? 'bg-rose-600 text-white animate-pulse'
                  : timerUrgent
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
              }`}
              aria-label="Verbleibende Prüfungszeit"
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              Beantwortet: <strong>{answeredCount}</strong> / {totalCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (unansweredCount > 0) {
                setConfirmSubmit(true);
              } else {
                finishExam(examQuestions, examAnswers);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition"
          >
            <Send className="w-4 h-4" />
            <span>Prüfung abgeben</span>
          </button>
        </div>

        {/* Inline Unanswered Confirmation Banner */}
        {confirmSubmit && (
          <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-amber-950 dark:text-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>
                  Noch {unansweredCount} {unansweredCount === 1 ? 'Frage ist' : 'Fragen sind'} offen.
                </strong>{' '}
                Möchtest du die Prüfung trotzdem jetzt abgeben und auswerten?
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
              >
                Weiter bearbeiten
              </button>
              <button
                type="button"
                onClick={() => finishExam(examQuestions, examAnswers)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Jetzt auswerten
              </button>
            </div>
          </div>
        )}

        {/* Active Exam Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            mode="exam"
            selectedAnswer={examAnswers[currentQuestion.id]}
            onSelectAnswer={(idx) =>
              setExamAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx }))
            }
            showAiTutor={false}
            onOpenSettings={onOpenSettings}
            positionLabel={`Aufgabe ${currentIndex + 1} von ${totalCount}`}
          />
        )}

        {/* Prev / Next + Compact Question Navigator Grid */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Zurück</span>
            </button>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Frage {currentIndex + 1} / {totalCount}
            </span>

            <button
              type="button"
              disabled={currentIndex >= totalCount - 1}
              onClick={() => setCurrentIndex((i) => Math.min(totalCount - 1, i + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-slate-950 disabled:opacity-40 hover:bg-amber-400 transition"
            >
              <span>Weiter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Fragenübersicht</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Beantwortet
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700" /> Offen
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5">
              {examQuestions.map((q, idx) => {
                const isAnswered = examAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition ${
                      isAnswered
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    } ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 ring-sky-500 dark:ring-offset-slate-900'
                        : 'hover:opacity-85'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Phase === 'results'
  const gradedStateName = BUNDESLAND_BY_CODE[examStateCode]?.name ?? stateInfo.name;
  const passedEinbuergerung = correctScore >= passEinbuergerung;
  const passedIntegrationskurs = correctScore >= passIntegrationskurs;
  const timeSpentSeconds = EXAM_DURATION_SECONDS - secondsLeft;
  const spentMinutes = Math.max(1, Math.ceil(timeSpentSeconds / 60));

  const reviewQuestions =
    reviewFilter === 'wrong'
      ? examQuestions.filter((q) => examAnswers[q.id] !== q.correctIndex)
      : examQuestions;

  return (
    <div className="space-y-6">
      {/* Results Summary Card */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                passedEinbuergerung
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {passedEinbuergerung ? (
                <Award className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  passedEinbuergerung
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                }`}
              >
                {passedEinbuergerung ? 'Bestanden!' : 'Nicht bestanden'} · {gradedStateName}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Ergebnis: {correctScore} von {totalCount} richtig
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Bearbeitungsdauer: ca. {spentMinutes} {spentMinutes === 1 ? 'Minute' : 'Minuten'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startNewExam}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Neue Prüfung</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <span>Zur Startseite</span>
            </button>
          </div>
        </div>

        {/* Pass/Fail Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={`rounded-xl p-4 border ${
              passedEinbuergerung
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="text-slate-900 dark:text-white">Einbürgerungstest</span>
              <span
                className={
                  passedEinbuergerung
                    ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1'
                    : 'text-rose-700 dark:text-rose-300 flex items-center gap-1'
                }
              >
                {passedEinbuergerung ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Bestanden
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Nicht bestanden
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Erforderlich: mindestens{' '}
              <strong>
                {passEinbuergerung} / {totalCount}
              </strong>{' '}
              richtige Antworten
              {!isFullExamSize && ' (entspricht offiziell 17 / 33)'}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              passedIntegrationskurs
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="text-slate-900 dark:text-white">Integrationskurs</span>
              <span
                className={
                  passedIntegrationskurs
                    ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1'
                    : 'text-rose-700 dark:text-rose-300 flex items-center gap-1'
                }
              >
                {passedIntegrationskurs ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Bestanden
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Nicht bestanden
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Erforderlich: mindestens{' '}
              <strong>
                {passIntegrationskurs} / {totalCount}
              </strong>{' '}
              richtige Antworten
              {!isFullExamSize && ' (entspricht offiziell 15 / 33)'}
            </p>
          </div>
        </div>
      </section>

      {/* Full Answer Review Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Antworten überprüfen
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                reviewFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Alle ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('wrong')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                reviewFilter === 'wrong'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Fehler & Offen ({totalCount - correctScore})
            </button>
          </div>
        </div>

        {reviewQuestions.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
            Perfekt! Du hast alle Fragen in dieser Prüfung fehlerfrei beantwortet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviewQuestions.map((q) => {
              const originalIdx = examQuestions.findIndex((item) => item.id === q.id);
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  mode="review"
                  selectedAnswer={examAnswers[q.id]}
                  showAiTutor={true}
                  onOpenSettings={onOpenSettings}
                  positionLabel={`Prüfungsfrage ${originalIdx + 1} von ${totalCount}`}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
