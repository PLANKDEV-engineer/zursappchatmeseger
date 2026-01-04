import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import type { ChatWithDetails } from '@/hooks/useChats';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface ChatListItemProps {
  chat: ChatWithDetails;
  onClick: () => void;
}

export function ChatListItem({ chat, onClick }: ChatListItemProps) {
  const { user } = useAuth();
  const lastMessageTime = chat.lastMessage?.created_at
    ? formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: false })
    : '';

  // Only show checkmarks for messages sent by current user
  const isOwnMessage = chat.lastMessage?.sender_id === user?.id;

  const getStatusIcon = () => {
    if (!chat.lastMessage || !isOwnMessage) return null;
    
    switch (chat.lastMessage.status) {
      case 'sent':
        return <Check className="w-4 h-4 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-card-hover transition-all duration-300 group"
    >
      <Avatar
        src={chat.avatar_url || undefined}
        name={chat.name || undefined}
        size="md"
        showStatus={chat.type === 'private'}
      />

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-semibold text-foreground truncate">
            {chat.name || 'Unknown'}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {lastMessageTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {getStatusIcon()}
            <p className="text-sm text-muted-foreground truncate">
              {chat.lastMessage?.content || 'Start a conversation'}
            </p>
          </div>
          
          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}