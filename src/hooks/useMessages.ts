import { isActuallyOnline } from '@/lib/presence';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type MessageType = Tables<'messages'>;
export type ReactionType = Tables<'message_reactions'>;

interface MessageWithReactions extends MessageType {
  reactions?: ReactionType[];
  senderProfile?: { name: string; avatar_url: string | null };
}

export function useMessages(chatId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<MessageWithReactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherParticipantIds, setOtherParticipantIds] = useState<string[]>([]);

  const fetchOtherParticipants = useCallback(async () => {
    if (!chatId || !userId) return;

    const { data, error } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .neq('user_id', userId);

    if (!error) {
      setOtherParticipantIds((data || []).map((p) => p.user_id));
    }
  }, [chatId, userId]);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_reactions (*)
        `)
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const messagesWithProfiles: MessageWithReactions[] = [];
      const profileCache: Record<string, { name: string; avatar_url: string | null }> = {};

      for (const msg of data || []) {
        if (msg.sender_id && !profileCache[msg.sender_id]) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();

          if (profile) {
            profileCache[msg.sender_id] = profile;
          }
        }

        messagesWithProfiles.push({
          ...msg,
          reactions: msg.message_reactions || [],
          senderProfile: msg.sender_id ? profileCache[msg.sender_id] : undefined,
        });
      }

      setMessages(messagesWithProfiles);

      if (userId) {
        // Reset unread count
        await supabase
          .from('chat_participants')
          .update({ unread_count: 0 })
          .eq('chat_id', chatId)
          .eq('user_id', userId);

        // When we are online and have received messages, consider them "delivered" first.
        const receivedSentIds = messagesWithProfiles
          .filter((m) => m.sender_id !== userId && m.status === 'sent')
          .map((m) => m.id);

        if (receivedSentIds.length > 0) {
          await supabase.from('messages').update({ status: 'delivered' }).in('id', receivedSentIds);
        }

        // Mark as read when we open the room
        const unreadMessageIds = messagesWithProfiles
          .filter((m) => m.sender_id !== userId && m.status !== 'read')
          .map((m) => m.id);

        if (unreadMessageIds.length > 0) {
          await supabase.from('messages').update({ status: 'read' }).in('id', unreadMessageIds);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, userId]);

  useEffect(() => {
    fetchOtherParticipants();
  }, [fetchOtherParticipants]);

  useEffect(() => {
    fetchMessages();

    if (!chatId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages]);

  // Delivery upgrade: when the other participant becomes online, upgrade our "sent" -> "delivered".
  // (Only meaningful for private chats; for groups we keep it simple.)
  useEffect(() => {
    if (!chatId || !userId) return;
    const otherId = otherParticipantIds.length === 1 ? otherParticipantIds[0] : null;
    if (!otherId) return;

    const channel = supabase
      .channel(`delivery-${chatId}-${otherId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${otherId}`,
        },
        async (payload) => {
          if (payload?.new?.is_online) {
            await supabase
              .from('messages')
              .update({ status: 'delivered' })
              .eq('chat_id', chatId)
              .eq('sender_id', userId)
              .eq('status', 'sent');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, otherParticipantIds, userId]);

  const sendMessage = async (
    content: string,
    type: 'text' | 'image' | 'video' | 'voice' | 'file' | 'poll' = 'text',
    mediaUrl?: string,
    replyToId?: string
  ) => {
    if (!chatId || !userId) return { error: new Error('Missing required data') };

    const message: TablesInsert<'messages'> = {
      chat_id: chatId,
      sender_id: userId,
      content,
      type,
      media_url: mediaUrl,
      reply_to_id: replyToId,
      status: 'sent',
    };

    const { data, error } = await supabase.from('messages').insert(message).select().single();

    // If this is a private chat and the other participant is currently online, upgrade to delivered.
    if (data && !error && otherParticipantIds.length === 1) {
      const otherId = otherParticipantIds[0];
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('is_online, last_seen')
        .eq('user_id', otherId)
        .single();

      if (isActuallyOnline(otherProfile)) {
        await supabase.from('messages').update({ status: 'delivered' }).eq('id', data.id);
      }
    }

    return { data, error };
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean = false) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const update = forEveryone 
      ? { is_deleted: true, deleted_for_everyone: true }
      : { is_deleted: true };
    
    const { error } = await supabase
      .from('messages')
      .update(update)
      .eq('id', messageId)
      .eq('sender_id', userId);
    
    if (!error) {
      fetchMessages();
    }
    
    return { error };
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    // Check if already reacted with same emoji
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();
    
    if (existing) {
      // Remove reaction
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
      
      return { error };
    }
    
    // Add reaction
    const { error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji });
    
    if (!error) {
      fetchMessages();
    }
    
    return { error };
  };

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    addReaction,
    refreshMessages: fetchMessages,
  };
}
