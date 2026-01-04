import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface StarredMessage {
  id: string;
  content: string | null;
  type: string | null;
  media_url: string | null;
  created_at: string;
  chat_id: string;
  sender_id: string | null;
  senderProfile?: {
    name: string;
    avatar_url: string | null;
  };
  chatName?: string;
}

interface StarredMessagesPageProps {
  onBack: () => void;
  userId: string;
}

export function StarredMessagesPage({ onBack, userId }: StarredMessagesPageProps) {
  const [messages, setMessages] = useState<StarredMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStarredMessages();
  }, [userId]);

  const fetchStarredMessages = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .contains('starred_by', [userId])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with profiles and chat names
      const enriched: StarredMessage[] = [];
      for (const msg of data || []) {
        let senderProfile;
        if (msg.sender_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();
          senderProfile = profile || undefined;
        }

        const { data: chat } = await supabase
          .from('chats')
          .select('name, type')
          .eq('id', msg.chat_id)
          .single();

        enriched.push({
          ...msg,
          senderProfile,
          chatName: chat?.name || 'Chat',
        });
      }

      setMessages(enriched);
    } catch (error) {
      console.error('Error fetching starred messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstar = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const { data: currentMsg } = await supabase
        .from('messages')
        .select('starred_by')
        .eq('id', messageId)
        .single();

      const currentStarred = (currentMsg?.starred_by as string[]) || [];
      const newStarred = currentStarred.filter(id => id !== userId);

      const { error } = await supabase
        .from('messages')
        .update({ starred_by: newStarred })
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Pesan dihapus dari bintang');
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      toast.error('Gagal menghapus bintang');
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
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h1 className="text-xl font-display font-bold">Pesan Berbintang</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Star className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Tidak Ada Pesan Berbintang</h2>
            <p className="text-muted-foreground">
              Tahan pesan untuk menandai dengan bintang
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={message.senderProfile?.avatar_url || undefined}
                      name={message.senderProfile?.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{message.senderProfile?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{message.chatName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleUnstar(message.id)}
                  >
                    <StarOff className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-muted">
                  {message.type === 'image' && message.media_url ? (
                    <img 
                      src={message.media_url} 
                      alt="Media" 
                      className="max-w-[200px] rounded-lg mb-2"
                    />
                  ) : message.type === 'video' && message.media_url ? (
                    <video 
                      src={message.media_url} 
                      className="max-w-[200px] rounded-lg mb-2"
                      controls
                    />
                  ) : null}
                  <p className="text-sm">{message.content || 'Media'}</p>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: id })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
