import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { StateCode } from '../types/question';
import type { CachedExplanation, QuestionProgress, ThemeMode } from '../store/useAppStore';

const LOCAL_SUPABASE_CONFIG_KEY = 'lid-supabase-custom-config-v1';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export interface CloudSyncPayload {
  selectedState: StateCode;
  theme: ThemeMode;
  apiKey: string;
  aiModel: string;
  settingsUpdatedAt: number;
  progress: Record<string, QuestionProgress>;
  aiCache: Record<string, CachedExplanation>;
  updatedAt?: string;
}

interface UserSyncRow {
  user_id: string;
  selected_state: StateCode;
  theme: ThemeMode;
  api_key: string;
  ai_model: string;
  settings_updated_at: number;
  progress: Record<string, QuestionProgress>;
  ai_cache: Record<string, CachedExplanation>;
  updated_at: string;
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigSignature = '';

export function getCustomSupabaseConfig(): SupabaseRuntimeConfig {
  if (typeof window === 'undefined') return { url: '', anonKey: '' };
  try {
    const raw = window.localStorage.getItem(LOCAL_SUPABASE_CONFIG_KEY);
    if (!raw) return { url: '', anonKey: '' };
    const parsed = JSON.parse(raw) as Partial<SupabaseRuntimeConfig>;
    return {
      url: (parsed.url ?? '').trim(),
      anonKey: (parsed.anonKey ?? '').trim(),
    };
  } catch {
    return { url: '', anonKey: '' };
  }
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();
  if (!trimmedUrl && !trimmedKey) {
    window.localStorage.removeItem(LOCAL_SUPABASE_CONFIG_KEY);
  } else {
    window.localStorage.setItem(
      LOCAL_SUPABASE_CONFIG_KEY,
      JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey })
    );
  }
  cachedClient = null;
  cachedConfigSignature = '';
}

export function getEffectiveSupabaseConfig(): SupabaseRuntimeConfig & { fromEnv: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, fromEnv: true };
  }
  const custom = getCustomSupabaseConfig();
  return { ...custom, fromEnv: false };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getEffectiveSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getEffectiveSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  const sig = `${url}::${anonKey}`;
  if (cachedClient && cachedConfigSignature === sig) {
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cachedConfigSignature = sig;
  return cachedClient;
}

export function translateAuthErrorDe(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-Mail-Adresse oder Passwort ist falsch.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deinem Postfach.';
  }
  if (lower.includes('user already registered')) {
    return 'Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melde dich an.';
  }
  if (lower.includes('password should be at least')) {
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Zu viele Versuche in kurzer Zeit. Bitte warte einen Moment.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.';
  }
  return `Anmeldefehler: ${message}`;
}

export async function signInWithPasswordDe(email: string, password: string): Promise<User> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw new Error(translateAuthErrorDe(error.message));
  }
  if (!data.user) {
    throw new Error('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
  }
  return data.user;
}

export async function signUpWithPasswordDe(
  email: string,
  password: string
): Promise<{ user: User | null; needsEmailConfirmation: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.');
  }
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) {
    throw new Error(translateAuthErrorDe(error.message));
  }
  const needsEmailConfirmation = Boolean(data.user && !data.session);
  return { user: data.user, needsEmailConfirmation };
}

export async function signInWithGoogleDe(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.');
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    throw new Error(translateAuthErrorDe(error.message));
  }
}

export async function signOutDe(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

function rowToPayload(row: UserSyncRow): CloudSyncPayload {
  return {
    selectedState: row.selected_state || 'bw',
    theme: row.theme === 'light' ? 'light' : 'dark',
    apiKey: row.api_key ?? '',
    aiModel: row.ai_model || 'gemini-2.5-flash',
    settingsUpdatedAt: Number(row.settings_updated_at ?? 0),
    progress: row.progress ?? {},
    aiCache: row.ai_cache ?? {},
    updatedAt: row.updated_at,
  };
}

export async function fetchCloudSyncData(userId: string): Promise<CloudSyncPayload | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_sync_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      throw new Error(
        'Die Tabelle „user_sync_data“ fehlt noch in Supabase. Bitte führe einmalig die Datei supabase/schema.sql im SQL-Editor aus.'
      );
    }
    throw new Error(`Synchronisierungsfehler beim Laden: ${error.message}`);
  }

  if (!data) return null;
  return rowToPayload(data as UserSyncRow);
}

export async function pushCloudSyncData(
  userId: string,
  payload: CloudSyncPayload
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from('user_sync_data').upsert(
    {
      user_id: userId,
      selected_state: payload.selectedState,
      theme: payload.theme,
      api_key: payload.apiKey,
      ai_model: payload.aiModel,
      settings_updated_at: payload.settingsUpdatedAt,
      progress: payload.progress,
      ai_cache: payload.aiCache,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    if (error.code === '42P01') {
      throw new Error(
        'Die Tabelle „user_sync_data“ fehlt noch in Supabase. Bitte führe einmalig die Datei supabase/schema.sql im SQL-Editor aus.'
      );
    }
    throw new Error(`Synchronisierungsfehler beim Speichern: ${error.message}`);
  }
}

export function subscribeToCloudSync(
  userId: string,
  onRemoteUpdate: (payload: CloudSyncPayload) => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`user-sync-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_sync_data',
        filter: `user_id=eq.${userId}`,
      },
      (eventPayload) => {
        if (eventPayload.new && typeof eventPayload.new === 'object') {
          onRemoteUpdate(rowToPayload(eventPayload.new as UserSyncRow));
        }
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
