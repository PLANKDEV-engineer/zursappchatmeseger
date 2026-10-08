import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_MS = 30_000;

/**
 * Honest presence: the user is "online" only while the app is open and visible.
 * A heartbeat refreshes last_seen every 30s; viewers treat stale heartbeats as offline
 * (see isActuallyOnline), so a killed app / lost connection shows offline automatically.
 */
export function usePresence(userId: string | undefined) {
  const setOnline = useCallback(async (isOnline: boolean) => {
    if (!userId) return;
    await supabase
      .from('profiles')
      .update({ is_online: isOnline, last_seen: new Date().toISOString() })
      .eq('user_id', userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      setOnline(true);
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine) setOnline(true);
      }, HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
      setOnline(false);
    };

    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', stop);
    window.addEventListener('offline', stop);
    window.addEventListener('online', start);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', stop);
      window.removeEventListener('offline', stop);
      window.removeEventListener('online', start);
      stop();
    };
  }, [userId, setOnline]);

  return { setOnline };
}
