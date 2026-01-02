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
      
      // Mark messages as read and update status to 'read' for sender
      if (userId) {
        await supabase
          .from('chat_participants')
          .update({ unread_count: 0 })
          .eq('chat_id', chatId)
          .eq('user_id', userId);
        
        // Update message status to 'read' for messages from other users
        const unreadMessageIds = messagesWithProfiles
          .filter(m => m.sender_id !== userId && m.status !== 'read')
          .map(m => m.id);
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ status: 'read' })
            .in('id', unreadMessageIds);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, userId]);

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
          filter: `chat_id=eq.${chatId}`
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => fetchMessages()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages]);

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
    
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
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
