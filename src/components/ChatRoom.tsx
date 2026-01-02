import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  X,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useMessages } from '@/hooks/useMessages';
import { useTyping } from '@/hooks/useTyping';
import { useBlocking } from '@/hooks/useBlocking';
import { useAuth } from '@/context/AuthContext';
import { MediaUpload } from '@/components/MediaUpload';
import { PollCreator, PollDisplay } from '@/components/PollCreator';
import { MessageMenu, ChatOptionsMenu, ReactionPicker } from '@/components/ChatOptionsMenu';
import { ProfileView } from '@/components/ProfileView';
import { ReportModal } from '@/components/ReportModal';
import { ForwardModal } from '@/components/ForwardModal';
import { SwipeableMessage } from '@/components/SwipeableMessage';
import { GroupChannelInfo } from '@/components/GroupChannelInfo';
import type { ChatWithDetails } from '@/hooks/useChats';

interface ChatRoomProps {
  chat: ChatWithDetails;
  userId: string;
  onBack: () => void;
  onCall: () => void;
  onVideoCall: () => void;
  onInfo: () => void;
  onChatWithUser?: (userId: string) => void;
}

export function ChatRoom({
  chat,
  userId,
  onBack,
  onCall,
  onVideoCall,
  onInfo,
  onChatWithUser,
}: ChatRoomProps) {
  const { messages, loading, sendMessage, deleteMessage, addReaction } = useMessages(chat.id, userId);
  const { typingUsers, setTyping } = useTyping(chat.id, userId);
  const { isBlocked, blockUser, unblockUser } = useBlocking(userId);
  const { isAdmin: isAppAdmin } = useAuth();
  
  const [inputValue, setInputValue] = useState('');
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName?: string } | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [forwardMessageContent, setForwardMessageContent] = useState('');
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
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
    const pollData = JSON.stringify({ question, options, votes: options.map(() => 0), voters: options.map(() => []) });
    await sendMessage(pollData, 'poll');
  };

  const handlePollVote = async (messageId: string, optionIndex: number) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.content) return;
    
    try {
      const pollData = JSON.parse(message.content);
      
      // Check if user already voted
      const alreadyVoted = pollData.voters?.some((voters: string[]) => voters?.includes(userId));
      if (alreadyVoted) return;
      
      // Update votes
      pollData.votes[optionIndex] = (pollData.votes[optionIndex] || 0) + 1;
      if (!pollData.voters) pollData.voters = pollData.options.map(() => []);
      pollData.voters[optionIndex] = [...(pollData.voters[optionIndex] || []), userId];
      
      // Update message content
      await supabase
        .from('messages')
        .update({ content: JSON.stringify(pollData) })
        .eq('id', messageId);
    } catch (e) {
      console.error('Error voting on poll:', e);
    }
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
  const isChannel = chat.type === 'channel';
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserOwner, setIsUserOwner] = useState(false);
  const [isGroupClosed, setIsGroupClosed] = useState(chat.is_closed || false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userId || !chat.id) return;
      const { data } = await supabase
        .from('chat_participants')
        .select('is_admin, is_owner')
        .eq('chat_id', chat.id)
        .eq('user_id', userId)
        .single();
      setIsUserAdmin(data?.is_admin || data?.is_owner || false);
      setIsUserOwner(data?.is_owner || false);
    };
    checkAdminStatus();
  }, [chat.id, userId]);

  // Also check if chat.is_closed changed
  useEffect(() => {
    setIsGroupClosed(chat.is_closed || false);
  }, [chat.is_closed]);

  // Fetch other user profile for private chats
  useEffect(() => {
    const fetchOtherUserProfile = async () => {
      if (chat.type !== 'private') return;
      
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chat.id)
        .neq('user_id', userId);
      
      if (participants && participants.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', participants[0].user_id)
          .single();
        
        if (profile) {
          setOtherUserProfile(profile);
        }
      }
    };
    fetchOtherUserProfile();
  }, [chat.id, chat.type, userId]);

  const handleBlock = async () => {
    if (!otherUserProfile) return;
    if (isBlocked(otherUserProfile.user_id)) {
      await unblockUser(otherUserProfile.user_id);
    } else {
      await blockUser(otherUserProfile.user_id);
    }
  };

  const handleForwardMessage = async (chatIds: string[]) => {
    for (const chatId of chatIds) {
      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: userId,
        content: forwardMessageContent,
        type: 'text',
        status: 'sent',
      });
    }
    setForwardMessageContent('');
    setShowForwardModal(false);
  };

  const handleSwipeReply = (message: any) => {
    setReplyTo({
      id: message.id,
      content: message.content || '',
      senderName: message.senderProfile?.name
    });
  };
  
  // Logika pengiriman pesan:
  // 1. App-level admin (dari user_roles) SELALU bisa kirim ke mana saja
  // 2. Saluran: HANYA admin/owner yang bisa kirim
  // 3. Grup resmi: HANYA admin/owner yang bisa kirim
  // 4. Grup biasa tertutup (is_closed): HANYA admin yang bisa kirim
  // 5. Grup biasa terbuka: semua anggota bisa kirim
  // 6. Chat pribadi: semua bisa kirim
  const canSendMessage = (() => {
    // App-level admin selalu bisa kirim
    if (isAppAdmin) {
      return true;
    }
    // Saluran: hanya admin/owner
    if (isChannel) {
      return isUserAdmin || isUserOwner;
    }
    // Grup resmi: hanya admin/owner
    if (isOfficial && chat.type === 'group') {
      return isUserAdmin || isUserOwner;
    }
    // Grup tertutup: hanya admin
    if (chat.type === 'group' && (isGroupClosed || chat.only_admins_can_send)) {
      return isUserAdmin || isUserOwner;
    }
    // Default: semua bisa kirim
    return true;
  })();

  const renderMessageContent = (message: any) => {
    // Handle poll type
    if (message.type === 'poll' && message.content) {
      try {
        const pollData = JSON.parse(message.content);
        const userVoteIndex = pollData.voters?.findIndex((voters: string[]) => voters?.includes(userId));
        const totalVotes = pollData.votes?.reduce((a: number, b: number) => a + b, 0) || 0;
        
        return (
          <PollDisplay
            question={pollData.question}
            options={pollData.options.map((opt: string, i: number) => ({
              text: opt,
              votes: pollData.votes[i] || 0,
              voters: pollData.voters?.[i] || []
            }))}
            totalVotes={totalVotes}
            userVote={userVoteIndex >= 0 ? userVoteIndex : undefined}
            onVote={(idx) => handlePollVote(message.id, idx)}
          />
        );
      } catch {
        return <p className="text-sm">{message.content}</p>;
      }
    }
    
    // Handle image type
    if (message.type === 'image' && message.media_url) {
      return (
        <div className="max-w-[250px]">
          <img 
            src={message.media_url} 
            alt="Shared image" 
            className="rounded-lg w-full"
          />
          {message.content && <p className="text-sm mt-2">{message.content}</p>}
        </div>
      );
    }
    
    // Handle video type
    if (message.type === 'video' && message.media_url) {
      return (
        <div className="max-w-[250px]">
          <video 
            src={message.media_url} 
            controls
            className="rounded-lg w-full"
          />
          {message.content && <p className="text-sm mt-2">{message.content}</p>}
        </div>
      );
    }
    
    // Default text
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <button onClick={() => chat.type === 'private' ? setShowProfileView(true) : onInfo()} className="flex items-center gap-3 flex-1">
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
                    ? (otherUserProfile?.is_online 
                        ? 'Online' 
                        : `Terakhir dilihat ${formatLastSeen(otherUserProfile?.last_seen)}`)
                    : chat.type === 'channel'
                      ? `${chat.followers_count || 0} pengikut`
                      : 'Grup'
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
            <Button variant="ghost" size="icon-sm" onClick={() => setShowChatOptions(true)}>
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
              <SwipeableMessage
                key={message.id}
                isMe={isMe}
                onSwipeReply={() => handleSwipeReply(message)}
              >
                <motion.div
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
                    onClick={() => {
                      if (message.type !== 'poll') {
                        setSelectedMessage(message.id);
                      }
                    }}
                  >
                    {!isMe && chat.type !== 'private' && (
                      <p className="text-xs font-medium text-primary mb-1">
                        {message.senderProfile?.name}
                      </p>
                    )}
                    
                    {/* Reply preview */}
                    {message.reply_to_id && (
                      <div className="mb-2 p-2 rounded bg-muted/50 border-l-2 border-primary">
                        <p className="text-xs text-primary">Membalas</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {messages.find(m => m.id === message.reply_to_id)?.content || 'Pesan'}
                        </p>
                      </div>
                    )}
                    
                    {renderMessageContent(message)}
                    
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] opacity-70">
                        {formatTime(message.created_at)}
                      </span>
                      {/* Read receipts - only for own messages in private chats */}
                      {isMe && chat.type === 'private' && (
                        <>
                          {message.status === 'sending' && (
                            <div className="w-3 h-3 rounded-full border border-muted-foreground border-t-transparent animate-spin" />
                          )}
                          {message.status === 'sent' && (
                            <Check className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          {message.status === 'delivered' && (
                            <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          {message.status === 'read' && (
                            <CheckCheck className="w-3.5 h-3.5 text-primary" />
                          )}
                        </>
                      )}
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              addReaction(message.id, emoji);
                            }}
                            className="text-xs bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded-full transition-colors"
                          >
                            {emoji} {message.reactions?.filter(r => r.emoji === emoji).length}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </SwipeableMessage>
            );
          })
        )}

        {typingUsers.length > 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-card border-t border-border flex items-center gap-2"
          >
            <div className="flex-1 p-2 bg-muted rounded-lg border-l-2 border-primary">
              <p className="text-xs text-primary">Membalas {replyTo.senderName || ''}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{replyTo.content}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setReplyTo(null)}>
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Chat Options Menu (3-dot menu) - for private chats */}
      {chat.type === 'private' && otherUserProfile && (
        <ChatOptionsMenu
          isOpen={showChatOptions}
          onClose={() => setShowChatOptions(false)}
          onViewProfile={() => {
            setShowChatOptions(false);
            setShowProfileView(true);
          }}
          onDeleteChat={() => {
            setShowChatOptions(false);
            // TODO: Implement delete chat
          }}
          onBlock={() => {
            setShowChatOptions(false);
            handleBlock();
          }}
          onReport={() => {
            setShowChatOptions(false);
            setShowReportModal(true);
          }}
          userName={otherUserProfile?.name || chat.name || 'User'}
          isBlocked={isBlocked(otherUserProfile?.user_id)}
        />
      )}

      {/* Group/Channel Options Menu (3-dot menu) - for groups and channels */}
      {(chat.type === 'group' || chat.type === 'channel') && showChatOptions && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          onClick={() => setShowChatOptions(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-center mb-4">{chat.name}</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowChatOptions(false);
                  setShowGroupInfo(true);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <span className="font-medium">Lihat Info {chat.type === 'channel' ? 'Saluran' : 'Grup'}</span>
              </button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowChatOptions(false)}
              className="w-full mt-4"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Group/Channel Info Modal */}
      <GroupChannelInfo
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        chat={chat}
        userId={userId}
        onChatWithUser={(targetUserId) => {
          setShowGroupInfo(false);
          if (onChatWithUser) {
            onChatWithUser(targetUserId);
          }
        }}
      />

      {/* Message Menu */}
      <MessageMenu
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onReply={() => {
          const msg = messages.find(m => m.id === selectedMessage);
          if (msg) setReplyTo({ id: msg.id, content: msg.content || '', senderName: msg.senderProfile?.name });
          setSelectedMessage(null);
        }}
        onReact={() => setShowReactions(selectedMessage)}
        onCopy={() => {
          const msg = messages.find(m => m.id === selectedMessage);
          if (msg?.content) navigator.clipboard.writeText(msg.content);
          setSelectedMessage(null);
        }}
        onForward={() => {
          const msg = messages.find(m => m.id === selectedMessage);
          if (msg?.content) {
            setForwardMessageContent(msg.content);
            setShowForwardModal(true);
          }
          setSelectedMessage(null);
        }}
        onDelete={(forEveryone) => {
          if (selectedMessage) deleteMessage(selectedMessage, forEveryone);
          setSelectedMessage(null);
        }}
        isOwnMessage={messages.find(m => m.id === selectedMessage)?.sender_id === userId}
        messageContent={messages.find(m => m.id === selectedMessage)?.content || ''}
      />

      {/* Reaction Picker */}
      {showReactions && (
        <div className="fixed inset-0 z-50" onClick={() => setShowReactions(null)}>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
            <ReactionPicker
              isOpen={true}
              onClose={() => setShowReactions(null)}
              onSelect={(emoji) => {
                addReaction(showReactions, emoji);
                setShowReactions(null);
                setSelectedMessage(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {otherUserProfile && (
        <ProfileView
          isOpen={showProfileView}
          onClose={() => setShowProfileView(false)}
          profile={otherUserProfile}
          isBlocked={isBlocked(otherUserProfile.user_id)}
          isOfficial={chat.is_official || false}
          onCall={onCall}
          onVideoCall={onVideoCall}
          onBlock={handleBlock}
          onReport={() => {
            setShowProfileView(false);
            setShowReportModal(true);
          }}
          onDeleteChat={() => {}}
        />
      )}

      {/* Report Modal */}
      {otherUserProfile && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={otherUserProfile.user_id}
          reportedUserName={otherUserProfile.name}
          userId={userId}
        />
      )}

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={handleForwardMessage}
        messageContent={forwardMessageContent}
        userId={userId}
      />
    </div>
  );
}