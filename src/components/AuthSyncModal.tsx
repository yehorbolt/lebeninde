import React, { useEffect, useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  AlertCircle,
  Database,
  Smartphone,
} from 'lucide-react';
import {
  getEffectiveSupabaseConfig,
  isSupabaseConfigured,
  saveCustomSupabaseConfig,
  signInWithGoogleDe,
  signInWithPasswordDe,
  signOutDe,
  signUpWithPasswordDe,
} from '../services/supabase';
import { useAppStore } from '../store/useAppStore';

interface AuthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncNow: () => Promise<void>;
  onConfigChanged: () => void;
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncNow,
  onConfigChanged,
}) => {
  const authUser = useAppStore((s) => s.authUser);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncError = useAppStore((s) => s.syncError);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Runtime Supabase configuration form (used if .env is not set)
  const effectiveConfig = getEffectiveSupabaseConfig();
  const [showConfigEditor, setShowConfigEditor] = useState(!isSupabaseConfigured());
  const [supabaseUrl, setSupabaseUrl] = useState(effectiveConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(effectiveConfig.anonKey);

  useEffect(() => {
    if (isOpen) {
      const cfg = getEffectiveSupabaseConfig();
      setSupabaseUrl(cfg.url);
      setSupabaseAnonKey(cfg.anonKey);
      setShowConfigEditor(!isSupabaseConfigured());
      setFormError(null);
      setInfoMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!supabaseUrl.trim().startsWith('http') || !supabaseAnonKey.trim()) {
      setFormError('Bitte gib eine gültige Supabase Projekt-URL (https://...) und den Anon-Key ein.');
      return;
    }
    saveCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
    onConfigChanged();
    setShowConfigEditor(false);
    setInfoMessage('Supabase-Verbindung gespeichert. Du kannst dich jetzt anmelden.');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);
    setBusy(true);

    try {
      if (mode === 'login') {
        await signInWithPasswordDe(email, password);
        setPassword('');
      } else {
        const { needsEmailConfirmation } = await signUpWithPasswordDe(email, password);
        setPassword('');
        if (needsEmailConfirmation) {
          setInfoMessage(
            'Konto erfolgreich erstellt! Bitte bestätige den Link in deiner E-Mail und melde dich danach an.'
          );
          setMode('login');
        } else {
          setInfoMessage('Konto erstellt und angemeldet! Deine Daten werden jetzt synchronisiert.');
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setBusy(true);
    try {
      await signInWithGoogleDe();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Google-Anmeldung fehlgeschlagen.');
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOutDe();
      setInfoMessage('Du wurdest abgemeldet. Auf diesem Gerät gespeicherte Daten bleiben lokal erhalten.');
    } finally {
      setBusy(false);
    }
  };

  const formattedLastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm pt-safe p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 pb-safe-modal space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="auth-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                Konto & Geräte-Sync
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PC & Smartphone nahtlos synchronisieren
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fenster schließen"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner about Device Data & Cloud Sync */}
        <div className="rounded-xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3.5 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <Smartphone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Jedes Gerät speichert deine Daten automatisch lokal. Wenn du dich anmeldest, werden{' '}
            <strong>
              Bundesland, Lernfortschritt, Fehlerliste, KI-Cache und dein Gemini API-Schlüssel
            </strong>{' '}
            verschlüsselt über dein Konto zwischen PC und Smartphone abgeglichen.
          </span>
        </div>

        {/* Alerts */}
        {formError && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {infoMessage && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Supabase Runtime Configuration (if not configured via .env or user wants to edit) */}
        {showConfigEditor && (
          <form
            onSubmit={handleSaveSupabaseConfig}
            className="rounded-2xl border border-amber-500/35 bg-amber-500/5 p-4 space-y-3.5"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Database className="w-4 h-4 text-amber-500" />
              <span>Supabase-Projekt verbinden</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hinterlege deine Supabase-Zugangsdaten in einer <code className="font-mono">.env</code>
              -Datei oder direkt hier (und führe einmalig{' '}
              <code className="font-mono">supabase/schema.sql</code> im Supabase SQL-Editor aus).
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supabase Projekt-URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                required
                className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supabase Public Anon-Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
                className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
              >
                Verbindung speichern
              </button>
              {configured && (
                <button
                  type="button"
                  onClick={() => setShowConfigEditor(false)}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        )}

        {/* Signed-In View */}
        {configured && !showConfigEditor && authUser && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Angemeldet als
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white break-all">
                    {authUser.email}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    syncStatus === 'error'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synchronisiere …</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Fehler</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Synchronisiert</span>
                    </>
                  )}
                </span>
              </div>

              {formattedLastSync && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Zuletzt abgeglichen um {formattedLastSync} Uhr
                </div>
              )}

              {syncError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {syncError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={syncStatus === 'syncing'}
                onClick={() => void onSyncNow()}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                />
                <span>Jetzt synchronisieren</span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleLogout()}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        )}

        {/* Signed-Out Login / Register Form */}
        {configured && !showConfigEditor && !authUser && (
          <div className="space-y-4">
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError(null);
                }}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFormError(null);
                }}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Konto erstellen
              </button>
            </div>

            <form onSubmit={(e) => void handleAuthSubmit(e)} className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.de"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Passwort (mindestens 6 Zeichen)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition"
              >
                {busy
                  ? 'Bitte warten …'
                  : mode === 'login'
                  ? 'Mit E-Mail anmelden'
                  : 'Kostenloses Konto erstellen'}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink mx-3 text-xs text-slate-400">oder</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGoogleLogin()}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Mit Google anmelden
            </button>

            {!effectiveConfig.fromEnv && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfigEditor(true)}
                  className="text-xs text-slate-500 hover:text-amber-500 underline"
                >
                  Supabase-Verbindungsdaten ändern
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
