import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  BookOpenCheck,
  Lightbulb,
  Languages,
  Settings,
  CheckCircle,
} from 'lucide-react';
import type { Question } from '../types/question';
import { useAppStore } from '../store/useAppStore';
import { AiTutorError, generateQuestionExplanation } from '../services/aiTutor';

interface AiExplanationBoxProps {
  question: Question;
  onOpenSettings: () => void;
}

export const AiExplanationBox: React.FC<AiExplanationBoxProps> = ({
  question,
  onOpenSettings,
}) => {
  const apiKey = useAppStore((s) => s.apiKey);
  const aiModel = useAppStore((s) => s.aiModel);
  const cached = useAppStore((s) => s.aiCache[question.id]);
  const setCachedExplanation = useAppStore((s) => s.setCachedExplanation);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; missingKey: boolean } | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setIsLoading(false);
    setError(null);
  }, [question.id]);

  const fetchExplanation = async (forceRefresh = false) => {
    setIsOpen(true);
    setError(null);

    if (cached && !forceRefresh) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateQuestionExplanation(question, apiKey, aiModel);
      setCachedExplanation(question.id, result);
    } catch (err) {
      if (err instanceof AiTutorError) {
        setError({ message: err.message, missingKey: err.missingKey });
      } else {
        setError({
          message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
          missingKey: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t hairline-divider">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => void fetchExplanation(false)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/12 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 active:scale-[0.99] transition"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Mit KI erklären</span>
          {cached && (
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-3 h-3" />
              Gespeichert
            </span>
          )}
        </button>
      ) : (
        <div className="rounded-2xl bg-[#F3F1EC]/75 dark:bg-[#1B1F27] border hairline-divider p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>KI-Lernhilfe (Einfache Sprache A2–B1)</span>
            </div>
            {cached && !isLoading && (
              <button
                type="button"
                onClick={() => void fetchExplanation(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 transition"
                title="Erklärung neu mit Gemini erstellen"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Neu generieren</span>
              </button>
            )}
          </div>

          {isLoading && (
            <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                KI erstellt eine leicht verständliche Erklärung auf Deutsch …
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-700 dark:text-rose-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error.message}</p>
              </div>
              <div className="flex flex-wrap gap-2 pl-7">
                {error.missingKey && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Einstellungen öffnen</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void fetchExplanation(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Erneut versuchen</span>
                </button>
              </div>
            </div>
          )}

          {!isLoading && cached && (
            <div className="space-y-3.5 text-sm leading-relaxed">
              {cached.kurzErklaert || cached.wichtigeWoerter.length > 0 || cached.eselsbruecke ? (
                <>
                  {cached.kurzErklaert && (
                    <div className="rounded-xl bg-white dark:bg-slate-950/70 p-3.5 border border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                        <BookOpenCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>1. Kurz erklärt:</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{cached.kurzErklaert}</p>
                    </div>
                  )}

                  {cached.wichtigeWoerter.length > 0 && (
                    <div className="rounded-xl bg-white dark:bg-slate-950/70 p-3.5 border border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                        <Languages className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>2. Wichtige Wörter:</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                        {cached.wichtigeWoerter.map((wort, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-sky-500 font-bold">•</span>
                            <span>{wort}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cached.eselsbruecke && (
                    <div className="rounded-xl bg-amber-500/10 dark:bg-amber-500/10 p-3.5 border border-amber-500/25">
                      <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300 mb-1">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>3. Eselsbrücke:</span>
                      </div>
                      <p className="text-amber-950/90 dark:text-amber-100/90">
                        {cached.eselsbruecke}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-white dark:bg-slate-950/70 p-3.5 border border-slate-200/80 dark:border-slate-800/80 whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {cached.rawText}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
