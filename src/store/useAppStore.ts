import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateCode, TranslationLang } from '../types/question';
import type { CloudSyncPayload } from '../services/supabase';

export type ThemeMode = 'dark' | 'light';
export type AppView = 'dashboard' | 'catalog' | 'exam';
export type CatalogFilter = 'all' | 'general' | 'state' | 'unanswered' | 'mistakes' | 'topic';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface QuestionProgress {
  selectedIndex: number;
  isCorrect: boolean;
  updatedAt: number;
}

export interface CachedExplanation {
  kurzErklaert: string;
  wichtigeWoerter: string[];
  eselsbruecke: string;
  rawText: string;
  model: string;
  createdAt: number;
}

export interface AuthUserInfo {
  id: string;
  email: string;
}

interface AppState {
  // Transient navigation & sync status
  activeView: AppView;
  catalogFilter: CatalogFilter;
  selectedTopic: string;
  authUser: AuthUserInfo | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;
  syncRevision: number;

  // Persisted & cloud-synced personal settings
  selectedState: StateCode;
  theme: ThemeMode;
  apiKey: string;
  aiModel: string;
  translationLang: TranslationLang;
  alwaysShowTranslation: boolean;
  settingsUpdatedAt: number;

  // Persisted & cloud-synced learning data
  progress: Record<string, QuestionProgress>;
  aiCache: Record<string, CachedExplanation>;

  // Navigation actions
  setActiveView: (view: AppView) => void;
  openCatalogWithFilter: (filter: CatalogFilter, topic?: string) => void;
  setCatalogFilter: (filter: CatalogFilter) => void;
  setSelectedTopic: (topic: string) => void;

  // Settings actions
  setSelectedState: (stateCode: StateCode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  setTranslationLang: (lang: TranslationLang) => void;
  setAlwaysShowTranslation: (show: boolean) => void;

  // Learning & AI cache actions
  recordAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  recordBulkAnswers: (
    entries: Array<{ questionId: string; selectedIndex: number; isCorrect: boolean }>
  ) => void;
  resetProgress: () => void;
  setCachedExplanation: (questionId: string, explanation: CachedExplanation) => void;
  clearAiCache: () => void;

  // Auth & Cloud Sync actions
  setAuthUser: (user: AuthUserInfo | null) => void;
  setSyncMeta: (status: SyncStatus, error?: string | null, syncedAt?: number) => void;
  getLocalSyncPayload: () => CloudSyncPayload;
  mergeWithCloudPayload: (remote: CloudSyncPayload) => CloudSyncPayload;
  applyRemoteRealtimeUpdate: (remote: CloudSyncPayload) => void;
}

export const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeView: 'dashboard',
      catalogFilter: 'all',
      selectedTopic: '',
      authUser: null,
      syncStatus: 'idle',
      syncError: null,
      lastSyncedAt: null,
      syncRevision: 0,

      selectedState: 'bw',
      theme: 'dark',
      apiKey: '',
      aiModel: 'gemini-2.5-flash',
      translationLang: 'none',
      alwaysShowTranslation: true,
      settingsUpdatedAt: 0,

      progress: {},
      aiCache: {},

      setActiveView: (view) => set({ activeView: view }),

      openCatalogWithFilter: (filter, topic) =>
        set((state) => ({
          activeView: 'catalog',
          catalogFilter: filter,
          selectedTopic: topic ?? state.selectedTopic,
        })),

