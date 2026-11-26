import React, { useEffect, useState } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Check,
  Sparkles,
  Sun,
  Moon,
  MapPin,
  Languages,
} from 'lucide-react';
import { BUNDESLAENDER } from '../data';
import type { StateCode, TranslationLang } from '../types/question';
import { useAppStore } from '../store/useAppStore';
import {
  DEFAULT_AI_MODELS,
  fetchAvailableGeminiModels,
  type AiModelOption,
} from '../services/aiTutor';
import { TRANSLATION_LANGUAGES } from '../services/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const selectedState = useAppStore((s) => s.selectedState);
  const translationLang = useAppStore((s) => s.translationLang);
  const alwaysShowTranslation = useAppStore((s) => s.alwaysShowTranslation);
  const apiKey = useAppStore((s) => s.apiKey);
  const aiModel = useAppStore((s) => s.aiModel);
  const theme = useAppStore((s) => s.theme);
  const authUser = useAppStore((s) => s.authUser);
  const progressCount = useAppStore((s) => Object.keys(s.progress).length);
  const cacheCount = useAppStore((s) => Object.keys(s.aiCache).length);

  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const setTranslationLang = useAppStore((s) => s.setTranslationLang);
  const setAlwaysShowTranslation = useAppStore((s) => s.setAlwaysShowTranslation);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const setAiModel = useAppStore((s) => s.setAiModel);
  const setTheme = useAppStore((s) => s.setTheme);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const clearAiCache = useAppStore((s) => s.clearAiCache);

  const [draftKey, setDraftKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [modelOptions, setModelOptions] = useState<AiModelOption[]>(DEFAULT_AI_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [confirmResetProgress, setConfirmResetProgress] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftKey(apiKey);
      setShowKey(false);
      setSavedNotice(false);
      setConfirmResetProgress(false);
      setConfirmClearCache(false);
      setStatusMessage(null);

      if (apiKey.trim()) {
        setLoadingModels(true);
        void fetchAvailableGeminiModels(apiKey)
          .then((discovered) => {
            if (discovered.length > 0) {
              setModelOptions([DEFAULT_AI_MODELS[0], ...discovered]);
            }
          })
          .finally(() => setLoadingModels(false));
      }
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftKey.trim();
    setApiKey(cleaned);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);

    if (cleaned) {
      setLoadingModels(true);
      void fetchAvailableGeminiModels(cleaned)
        .then((discovered) => {
          if (discovered.length > 0) {
            setModelOptions([DEFAULT_AI_MODELS[0], ...discovered]);
          }
        })
        .finally(() => setLoadingModels(false));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md pt-safe p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass-modal p-5 sm:p-6 pb-safe-modal space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="settings-modal-title"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
          >
            Einstellungen
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Einstellungen schließen"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bundesland Selection */}
        <div className="space-y-2">
          <label
            htmlFor="settings-state-select"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Bundesland für Prüfung & Fragenkatalog</span>
          </label>
          <select
            id="settings-state-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as StateCode)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {BUNDESLAENDER.map((bl) => (
              <option key={bl.code} value={bl.code}>
                {bl.name} ({bl.capital})
              </option>
            ))}
          </select>
        </div>

        {/* Translation Helper Language */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label
            htmlFor="settings-translation-select"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            <Languages className="w-4 h-4 text-indigo-500" />
            <span>Übersetzungshilfe für Fragen & Antworten</span>
          </label>
          <select
            id="settings-translation-select"
            value={translationLang}
            onChange={(e) => setTranslationLang(e.target.value as TranslationLang)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {TRANSLATION_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          {translationLang !== 'none' && (
            <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={alwaysShowTranslation}
                onChange={(e) => setAlwaysShowTranslation(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span>Übersetzung im Lernmodus sofort unter jeder Frage anzeigen</span>
            </label>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hinweis: Während einer laufenden Prüfungssimulation bleibt der Test wie in der echten
            BAMF-Prüfung rein auf Deutsch.
          </p>
        </div>

        {/* Theme Switch */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Darstellung
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition ${
                theme === 'dark'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dunkel</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition ${
                theme === 'light'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-800'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Hell</span>
            </button>
          </div>
        </div>

        {/* Gemini API Key & Model */}
        <form
          onSubmit={handleSaveKey}
          className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>KI-Lernhilfe (Google Gemini)</span>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="gemini-api-key"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Google Gemini API-Schlüssel
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="gemini-api-key"
                type={showKey ? 'text' : 'password'}
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="API-Schlüssel hier einfügen …"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-11 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Schlüssel verbergen' : 'Schlüssel anzeigen'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {authUser
                ? 'Dein Schlüssel ist lokal gespeichert und wird geschützt über dein angemeldetes Konto mit deinen anderen Geräten synchronisiert.'
                : 'Dein Schlüssel wird lokal auf diesem Gerät gespeichert (oder bei Anmeldung mit deinen eigenen Geräten synchronisiert).'}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="gemini-model-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                KI-Modell
              </label>
              {loadingModels && (
                <span className="text-[11px] text-amber-500 font-medium">
                  Lade verfügbare Modelle …
                </span>
              )}
            </div>
            <select
              id="gemini-model-select"
              value={
                modelOptions.some((m) => m.id === aiModel) ? aiModel : 'auto'
              }
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4" />
                <span>Gespeichert!</span>
              </>
            ) : (
              <span>API-Schlüssel speichern</span>
            )}
          </button>
        </form>

        {/* Data Reset Controls */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">
            Gespeicherte Daten verwalten
          </span>

          {statusMessage && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {statusMessage}
            </div>
          )}

          {/* Clear AI Cache */}
          {!confirmClearCache ? (
            <button
              type="button"
              onClick={() => setConfirmClearCache(true)}
              disabled={cacheCount === 0}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 disabled:opacity-45 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>KI-Cache leeren</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {cacheCount} gespeichert
              </span>
            </button>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Alle {cacheCount} gespeicherten KI-Erklärungen löschen?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmClearCache(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAiCache();
                    setConfirmClearCache(false);
                    setStatusMessage('Der KI-Cache wurde erfolgreich geleert.');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white"
                >
                  Ja, leeren
                </button>
              </div>
            </div>
          )}

          {/* Reset Learning Progress */}
          {!confirmResetProgress ? (
            <button
              type="button"
              onClick={() => setConfirmResetProgress(true)}
              disabled={progressCount === 0}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold border border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300 disabled:opacity-45 hover:bg-rose-500/10 transition"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Fortschritt zurücksetzen</span>
              </span>
              <span className="text-xs opacity-80">{progressCount} beantwortet</span>
            </button>
          ) : (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                Gesamten Lernfortschritt und Fehlerliste wirklich löschen?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmResetProgress(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetProgress();
                    setConfirmResetProgress(false);
                    setStatusMessage('Dein Lernfortschritt wurde vollständig zurückgesetzt.');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white"
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
