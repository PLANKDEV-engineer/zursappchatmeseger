import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Forward, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';

interface Chat {
  id: string;
  name: string | null;
  avatar_url: string | null;
  type: string;
}

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (chatIds: string[]) => void;
  messageContent: string;
  userId: string;
}

export function ForwardModal({
  isOpen,
  onClose,
  onForward,
  messageContent,
  userId,
}: ForwardModalProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchChats();
    }
  }, [isOpen, userId]);

  const fetchChats = async () => {
    try {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      if (!participants) return;

      const chatIds = participants.map((p) => p.chat_id);

      const { data: chatsData } = await supabase
        .from('chats')
        .select('id, name, avatar_url, type')
        .in('id', chatIds);

      // For private chats, get the other participant's name
      const chatsWithNames: Chat[] = [];
      for (const chat of chatsData || []) {
        if (chat.type === 'private') {
          const { data: otherParticipant } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chat.id)
            .neq('user_id', userId)
            .single();

          if (otherParticipant) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', otherParticipant.user_id)
              .single();

            chatsWithNames.push({
              ...chat,
              name: profile?.name || 'Unknown',
              avatar_url: profile?.avatar_url,
            });
          }
        } else {
          chatsWithNames.push(chat);
        }
      }

      setChats(chatsWithNames);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = (chatId: string) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length > 0) {
      onForward(selectedChats);
      setSelectedChats([]);
      onClose();
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Forward className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-bold">Teruskan Pesan</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Message Preview */}
            <div className="p-4 border-b border-border">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {messageContent}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari chat..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada chat ditemukan
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => toggleChat(chat.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors ${
                      selectedChats.includes(chat.id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar
                      src={chat.avatar_url || undefined}
                      name={chat.name || undefined}
                      size="sm"
                    />
                    <span className="flex-1 text-left font-medium">{chat.name}</span>
                    {selectedChats.includes(chat.id) && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleForward}
                disabled={selectedChats.length === 0}
                className="flex-1"
              >
                Teruskan ({selectedChats.length})
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
