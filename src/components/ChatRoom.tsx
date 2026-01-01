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
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useMessages } from '@/hooks/useMessages';
import { useTyping } from '@/hooks/useTyping';
import { MediaUpload } from '@/components/MediaUpload';
import { PollCreator } from '@/components/PollCreator';
import { MessageMenu, ReactionPicker } from '@/components/ChatOptionsMenu';
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
  const { messages, loading, sendMessage, deleteMessage, addReaction } = useMessages(chat.id, userId);
  const { typingUsers, setTyping } = useTyping(chat.id, userId);
  const [inputValue, setInputValue] = useState('');
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setTyping(true);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    await sendMessage(inputValue.trim(), 'text', undefined, replyTo?.id);
    setInputValue('');
    setReplyTo(null);
    setTyping(false);
  };

  const handleMediaSend = async (type: string, content: string, mediaUrl?: string) => {
    await sendMessage(content, type as any, mediaUrl);
  };

  const handlePollCreate = async (question: string, options: string[]) => {
    const pollData = JSON.stringify({ question, options, votes: options.map(() => 0) });
    await sendMessage(pollData, 'poll');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSeen = (date: string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return `${minutes}m lalu`;
    return `${Math.floor(minutes / 60)}j lalu`;
  };

  const isOfficial = chat.is_official;
  const canSendMessage = !chat.only_admins_can_send || chat.participantProfile?.is_admin;

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
              <div className="flex items-center gap-1">
                <h2 className="font-display font-semibold text-foreground">
                  {chat.name}
                </h2>
                {isOfficial && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-primary">
                {typingUsers.length > 0 
                  ? `${typingUsers[0]?.name || 'Seseorang'} sedang mengetik...`
                  : chat.type === 'private' 
                    ? 'Online' 
                    : `${chat.type === 'channel' ? 'Saluran' : 'Grup'}`
                }
              </p>
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
          messages.map((message) => {
            const isMe = message.sender_id === userId;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar
                    src={message.senderProfile?.avatar_url || undefined}
                    name={message.senderProfile?.name}
                    size="xs"
                    showStatus={false}
                  />
                )}

                <div
                  className={`max-w-[75%] ${isMe ? 'message-sent' : 'message-received'} px-4 py-2 relative`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedMessage(message.id);
                  }}
                  onClick={() => setSelectedMessage(message.id)}
                >
                  {!isMe && chat.type !== 'private' && (
                    <p className="text-xs font-medium text-primary mb-1">
                      {message.senderProfile?.name}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] opacity-70">
                      {formatTime(message.created_at)}
                    </span>
                  </div>

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
                        <span key={emoji} className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                          {emoji} {message.reactions?.filter(r => r.emoji === emoji).length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {typingUsers.length > 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-card border-t border-border flex items-center gap-2">
          <div className="flex-1 p-2 bg-muted rounded-lg">
            <p className="text-xs text-primary">Membalas</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-2">×</button>
        </div>
      )}

      {/* Input Bar */}
      {canSendMessage ? (
        <footer className="sticky bottom-0 bg-background-secondary/95 backdrop-blur-xl border-t border-border/50 p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowMediaUpload(true)}>
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowPollCreator(true)}>
              <BarChart3 className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ketik pesan..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full h-11 px-4 pr-12 rounded-full bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            </div>

            {inputValue.trim() ? (
              <Button variant="default" size="icon" onClick={handleSend} className="rounded-full">
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon">
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
        </footer>
      ) : (
        <footer className="p-4 bg-muted text-center">
          <p className="text-muted-foreground text-sm">Hanya admin yang dapat mengirim pesan</p>
        </footer>
      )}

      {/* Media Upload Modal */}
      <MediaUpload
        isOpen={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
        onSend={handleMediaSend}
        chatId={chat.id}
        userId={userId}
      />

      {/* Poll Creator Modal */}
      <PollCreator
        isOpen={showPollCreator}
        onClose={() => setShowPollCreator(false)}
        onCreatePoll={handlePollCreate}
      />

      {/* Message Menu */}
      <MessageMenu
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onReply={() => {
          const msg = messages.find(m => m.id === selectedMessage);
          if (msg) setReplyTo({ id: msg.id, content: msg.content || '' });
        }}
        onReact={() => setShowReactions(selectedMessage)}
        onCopy={() => {
          const msg = messages.find(m => m.id === selectedMessage);
          if (msg?.content) navigator.clipboard.writeText(msg.content);
        }}
        onForward={() => {}}
        onDelete={(forEveryone) => {
          if (selectedMessage) deleteMessage(selectedMessage, forEveryone);
        }}
        isOwnMessage={messages.find(m => m.id === selectedMessage)?.sender_id === userId}
        messageContent={messages.find(m => m.id === selectedMessage)?.content || ''}
      />
    </div>
  );
}
