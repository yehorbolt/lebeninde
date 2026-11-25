import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ImageOff, RotateCcw } from 'lucide-react';
import type { Question } from '../types/question';
import { BUNDESLAND_BY_CODE } from '../data';
import { AiExplanationBox } from './AiExplanationBox';

export type QuestionCardMode = 'study' | 'exam' | 'review';

interface QuestionCardProps {
  question: Question;
  mode: QuestionCardMode;
  selectedAnswer?: number;
  onSelectAnswer?: (index: number) => void;
  onResetAnswer?: () => void;
  showAiTutor?: boolean;
  onOpenSettings: () => void;
  positionLabel?: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  mode,
  selectedAnswer,
  onSelectAnswer,
  onResetAnswer,
  showAiTutor = false,
  onOpenSettings,
  positionLabel,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [question.id, question.image]);

  const hasAnswered = selectedAnswer !== undefined && selectedAnswer >= 0;
  const revealSolution = mode === 'review' || (mode === 'study' && hasAnswered);
  const isStateQuestion = question.category !== 'general';
  const stateLabel =
    question.category !== 'general'
      ? BUNDESLAND_BY_CODE[question.category]?.name ?? question.topic
      : question.topic;

  return (
    <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-colors">
      {/* Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            Nr. {question.id}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
              isStateQuestion
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                : 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20'
            }`}
          >
            {isStateQuestion ? `Bundesland: ${stateLabel}` : stateLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {positionLabel && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {positionLabel}
            </span>
          )}
          {mode === 'review' && !hasAnswered && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Nicht beantwortet
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug mb-4">
        {question.question}
      </h2>

      {/* Optional Question Image */}
      {question.image && (
        <div className="mb-5">
          {!imageFailed ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2 flex justify-center">
              <img
                src={question.image}
                alt={`Abbildung zu Frage ${question.id}`}
                onError={() => setImageFailed(true)}
                className="max-h-60 w-auto object-contain rounded-lg"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <ImageOff className="w-5 h-5 shrink-0 text-slate-400" />
              <span>
                Abbildung unter <code className="font-mono">{question.image}</code> noch nicht
                vorhanden. Lege die Bilddatei im Ordner{' '}
                <code className="font-mono">public/images/</code> ab.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      <div className="space-y-2.5">
        {question.options.map((optionText, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectOption = question.correctIndex === idx;

          let containerClasses =
            'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100';
          let badgeClasses =
            'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

          if (revealSolution) {
            if (isCorrectOption) {
              containerClasses =
                'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-100';
              badgeClasses = 'bg-emerald-600 text-white border-emerald-600';
            } else if (isSelected && !isCorrectOption) {
              containerClasses =
                'border-rose-500 bg-rose-500/10 dark:bg-rose-500/15 text-rose-950 dark:text-rose-100';
              badgeClasses = 'bg-rose-600 text-white border-rose-600';
            } else {
              containerClasses =
                'border-slate-200/70 dark:border-slate-800/70 bg-slate-50/40 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 opacity-80';
            }
          } else if (mode === 'exam' && isSelected) {
            containerClasses =
              'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 text-slate-900 dark:text-white ring-1 ring-amber-500/40';
            badgeClasses = 'bg-amber-500 text-slate-950 border-amber-500 font-bold';
          }

          const isInteractive =
            mode === 'exam' || (mode === 'study' && !hasAnswered && Boolean(onSelectAnswer));

          return (
            <button
              key={idx}
              type="button"
              disabled={!isInteractive}
              onClick={() => isInteractive && onSelectAnswer?.(idx)}
              className={`w-full min-h-[56px] text-left rounded-xl border p-3.5 sm:p-4 flex items-center gap-3.5 transition ${containerClasses} ${
                isInteractive ? 'cursor-pointer active:scale-[0.995]' : 'cursor-default'
              }`}
            >
              <span
                className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center shrink-0 transition-colors ${badgeClasses}`}
              >
                {OPTION_LETTERS[idx]}
              </span>

              <span className="flex-1 text-sm sm:text-base font-medium leading-snug">
                {optionText}
              </span>

              {revealSolution && isCorrectOption && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              {revealSolution && isSelected && !isCorrectOption && (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Study feedback status & retry option */}
      {mode === 'study' && hasAnswered && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          {selectedAnswer === question.correctIndex ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Richtig beantwortet!
            </span>
          ) : (
            <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Leider falsch – die richtige Antwort ist {OPTION_LETTERS[question.correctIndex]}.
            </span>
          )}

          {onResetAnswer && (
            <button
              type="button"
              onClick={onResetAnswer}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Antwort ausblenden & neu üben</span>
            </button>
          )}
        </div>
      )}

      {/* AI Tutor Section */}
      {showAiTutor && (
        <AiExplanationBox question={question} onOpenSettings={onOpenSettings} />
      )}
    </article>
  );
};
