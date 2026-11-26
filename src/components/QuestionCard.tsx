import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ImageOff,
  RotateCcw,
  Languages,
  Info,
  Award,
} from 'lucide-react';
import type { Question } from '../types/question';
import { BUNDESLAND_BY_CODE } from '../data';
import {
  getMasteryLevel,
  normalizeStreak,
  useAppStore,
  type MasteryLevel,
} from '../store/useAppStore';
import {
  TRANSLATION_META_BY_CODE,
  useQuestionTranslation,
} from '../services/translations';
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

const MASTERY_BADGE_CONFIG: Record<
  MasteryLevel,
  { label: string; classes: string }
> = {
  neu: {
    label: 'Neu',
    classes:
      'bg-stone-100 text-stone-600 border-stone-200/80 dark:bg-white/[0.05] dark:text-slate-400 dark:border-white/[0.08]',
  },
  unsicher: {
    label: 'Unsicher',
    classes:
      'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  },
  gelernt: {
    label: 'Gelernt',
    classes:
      'bg-amber-500/12 text-amber-800 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  },
  gemeistert: {
    label: 'Gemeistert',
    classes:
      'bg-emerald-500/12 text-emerald-800 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  },
};

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
  const translationLang = useAppStore((s) => s.translationLang);
  const alwaysShowTranslation = useAppStore((s) => s.alwaysShowTranslation);
  const savedProgress = useAppStore((s) => s.progress[question.id]);

  const [imageFailed, setImageFailed] = useState(false);
  const [localShowTranslation, setLocalShowTranslation] = useState(alwaysShowTranslation);

  useEffect(() => {
    setImageFailed(false);
  }, [question.id, question.image]);

  useEffect(() => {
    setLocalShowTranslation(alwaysShowTranslation);
  }, [question.id, alwaysShowTranslation, translationLang]);

  const effectiveLang = mode === 'exam' ? 'none' : translationLang;
  const { translation, rtl } = useQuestionTranslation(question.id, effectiveLang);
  const showTranslatedText =
    effectiveLang !== 'none' && localShowTranslation && Boolean(translation);

  const hasAnswered = selectedAnswer !== undefined && selectedAnswer >= 0;
  const revealSolution = mode === 'review' || (mode === 'study' && hasAnswered);
  const isStateQuestion = question.category !== 'general';
  const stateLabel =
    question.category !== 'general'
      ? BUNDESLAND_BY_CODE[question.category]?.name ?? question.topic
      : question.topic;

  const langMeta = TRANSLATION_META_BY_CODE[effectiveLang] ?? TRANSLATION_META_BY_CODE.none;

  const masteryLevel = getMasteryLevel(savedProgress);
  const streakCount = Math.min(3, normalizeStreak(savedProgress));
  const masteryBadge = MASTERY_BADGE_CONFIG[masteryLevel];

  return (
    <article className="editorial-card p-5 sm:p-7 transition-colors">
      {/* Editorial Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b hairline-divider">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-[#F3F1EC] dark:bg-white/[0.06] text-[#141413] dark:text-slate-200">
            Nr. {question.id}
          </span>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isStateQuestion
                ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/25'
                : 'bg-stone-100/80 dark:bg-white/[0.04] text-stone-600 dark:text-slate-300 border-stone-200/80 dark:border-white/[0.07]'
            }`}
          >
            {isStateQuestion ? `Bundesland: ${stateLabel}` : stateLabel}
          </span>

          {/* Spaced-Repetition Mastery Badge (hidden during active timed exam) */}
          {mode !== 'exam' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${masteryBadge.classes}`}
              title="Lernstatus (Gemeistert ab 3 richtigen Antworten in Folge)"
            >
              {masteryLevel === 'gemeistert' && <Award className="w-3 h-3 shrink-0" />}
              <span>{masteryBadge.label}</span>
              {masteryLevel === 'gelernt' && (
                <span className="inline-flex items-center gap-0.5 ml-0.5" aria-label={`${streakCount} von 3`}>
                  {[0, 1, 2].map((dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        dotIdx < streakCount
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : 'bg-amber-500/25 dark:bg-white/15'
                      }`}
                    />
                  ))}
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {effectiveLang !== 'none' && (
            <button
              type="button"
              onClick={() => setLocalShowTranslation((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                localShowTranslation
                  ? 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25'
                  : 'bg-[#F3F1EC] dark:bg-white/[0.05] text-stone-600 dark:text-slate-400 border-transparent'
              }`}
              title={
                localShowTranslation
                  ? 'Übersetzung ausblenden'
                  : 'Übersetzung einblenden'
              }
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{langMeta.short}</span>
            </button>
          )}

          {positionLabel && (
            <span className="text-xs font-medium text-stone-500 dark:text-slate-400 tabular-nums">
              {positionLabel}
            </span>
          )}
          {mode === 'review' && !hasAnswered && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300">
              Nicht beantwortet
            </span>
          )}
        </div>
      </div>

      {/* Editorial Question Text */}
      <div className="mb-5 space-y-2">
        <h2 className="text-[17px] sm:text-[19px] font-semibold text-[#141413] dark:text-[#F3F4F6] leading-[1.55] tracking-[-0.01em]">
          {question.question}
        </h2>

        {showTranslatedText && translation && (
          <p
            dir={rtl ? 'rtl' : 'ltr'}
            className={`text-sm sm:text-[15px] text-indigo-700/90 dark:text-indigo-300/90 leading-relaxed font-normal ${
              rtl ? 'text-right' : 'text-left'
            }`}
          >
            {translation.q}
          </p>
        )}
      </div>

      {/* Optional Question Image */}
      {question.image && (
        <div className="mb-5">
          {!imageFailed ? (
            <div className="rounded-xl overflow-hidden border border-stone-200/90 dark:border-white/[0.08] bg-white p-3 flex justify-center">
              <img
                src={question.image}
                alt={`Abbildung zu Frage ${question.id}`}
                onError={() => setImageFailed(true)}
                className="max-h-72 w-auto object-contain rounded-lg"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 dark:border-white/15 bg-[#F3F1EC]/60 dark:bg-white/[0.03] p-4 flex items-center gap-3 text-xs text-stone-500 dark:text-slate-400">
              <ImageOff className="w-5 h-5 shrink-0 text-stone-400" />
              <span>
                Abbildung unter <code className="font-mono">{question.image}</code> nicht gefunden.
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
          const translatedOpt = showTranslatedText ? translation?.opts?.[idx] : undefined;

          let containerClasses =
            'border-stone-200/90 dark:border-white/[0.08] bg-[#FAF9F6] dark:bg-[#1B1F27]/70 hover:border-stone-300 dark:hover:border-white/[0.16] text-[#141413] dark:text-[#F3F4F6]';
          let badgeClasses =
            'bg-white dark:bg-[#14171D] text-stone-600 dark:text-slate-300 border border-stone-200/90 dark:border-white/[0.09]';

          if (revealSolution) {
            if (isCorrectOption) {
              containerClasses =
                'border-emerald-500/70 bg-emerald-500/[0.09] dark:bg-emerald-500/[0.14] text-emerald-950 dark:text-emerald-100';
              badgeClasses = 'bg-emerald-600 text-white border-emerald-600';
            } else if (isSelected && !isCorrectOption) {
              containerClasses =
                'border-rose-500/70 bg-rose-500/[0.09] dark:bg-rose-500/[0.14] text-rose-950 dark:text-rose-100';
              badgeClasses = 'bg-rose-600 text-white border-rose-600';
            } else {
              containerClasses =
                'border-stone-200/50 dark:border-white/[0.04] bg-[#FAF9F6]/50 dark:bg-[#14171D]/40 text-stone-400 dark:text-slate-500';
            }
          } else if (mode === 'exam' && isSelected) {
            containerClasses =
              'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 text-[#141413] dark:text-white ring-1 ring-amber-500/35';
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
              className={`w-full min-h-[58px] text-left rounded-xl border p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3.5 transition ${containerClasses} ${
                isInteractive ? 'cursor-pointer active:scale-[0.996]' : 'cursor-default'
              }`}
            >
              <span
                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${badgeClasses}`}
              >
                {OPTION_LETTERS[idx]}
              </span>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="text-[15px] sm:text-base font-medium leading-relaxed">
                  {optionText}
                </div>
                {translatedOpt && translatedOpt !== optionText && (
                  <div
                    dir={rtl ? 'rtl' : 'ltr'}
                    className={`text-xs sm:text-sm text-indigo-700/85 dark:text-indigo-300/80 leading-relaxed ${
                      rtl ? 'text-right' : 'text-left'
                    }`}
                  >
                    {translatedOpt}
                  </div>
                )}
              </div>

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
        <div className="mt-4 pt-3.5 border-t hairline-divider flex flex-wrap items-center justify-between gap-2 text-sm">
          {selectedAnswer === question.correctIndex ? (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Richtig! {streakCount >= 3 ? 'Frage gemeistert.' : `Serie: ${streakCount} / 3 bis „Gemeistert“.`}
            </span>
          ) : (
            <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Leider falsch – richtig ist Antwort {OPTION_LETTERS[question.correctIndex]}.
            </span>
          )}

          {onResetAnswer && (
            <button
              type="button"
              onClick={onResetAnswer}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-slate-400 hover:text-[#141413] dark:hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Antwort ausblenden</span>
            </button>
          )}
        </div>
      )}

      {/* Built-in Offline Explanation */}
      {revealSolution && (question.explanation || (showTranslatedText && translation?.exp)) && (
        <div className="mt-4 rounded-xl bg-[#F3F1EC]/80 dark:bg-[#1B1F27] border hairline-divider p-3.5 sm:p-4 space-y-2 text-xs sm:text-sm leading-relaxed">
          {question.explanation && (
            <div className="flex items-start gap-2.5 text-stone-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <p>{question.explanation}</p>
            </div>
          )}
          {showTranslatedText && translation?.exp && (
            <p
              dir={rtl ? 'rtl' : 'ltr'}
              className={`text-indigo-700 dark:text-indigo-300/90 pl-6 ${
                rtl ? 'text-right pl-0 pr-6' : 'text-left'
              }`}
            >
              {translation.exp}
            </p>
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
