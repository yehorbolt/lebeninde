import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  BookOpen,
  GraduationCap,
  Settings,
  Sun,
  Moon,
  AlertCircle,
  Cloud,
  RefreshCw,
  Languages,
  Check,
} from 'lucide-react';
import { BUNDESLAND_BY_CODE } from './data';
import type { TranslationLang } from './types/question';
import { applyThemeToDocument, useAppStore, type AppView } from './store/useAppStore';
import { TRANSLATION_LANGUAGES, TRANSLATION_META_BY_CODE } from './services/translations';
import { useCloudSync } from './hooks/useCloudSync';
import { Dashboard } from './components/Dashboard';
import { StudyCatalog } from './components/StudyCatalog';
import { ExamSimulator } from './components/ExamSimulator';
import { SettingsModal } from './components/SettingsModal';
import { AuthSyncModal } from './components/AuthSyncModal';

export const App: React.FC = () => {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const selectedState = useAppStore((s) => s.selectedState);
  const translationLang = useAppStore((s) => s.translationLang);
  const setTranslationLang = useAppStore((s) => s.setTranslationLang);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const apiKey = useAppStore((s) => s.apiKey);
  const authUser = useAppStore((s) => s.authUser);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [supabaseConfigVersion, setSupabaseConfigVersion] = useState(0);
  const [examAutoStart, setExamAutoStart] = useState(false);
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);

  const langMenuRef = useRef<HTMLDivElement>(null);

  const { syncNow } = useCloudSync(supabaseConfigVersion);
  const stateInfo = BUNDESLAND_BY_CODE[selectedState];
  const activeLangMeta =
    TRANSLATION_META_BY_CODE[translationLang] ?? TRANSLATION_META_BY_CODE.none;

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langMenuOpen]);

  const handleNavigate = (targetView: AppView) => {
    if (targetView === activeView) return;
    if (isExamRunning) {
      setPendingView(targetView);
      return;
    }
    setActiveView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickStartExam = () => {
    setExamAutoStart(true);
    setActiveView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: Array<{ id: AppView; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Startseite', icon: <Home className="w-5 h-5" /> },
    { id: 'catalog', label: 'Fragenkatalog', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'exam', label: 'Prüfung', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 min-h-[60px] py-2 flex items-center justify-between gap-2">
          {/* App Brand & Title */}
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left group min-w-0 shrink"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col shrink-0 shadow-sm">
              <div className="h-1/3 bg-slate-950" />
              <div className="h-1/3 bg-red-600" />
              <div className="h-1/3 bg-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight whitespace-nowrap">
                Leben in Deutschland
              </div>
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 leading-tight truncate">
                {stateInfo.name}
              </div>
            </div>
          </button>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Compact Icon-Only Actions: Translation, Cloud Sync, Theme & Settings */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Compact Translation Icon Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((v) => !v)}
                aria-label="Übersetzungssprache auswählen"
                aria-expanded={langMenuOpen}
                title={`Übersetzung: ${activeLangMeta.label}`}
                className={`relative p-2 rounded-xl transition flex items-center justify-center ${
                  translationLang !== 'none'
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Languages className="w-5 h-5" />
                {translationLang !== 'none' && (
                  <span className="absolute -bottom-0.5 -right-0.5 px-1 rounded text-[9px] font-extrabold leading-tight bg-indigo-600 text-white">
                    {activeLangMeta.short}
                  </span>
                )}
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Übersetzungshilfe
                  </div>
                  {TRANSLATION_LANGUAGES.map((l) => {
                    const isSelected = translationLang === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setTranslationLang(l.code as TranslationLang);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition ${
                          isSelected
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                        }`}
                      >
                        <span className="truncate">
                          <strong className="inline-block w-6 text-xs opacity-75">{l.short}</strong>{' '}
                          {l.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compact Cloud Sync Icon Button */}
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              aria-label="Konto und Geräte-Synchronisierung"
              title={
                authUser
                  ? `Synchronisiert (${authUser.email})`
                  : 'Anmelden für Geräte-Synchronisierung'
              }
              className={`relative p-2 rounded-xl transition ${
                authUser
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
              {authUser && syncStatus !== 'syncing' && (
                <span
                  className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                    syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
              )}
            </button>

            {/* Theme Toggle Icon Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'
              }
              title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Settings Icon Button */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Einstellungen öffnen"
              title="Einstellungen"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Settings className="w-5 h-5" />
              <span
                className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                  apiKey.trim() ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={
                  apiKey.trim()
                    ? 'Gemini API-Schlüssel hinterlegt'
                    : 'Noch kein API-Schlüssel hinterlegt'
                }
              />
            </button>
          </div>
        </div>
      </header>

      {/* Guard Confirmation Banner if Navigating Away During Active Exam */}
      {pendingView && (
        <div className="max-w-3xl w-full mx-auto px-4 pt-4">
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/35 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-rose-900 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>Laufende Prüfung abbrechen?</strong> Dein aktueller Prüfungsdurchgang wird
                beim Verlassen beendet.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPendingView(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
              >
                In der Prüfung bleiben
              </button>
              <button
                type="button"
                onClick={() => {
                  const dest = pendingView;
                  setPendingView(null);
                  setIsExamRunning(false);
                  setActiveView(dest);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-500"
              >
                Prüfung abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 pb-24 md:pb-10">
        {activeView === 'dashboard' && (
          <Dashboard
            onStartExam={handleQuickStartExam}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeView === 'catalog' && (
          <StudyCatalog onOpenSettings={() => setSettingsOpen(true)} />
        )}

        {activeView === 'exam' && (
          <ExamSimulator
            autoStart={examAutoStart}
            onAutoStartConsumed={() => setExamAutoStart(false)}
            onActiveExamChange={setIsExamRunning}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav
        aria-label="Hauptnavigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-3 max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-semibold transition ${
                  active
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Account & Cloud Sync Modal */}
      <AuthSyncModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSyncNow={syncNow}
        onConfigChanged={() => setSupabaseConfigVersion((v) => v + 1)}
      />
    </div>
  );
};

export default App;
