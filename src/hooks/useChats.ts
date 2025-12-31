import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ChatType = Tables<'chats'>;
export type ChatParticipant = Tables<'chat_participants'>;
export type MessageType = Tables<'messages'>;

interface ChatWithDetails extends ChatType {
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
      
      const chatList: ChatWithDetails[] = [];
      
      for (const part of participations || []) {
        const chat = part.chats as ChatType;
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        // For private chats, get other participant's profile
        let chatName = chat.name;
        let chatAvatar = chat.avatar_url;
        
        if (chat.type === 'private') {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chat.id)
            .neq('user_id', userId);
          
          if (participants && participants.length > 0) {
            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', participants[0].user_id)
              .single();
            
            if (otherProfile) {
              chatName = otherProfile.name;
              chatAvatar = otherProfile.avatar_url;
            }
          }
        }
        
        chatList.push({
          ...chat,
          name: chatName,
          avatar_url: chatAvatar,
          lastMessage: lastMsg,
          unreadCount: part.unread_count || 0,
        });
      }
      
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
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('chats-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchChats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants' },
        () => fetchChats()
      )
      .subscribe();
    
    return () => {
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
          return { data: existingChat, error: null };
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
    
    fetchChats();
    return { data: chat, error: null };
  };

  const createGroupChat = async (name: string, participantIds: string[]) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({ 
        type: 'group', 
        name, 
        created_by: userId 
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
    
    fetchChats();
    return { data: chat, error: null };
  };

  return {
    chats,
    loading,
    fetchChats,
    createPrivateChat,
    createGroupChat,
  };
}
