import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatListItem } from '@/components/ChatListItem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatWithDetails } from '@/hooks/useChats';

interface ArchivedChatsPageProps {
  onBack: () => void;
  userId: string;
  onChatSelect: (chat: ChatWithDetails) => void;
}

export function ArchivedChatsPage({ onBack, userId, onChatSelect }: ArchivedChatsPageProps) {
  const [archivedChats, setArchivedChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedChats();
  }, [userId]);

  const fetchArchivedChats = async () => {
    if (!userId) return;

    try {
      // Get archived chat IDs
      const { data: archived, error: archiveError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId)
        .eq('is_archived', true);

      if (archiveError) throw archiveError;

      if (!archived || archived.length === 0) {
        setArchivedChats([]);
        setLoading(false);
        return;
      }

      const chatIds = archived.map(a => a.chat_id);

      // Fetch chat details
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds);

      if (chatsError) throw chatsError;

      // Enrich with last message and other details
      const enrichedChats: ChatWithDetails[] = [];
      for (const chat of chats || []) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // For private chats, get other user's profile
        let name = chat.name;
        let avatarUrl = chat.avatar_url;

        if (chat.type === 'private') {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chat.id)
            .neq('user_id', userId);

          if (participants && participants[0]) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', participants[0].user_id)
              .single();

            if (profile) {
              name = profile.name;
              avatarUrl = profile.avatar_url;
            }
          }
        }

        enrichedChats.push({
          ...chat,
          name,
          avatar_url: avatarUrl,
          lastMessage: lastMsg || undefined,
          unreadCount: 0,
        });
      }

      setArchivedChats(enrichedChats);
    } catch (error) {
      console.error('Error fetching archived chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ is_archived: false })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Chat dipulihkan dari arsip');
      fetchArchivedChats();
    } catch (error) {
      toast.error('Gagal memulihkan chat');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-display font-bold">Chat Diarsipkan</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : archivedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Archive className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Tidak Ada Chat Diarsipkan</h2>
            <p className="text-muted-foreground">
              Chat yang diarsipkan akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {archivedChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <ChatListItem chat={chat} onClick={() => onChatSelect(chat)} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchive(chat.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