      setCatalogFilter: (filter) => set({ catalogFilter: filter }),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),

      setSelectedState: (selectedState) =>
        set((state) => ({
          selectedState,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set((state) => ({
          theme,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        }));
      },

      toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDocument(nextTheme);
        set((state) => ({
          theme: nextTheme,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        }));
      },

      setApiKey: (apiKey) =>
        set((state) => ({
          apiKey,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      setAiModel: (aiModel) =>
        set((state) => ({
          aiModel,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      setTranslationLang: (translationLang) =>
        set((state) => ({
          translationLang,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      setAlwaysShowTranslation: (alwaysShowTranslation) =>
        set((state) => ({
          alwaysShowTranslation,
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      recordAnswer: (questionId, selectedIndex, isCorrect) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [questionId]: {
              selectedIndex,
              isCorrect,
              updatedAt: Date.now(),
            },
          },
          syncRevision: state.syncRevision + 1,
        })),

      recordBulkAnswers: (entries) =>
        set((state) => {
          const nextProgress = { ...state.progress };
          const now = Date.now();
          for (const entry of entries) {
            nextProgress[entry.questionId] = {
              selectedIndex: entry.selectedIndex,
              isCorrect: entry.isCorrect,
              updatedAt: now,
            };
          }
          return {
            progress: nextProgress,
            syncRevision: state.syncRevision + 1,
          };
        }),

      resetProgress: () =>
        set((state) => ({
          progress: {},
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      setCachedExplanation: (questionId, explanation) =>
        set((state) => ({
          aiCache: {
            ...state.aiCache,
            [questionId]: explanation,
          },
          syncRevision: state.syncRevision + 1,
        })),

      clearAiCache: () =>
        set((state) => ({
          aiCache: {},
          settingsUpdatedAt: Date.now(),
          syncRevision: state.syncRevision + 1,
        })),

      setAuthUser: (authUser) =>
        set({
          authUser,
          syncStatus: 'idle',
          syncError: null,
        }),

      setSyncMeta: (syncStatus, syncError = null, syncedAt) =>
        set((state) => ({
          syncStatus,
          syncError,
          lastSyncedAt: syncedAt ?? state.lastSyncedAt,
        })),

      getLocalSyncPayload: () => {
        const s = get();
        return {
          selectedState: s.selectedState,
          theme: s.theme,
          apiKey: s.apiKey,
          aiModel: s.aiModel,
          translationLang: s.translationLang,
          alwaysShowTranslation: s.alwaysShowTranslation,
          settingsUpdatedAt: s.settingsUpdatedAt,
          progress: s.progress,
          aiCache: s.aiCache,
        };
      },

      mergeWithCloudPayload: (remote) => {
        const local = get();

        const mergedProgress: Record<string, QuestionProgress> = { ...remote.progress };
        for (const [qId, localEntry] of Object.entries(local.progress)) {
          const remoteEntry = mergedProgress[qId];
          if (!remoteEntry || (localEntry.updatedAt ?? 0) > (remoteEntry.updatedAt ?? 0)) {
            mergedProgress[qId] = localEntry;
          }
        }

        const mergedAiCache: Record<string, CachedExplanation> = { ...remote.aiCache };
        for (const [qId, localCache] of Object.entries(local.aiCache)) {
          const remoteCache = mergedAiCache[qId];
          if (!remoteCache || (localCache.createdAt ?? 0) > (remoteCache.createdAt ?? 0)) {
            mergedAiCache[qId] = localCache;
          }
        }

        const remoteNewer = (remote.settingsUpdatedAt ?? 0) >= (local.settingsUpdatedAt ?? 0);
        const mergedState: StateCode = remoteNewer ? remote.selectedState : local.selectedState;
        const mergedTheme: ThemeMode = remoteNewer ? remote.theme : local.theme;
        const mergedModel = remoteNewer ? remote.aiModel : local.aiModel;
        const mergedTranslationLang: TranslationLang = remoteNewer
          ? remote.translationLang
          : local.translationLang;
        const mergedAlwaysShow = remoteNewer
          ? remote.alwaysShowTranslation
          : local.alwaysShowTranslation;
        const mergedApiKey = remoteNewer
          ? remote.apiKey || local.apiKey
          : local.apiKey || remote.apiKey;
        const mergedSettingsUpdatedAt = Math.max(
          remote.settingsUpdatedAt ?? 0,
          local.settingsUpdatedAt ?? 0,
          Date.now()
        );

        applyThemeToDocument(mergedTheme);

        const mergedPayload: CloudSyncPayload = {
          selectedState: mergedState,
          theme: mergedTheme,
          apiKey: mergedApiKey,
          aiModel: mergedModel,
          translationLang: mergedTranslationLang,
          alwaysShowTranslation: mergedAlwaysShow,
          settingsUpdatedAt: mergedSettingsUpdatedAt,
          progress: mergedProgress,
          aiCache: mergedAiCache,
        };

        set({
          selectedState: mergedPayload.selectedState,
          theme: mergedPayload.theme,
          apiKey: mergedPayload.apiKey,
          aiModel: mergedPayload.aiModel,
          translationLang: mergedPayload.translationLang,
          alwaysShowTranslation: mergedPayload.alwaysShowTranslation,
          settingsUpdatedAt: mergedPayload.settingsUpdatedAt,
          progress: mergedPayload.progress,
          aiCache: mergedPayload.aiCache,
        });

        return mergedPayload;
      },

      applyRemoteRealtimeUpdate: (remote) => {
        const local = get();
        applyThemeToDocument(remote.theme);
        set({
          selectedState: remote.selectedState,
          theme: remote.theme,
          apiKey: remote.apiKey,
          aiModel: remote.aiModel,
          translationLang: remote.translationLang,
          alwaysShowTranslation: remote.alwaysShowTranslation,
          settingsUpdatedAt: Math.max(remote.settingsUpdatedAt ?? 0, local.settingsUpdatedAt ?? 0),
          progress: remote.progress ?? {},
          aiCache: remote.aiCache ?? {},
          syncStatus: 'synced',
          syncError: null,
          lastSyncedAt: Date.now(),
        });
      },
    }),
    {
      name: 'lid-de-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedState: state.selectedState,
        theme: state.theme,
        apiKey: state.apiKey,
        aiModel: state.aiModel,
        translationLang: state.translationLang,
        alwaysShowTranslation: state.alwaysShowTranslation,
        settingsUpdatedAt: state.settingsUpdatedAt,
        progress: state.progress,
        aiCache: state.aiCache,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDocument(state.theme);
        }
      },
    }
  )
);
