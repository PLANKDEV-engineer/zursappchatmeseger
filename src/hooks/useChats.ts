import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ChatType = Tables<'chats'>;
export type ChatParticipant = Tables<'chat_participants'>;
export type MessageType = Tables<'messages'>;

export interface ChatWithDetails extends ChatType {
  lastMessage?: MessageType | null;
  unreadCount: number;
  participants?: { user_id: string; name: string; avatar_url: string | null }[];
}

export function useChats(userId: string | undefined) {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Get chat participations for current user
      const { data: participations, error: partError } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          is_pinned,
          is_archived,
          is_muted,
          unread_count,
          chats (*)
        `)
        .eq('user_id', userId)
        .eq('is_archived', false);
      
      if (partError) throw partError;
      if (!participations || participations.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const chatIds = participations.map(p => (p.chats as ChatType).id);
      
      // Batch: get last message per chat using a single query
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      // Build last message map (first occurrence per chat_id)
      const lastMessageMap: Record<string, MessageType> = {};
      for (const msg of allMessages || []) {
        if (!lastMessageMap[msg.chat_id]) {
          lastMessageMap[msg.chat_id] = msg;
        }
      }

      // For private chats, batch fetch other participants
      const privateChatIds = participations
        .filter(p => (p.chats as ChatType).type === 'private')
        .map(p => (p.chats as ChatType).id);

      let otherProfilesMap: Record<string, { name: string; avatar_url: string | null }> = {};

      if (privateChatIds.length > 0) {
        const { data: otherParticipants } = await supabase
          .from('chat_participants')
          .select('chat_id, user_id')
          .in('chat_id', privateChatIds)
          .neq('user_id', userId);

        if (otherParticipants && otherParticipants.length > 0) {
          const otherUserIds = [...new Set(otherParticipants.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_url')
            .in('user_id', otherUserIds);

          const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
          for (const p of profiles || []) {
            profileMap[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
          }

          for (const op of otherParticipants) {
            if (profileMap[op.user_id]) {
              otherProfilesMap[op.chat_id] = profileMap[op.user_id];
            }
          }
        }
      }
      
      const chatList: ChatWithDetails[] = participations.map(part => {
        const chat = part.chats as ChatType;
        let chatName = chat.name;
        let chatAvatar = chat.avatar_url;

        if (chat.type === 'private' && otherProfilesMap[chat.id]) {
          chatName = otherProfilesMap[chat.id].name;
          chatAvatar = otherProfilesMap[chat.id].avatar_url;
        }

        return {
          ...chat,
          name: chatName,
          avatar_url: chatAvatar,
          lastMessage: lastMessageMap[chat.id] || null,
          unreadCount: part.unread_count || 0,
        };
      });
      
      // Sort by last message time
      chatList.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      
      setChats(chatList);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChats();
    
    // Debounce realtime updates to avoid excessive re-fetching
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchChats(), 500);
    };

    // Subscribe to realtime updates
    const channel = supabase
      .channel('chats-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants' },
        debouncedFetch
      )
      .subscribe();
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  const createPrivateChat = async (otherUserId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    // Check if chat already exists
    const { data: existingParts } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);
    
    for (const part of existingParts || []) {
      const { data: otherPart } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('chat_id', part.chat_id)
        .eq('user_id', otherUserId)
        .single();
      
      if (otherPart) {
        const { data: existingChat } = await supabase
          .from('chats')
          .select('*')
          .eq('id', part.chat_id)
          .eq('type', 'private')
          .single();
        
        if (existingChat) {
          // Return as ChatWithDetails
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', otherUserId)
            .single();
          
          const chatWithDetails: ChatWithDetails = {
            ...existingChat,
            name: otherProfile?.name || existingChat.name,
            avatar_url: otherProfile?.avatar_url || existingChat.avatar_url,
            lastMessage: null,
            unreadCount: 0,
          };
          
          return { data: chatWithDetails, error: null };
        }
      }
    }
    
    // Create new chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({ type: 'private', created_by: userId })
      .select()
      .single();
    
    if (chatError) return { data: null, error: chatError };
    
    // Add participants
    const participants: TablesInsert<'chat_participants'>[] = [
      { chat_id: chat.id, user_id: userId },
      { chat_id: chat.id, user_id: otherUserId },
    ];
    
    const { error: partError } = await supabase
      .from('chat_participants')
      .insert(participants);
    
    if (partError) return { data: null, error: partError };
    
    // Get other user profile for name/avatar
    const { data: otherProfile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', otherUserId)
      .single();
    
    const chatWithDetails: ChatWithDetails = {
      ...chat,
      name: otherProfile?.name || chat.name,
      avatar_url: otherProfile?.avatar_url || chat.avatar_url,
      lastMessage: null,
      unreadCount: 0,
    };
    
    fetchChats();
    return { data: chatWithDetails, error: null };
  };

  const createGroupChat = async (name: string, participantIds: string[], isChannel = false) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({ 
        type: isChannel ? 'channel' : 'group', 
        name, 
        created_by: userId,
        only_admins_can_send: isChannel,
      })
      .select()
      .single();
    
    if (chatError) return { data: null, error: chatError };
    
    // Add creator as owner
    const participants: TablesInsert<'chat_participants'>[] = [
      { chat_id: chat.id, user_id: userId, is_owner: true, is_admin: true },
      ...participantIds.map(id => ({ chat_id: chat.id, user_id: id })),
    ];
    
    const { error: partError } = await supabase
      .from('chat_participants')
      .insert(participants);
    
    if (partError) return { data: null, error: partError };
    
    const chatWithDetails: ChatWithDetails = {
      ...chat,
      lastMessage: null,
      unreadCount: 0,
    };
    
    fetchChats();
    return { data: chatWithDetails, error: null };
  };

  return {
    chats,
    loading,
    fetchChats,
    createPrivateChat,
    createGroupChat,
  };
}
