import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Update own online status
  const setOnline = useCallback(async (isOnline: boolean) => {
    if (!userId) return;
    
    await supabase
      .from('profiles')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Set online when component mounts
    setOnline(true);

    // Subscribe to presence changes
    const channel = supabase
      .channel('online-users')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'is_online=eq.true'
        },
        (payload) => {
          if (payload.new.is_online) {
            setOnlineUsers(prev => new Set(prev).add(payload.new.user_id));
          } else {
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(payload.new.user_id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    // Set offline when window closes
    const handleBeforeUnload = () => {
      setOnline(false);
    };

    // Set offline when visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOnline(false);
      } else {
        setOnline(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      setOnline(false);
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, setOnline]);

  const isUserOnline = useCallback((checkUserId: string) => {
    return onlineUsers.has(checkUserId);
  }, [onlineUsers]);

  return {
    setOnline,
    isUserOnline,
    onlineUsers,
  };
}
