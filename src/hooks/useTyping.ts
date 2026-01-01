import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  user_id: string;
  name?: string;
}

export function useTyping(chatId: string | undefined, userId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!chatId || !userId) return;

    // Upsert typing status
    await supabase
      .from('typing_status')
      .upsert(
        {
          chat_id: chatId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'chat_id,user_id' }
      );

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, [chatId, userId]);

  useEffect(() => {
    if (!chatId || !userId) return;

    // Fetch initial typing status
    const fetchTyping = async () => {
      const { data } = await supabase
        .from('typing_status')
        .select('user_id')
        .eq('chat_id', chatId)
        .eq('is_typing', true)
        .neq('user_id', userId);

      if (data) {
        // Fetch names for typing users
        const usersWithNames: TypingUser[] = [];
        for (const item of data) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', item.user_id)
            .single();
          usersWithNames.push({
            user_id: item.user_id,
            name: profile?.name,
          });
        }
        setTypingUsers(usersWithNames);
      }
    };

    fetchTyping();

    // Subscribe to typing updates
    const channel = supabase
      .channel(`typing-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          if (payload.new && (payload.new as any).user_id !== userId) {
            const typingData = payload.new as any;
            if (typingData.is_typing) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('user_id', typingData.user_id)
                .single();
              
              setTypingUsers(prev => {
                const existing = prev.find(u => u.user_id === typingData.user_id);
                if (existing) return prev;
                return [...prev, { user_id: typingData.user_id, name: profile?.name }];
              });
            } else {
              setTypingUsers(prev => prev.filter(u => u.user_id !== typingData.user_id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(false);
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, setTyping]);

  return {
    typingUsers,
    setTyping,
    isTyping: typingUsers.length > 0,
  };
}
