import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, MessageSquarePlus } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatListItem } from '@/components/ChatListItem';
import { FloatingMenu } from '@/components/FloatingMenu';
import { Chat } from '@/types';

interface ChatDashboardProps {
  onChatSelect: (chat: Chat) => void;
  onAddContact: () => void;
  onAddGroup: () => void;
  onAddChannel: () => void;
  onSettings: () => void;
}

// Demo chats for display
const demoChats: Chat[] = [
  {
    id: '1',
    type: 'private',
    participants: ['user1', 'user2'],
    name: 'John Doe',
    avatar: undefined,
    lastMessage: {
      id: 'm1',
      chatId: '1',
      senderId: 'user2',
      content: 'Hey! How are you doing?',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: 'read',
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'group',
    participants: ['user1', 'user2', 'user3'],
    name: 'Project Team',
    avatar: undefined,
    lastMessage: {
      id: 'm2',
      chatId: '2',
      senderId: 'user3',
      content: 'Meeting at 3 PM today',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'delivered',
    },
    unreadCount: 3,
    isPinned: true,
    isArchived: false,
    isMuted: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'channel',
    participants: [],
    name: 'ZursApp Official',
    avatar: undefined,
    lastMessage: {
      id: 'm3',
      chatId: '3',
      senderId: 'admin',
      content: 'Welcome to ZursApp! 🎉',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'read',
    },
    unreadCount: 1,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    createdAt: new Date(),
  },
];

export function ChatDashboard({
  onChatSelect,
  onAddContact,
  onAddGroup,
  onAddChannel,
  onSettings,
}: ChatDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chats] = useState<Chat[]>(demoChats);

  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Logo size="md" showText />
          <Button variant="ghost" size="icon" onClick={onSettings}>
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="glow"
              className="pl-12"
            />
          </div>
        </div>
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
              >
                <ChatListItem
                  chat={chat}
                  onClick={() => onChatSelect(chat)}
                />
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
              No Chats Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start a new conversation by adding a contact
            </p>
            <Button
              variant="primary"
              onClick={onAddContact}
            >
              Add Contact
            </Button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isMenuOpen && (
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
    </div>
  );
}
