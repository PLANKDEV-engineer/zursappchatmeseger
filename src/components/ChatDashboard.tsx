import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MoreVertical, MessageSquarePlus, Check, Trash2, X, CheckCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatListItem } from '@/components/ChatListItem';
import { FloatingMenu } from '@/components/FloatingMenu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatWithDetails } from '@/hooks/useChats';

interface ChatDashboardProps {
  chats: ChatWithDetails[];
  onChatSelect: (chat: ChatWithDetails) => void;
  onAddContact: () => void;
  onAddGroup: () => void;
  onAddChannel: () => void;
  onSettings: () => void;
  userId?: string;
  onRefresh?: () => void;
}

export function ChatDashboard({
  chats,
  onChatSelect,
  onAddContact,
  onAddGroup,
  onAddChannel,
  onSettings,
  userId,
  onRefresh,
}: ChatDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Only private chats can be selected (not groups)
  const selectableChats = filteredChats.filter(chat => chat.type === 'private');

  const handleLongPress = (chatId: string, chatType: string) => {
    if (chatType !== 'private') return; // Only allow selecting private chats
    setIsSelectMode(true);
    setSelectedChats(new Set([chatId]));
  };

  const handleSelectChat = (chatId: string, chatType: string) => {
    if (!isSelectMode) return;
    if (chatType !== 'private') return; // Only allow selecting private chats
    
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const handleSelectAll = () => {
    const allPrivateChatIds = selectableChats.map(c => c.id);
    setSelectedChats(new Set(allPrivateChatIds));
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedChats(new Set());
  };

  const handleDeleteSelected = async () => {
    if (!userId || selectedChats.size === 0) return;

    try {
      // For each selected chat, we delete the user's participation
      for (const chatId of selectedChats) {
        // Delete user's messages in the chat (mark as deleted for the user)
        await supabase
          .from('messages')
          .update({ is_deleted: true })
          .eq('chat_id', chatId)
          .eq('sender_id', userId);

        // Remove user from chat participants (leaves the chat)
        await supabase
          .from('chat_participants')
          .delete()
          .eq('chat_id', chatId)
          .eq('user_id', userId);
      }

      toast.success(`${selectedChats.size} chat dihapus`);
      setShowDeleteConfirm(false);
      handleCancelSelect();
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting chats:', err);
      toast.error('Gagal menghapus chat');
    }
  };

  const handleChatClick = (chat: ChatWithDetails) => {
    if (isSelectMode) {
      handleSelectChat(chat.id, chat.type);
    } else {
      onChatSelect(chat);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          {isSelectMode ? (
            <>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" onClick={handleCancelSelect}>
                  <X className="w-5 h-5" />
                </Button>
                <span className="font-medium">{selectedChats.size} dipilih</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Logo size="md" showText />
              <Button variant="ghost" size="icon" onClick={onSettings}>
                <MoreVertical className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Search */}
        {!isSelectMode && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>
        )}
      </header>

      {/* Chat List */}
      <main className="flex-1 overflow-y-auto pb-32">
        {filteredChats.length > 0 ? (
          <div className="divide-y divide-border/30">
            {filteredChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleLongPress(chat.id, chat.type);
                }}
              >
                {isSelectMode && chat.type === 'private' && (
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectChat(chat.id, chat.type);
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedChats.has(chat.id) 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedChats.has(chat.id) && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                )}
                <div className={isSelectMode && chat.type === 'private' ? 'pl-12' : ''}>
                  <ChatListItem
                    chat={chat}
                    onClick={() => handleChatClick(chat)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6"
            >
              <MessageSquarePlus className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              Belum Ada Chat
            </h2>
            <p className="text-muted-foreground mb-6">
              Mulai percakapan dengan menambahkan kontak
            </p>
            <Button
              variant="default"
              onClick={onAddContact}
            >
              Tambah Kontak
            </Button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isMenuOpen && !isSelectMode && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(true)}
          className="fab"
        >
          <MessageSquarePlus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Floating Menu */}
      <FloatingMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onAddContact={onAddContact}
        onAddGroup={onAddGroup}
        onAddChannel={onAddChannel}
      />

      {/* Delete Options Menu */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border p-4"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
              
              <div className="space-y-2">
                <button
                  onClick={handleSelectAll}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
                >
                  <CheckCheck className="w-5 h-5 text-primary" />
                  <span className="font-medium">Pilih Semua</span>
                </button>

                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    // Show final confirmation dialog
                    if (confirm(`Yakin ingin menghapus ${selectedChats.size} chat? Riwayat pesan akan dihapus untuk Anda.`)) {
                      handleDeleteSelected();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Hapus ({selectedChats.size})</span>
                </button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full mt-4"
              >
                Batal
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}