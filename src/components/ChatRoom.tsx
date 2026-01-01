import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Image,
  FileText,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useMessages } from '@/hooks/useMessages';
import type { ChatWithDetails } from '@/hooks/useChats';

interface ChatRoomProps {
  chat: ChatWithDetails;
  userId: string;
  onBack: () => void;
  onCall: () => void;
  onVideoCall: () => void;
  onInfo: () => void;
}

export function ChatRoom({
  chat,
  userId,
  onBack,
  onCall,
  onVideoCall,
  onInfo,
}: ChatRoomProps) {
  const { messages, loading, sendMessage } = useMessages(chat.id, userId);
  const [inputValue, setInputValue] = useState('');
  const [showAttachment, setShowAttachment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const attachmentOptions = [
    { icon: Image, label: 'Photo', color: 'text-green-400' },
    { icon: Camera, label: 'Camera', color: 'text-blue-400' },
    { icon: FileText, label: 'Document', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <button onClick={onInfo} className="flex items-center gap-3 flex-1">
            <Avatar
              src={chat.avatar_url || undefined}
              name={chat.name || undefined}
              size="sm"
              showStatus={chat.type === 'private'}
            />
            <div className="text-left">
              <h2 className="font-display font-semibold text-foreground">
                {chat.name}
              </h2>
              <p className="text-xs text-primary">Online</p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onVideoCall}>
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onCall}>
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onInfo}>
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 tech-grid">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Mulai percakapan...
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.sender_id === userId;
            const showAvatar =
              index === 0 ||
              messages[index - 1].sender_id !== message.sender_id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && showAvatar && (
                  <Avatar
                    src={message.senderProfile?.avatar_url || undefined}
                    name={message.senderProfile?.name}
                    size="xs"
                    showStatus={false}
                  />
                )}
                {!isMe && !showAvatar && <div className="w-8" />}

                <div
                  className={`max-w-[75%] ${
                    isMe ? 'message-sent' : 'message-received'
                  } px-4 py-2`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Attachment Menu */}
      <AnimatePresence>
        {showAttachment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 p-4 rounded-xl bg-card border border-border shadow-xl"
          >
            <div className="flex justify-around">
              {attachmentOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setShowAttachment(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-card-hover transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <option.icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <span className="text-xs text-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <footer className="sticky bottom-0 bg-background-secondary/95 backdrop-blur-xl border-t border-border/50 p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachment(!showAttachment)}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full h-11 px-4 pr-12 rounded-full bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          </div>

          {inputValue.trim() ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Button
                variant="default"
                size="icon"
                onClick={handleSend}
                className="rounded-full"
              >
                <Send className="w-5 h-5" />
              </Button>
            </motion.div>
          ) : (
            <Button variant="ghost" size="icon">
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
