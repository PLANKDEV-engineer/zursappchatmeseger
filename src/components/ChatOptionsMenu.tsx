import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Trash2,
  Ban,
  Flag,
  Copy,
  Forward,
  Reply,
  Smile,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onDeleteChat: () => void;
  onBlock: () => void;
  onReport: () => void;
  userName: string;
  isBlocked: boolean;
}

export function ChatOptionsMenu({
  isOpen,
  onClose,
  onViewProfile,
  onDeleteChat,
  onBlock,
  onReport,
  userName,
  isBlocked,
}: ChatOptionsMenuProps) {
  const menuItems = [
    { icon: User, label: 'Lihat Profil', onClick: onViewProfile, color: 'text-foreground' },
    { icon: Trash2, label: 'Hapus Chat', onClick: onDeleteChat, color: 'text-foreground' },
    { 
      icon: Ban, 
      label: isBlocked ? 'Buka Blokir' : 'Blokir', 
      onClick: onBlock, 
      color: isBlocked ? 'text-primary' : 'text-destructive' 
    },
    { icon: Flag, label: 'Laporkan', onClick: onReport, color: 'text-destructive' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3" />
            
            <div className="p-4">
              <h3 className="text-lg font-display font-bold text-center mb-4">{userName}</h3>
              
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors ${item.color}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full mt-4"
              >
                Batal
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Message context menu
interface MessageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReply: () => void;
  onReact: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDelete: (forEveryone: boolean) => void;
  isOwnMessage: boolean;
  messageContent: string;
}

export function MessageMenu({
  isOpen,
  onClose,
  onReply,
  onReact,
  onCopy,
  onForward,
  onDelete,
  isOwnMessage,
  messageContent,
}: MessageMenuProps) {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const menuItems = [
    { icon: Reply, label: 'Balas', onClick: onReply },
    { icon: Smile, label: 'Reaksi', onClick: onReact },
    { icon: Copy, label: 'Salin', onClick: onCopy },
    { icon: Forward, label: 'Teruskan', onClick: onForward },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3" />
            
            <div className="p-4">
              {/* Message preview */}
              <div className="p-3 rounded-lg bg-muted mb-4 max-h-20 overflow-hidden">
                <p className="text-sm text-muted-foreground line-clamp-2">{messageContent}</p>
              </div>
              
              {!showDeleteOptions ? (
                <>
                  <div className="flex justify-around mb-4">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick();
                          onClose();
                        }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteOptions(true)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Hapus Pesan</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onDelete(false);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Hapus untuk Saya</span>
                  </button>
                  
                  {isOwnMessage && (
                    <button
                      onClick={() => {
                        onDelete(true);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium">Hapus untuk Semua</span>
                    </button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteOptions(false)}
                    className="w-full mt-2"
                  >
                    Kembali
                  </Button>
                </div>
              )}
              
              {!showDeleteOptions && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full mt-4"
                >
                  Batal
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Emoji reaction picker
interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🙏', '🔥', '🎉', '💯', '👀'];

export function ReactionPicker({ isOpen, onClose, onSelect }: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute bottom-full mb-2 left-0 bg-card rounded-2xl border border-border shadow-xl p-2"
        >
          <div className="flex gap-1 flex-wrap max-w-xs">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="w-10 h-10 rounded-lg hover:bg-muted transition-colors flex items-center justify-center text-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
