import { useCallback, useEffect, useRef } from 'react';
import {
  fetchCloudSyncData,
  getSupabaseClient,
  isSupabaseConfigured,
  pushCloudSyncData,
  subscribeToCloudSync,
} from '../services/supabase';
import { useAppStore } from '../store/useAppStore';

export function useCloudSync(configVersion: number) {
  const authUser = useAppStore((s) => s.authUser);
  const syncRevision = useAppStore((s) => s.syncRevision);
  const setAuthUser = useAppStore((s) => s.setAuthUser);
  const setSyncMeta = useAppStore((s) => s.setSyncMeta);
  const getLocalSyncPayload = useAppStore((s) => s.getLocalSyncPayload);
  const mergeWithCloudPayload = useAppStore((s) => s.mergeWithCloudPayload);
  const applyRemoteRealtimeUpdate = useAppStore((s) => s.applyRemoteRealtimeUpdate);

  const ignoreRealtimeUntilRef = useRef<number>(0);
  const initialSyncDoneForUserRef = useRef<string | null>(null);

  const syncNow = useCallback(async () => {
    const currentUser = useAppStore.getState().authUser;
    if (!currentUser || !isSupabaseConfigured()) return;

    setSyncMeta('syncing', null);
    try {
      const remote = await fetchCloudSyncData(currentUser.id);
      if (remote) {
        const merged = mergeWithCloudPayload(remote);
        ignoreRealtimeUntilRef.current = Date.now() + 2500;
        await pushCloudSyncData(currentUser.id, merged);
      } else {
        const localPayload = getLocalSyncPayload();
        ignoreRealtimeUntilRef.current = Date.now() + 2500;
        await pushCloudSyncData(currentUser.id, localPayload);
      }
      setSyncMeta('synced', null, Date.now());
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Synchronisierung fehlgeschlagen.';
      setSyncMeta('error', msg);
    }
  }, [getLocalSyncPayload, mergeWithCloudPayload, setSyncMeta]);

  // Listen for Supabase Auth session & state changes
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthUser(null);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user;
      setAuthUser(u ? { id: u.id, email: u.email ?? '' } : null);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user;
      if (u) {
        setAuthUser({ id: u.id, email: u.email ?? '' });
      } else {
        initialSyncDoneForUserRef.current = null;
        setAuthUser(null);
        setSyncMeta('idle', null);
      }
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, [configVersion, setAuthUser, setSyncMeta]);

  // Initial merge + Realtime subscription + Focus/Online sync when logged in
  useEffect(() => {
    if (!authUser || !isSupabaseConfigured()) return;

    if (initialSyncDoneForUserRef.current !== authUser.id) {
      initialSyncDoneForUserRef.current = authUser.id;
      void syncNow();
    }

    const unsubscribeRealtime = subscribeToCloudSync(authUser.id, (remotePayload) => {
      if (Date.now() < ignoreRealtimeUntilRef.current) {
        return;
      }
      applyRemoteRealtimeUpdate(remotePayload);
    });

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void syncNow();
      }
    };

    window.addEventListener('focus', handleVisibilityOrOnline);
    window.addEventListener('online', handleVisibilityOrOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrOnline);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener('focus', handleVisibilityOrOnline);
      window.removeEventListener('online', handleVisibilityOrOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
    };
  }, [authUser, configVersion, applyRemoteRealtimeUpdate, syncNow]);

  // Debounced push whenever local personal data mutates while signed in
  useEffect(() => {
    if (!authUser || syncRevision === 0 || !isSupabaseConfigured()) return;

    const timer = window.setTimeout(async () => {
      setSyncMeta('syncing', null);
      try {
        const payload = getLocalSyncPayload();
        ignoreRealtimeUntilRef.current = Date.now() + 2500;
        await pushCloudSyncData(authUser.id, payload);
        setSyncMeta('synced', null, Date.now());
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Speichern in der Cloud fehlgeschlagen.';
        setSyncMeta('error', msg);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [authUser, syncRevision, getLocalSyncPayload, setSyncMeta]);

  return { syncNow };
}
