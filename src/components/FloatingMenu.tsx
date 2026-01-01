import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Radio, X } from 'lucide-react';

interface FloatingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: () => void;
  onAddGroup: () => void;
  onAddChannel: () => void;
}

export function FloatingMenu({
  isOpen,
  onClose,
  onAddContact,
  onAddGroup,
  onAddChannel,
}: FloatingMenuProps) {
  const menuItems = [
    {
      icon: MessageCircle,
      label: 'New Chat',
      onClick: onAddContact,
      color: 'from-primary to-cyan-400',
    },
    {
      icon: Users,
      label: 'New Group',
      onClick: onAddGroup,
      color: 'from-accent to-blue-400',
    },
    {
      icon: Radio,
      label: 'New Channel',
      onClick: onAddChannel,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Menu Items - positioned higher to avoid collision */}
          <div className="fixed bottom-40 right-6 z-50 flex flex-col-reverse items-end gap-4">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="px-3 py-1.5 rounded-lg bg-card text-sm font-medium text-foreground shadow-lg border border-border"
                >
                  {item.label}
                </motion.span>
                <button
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95`}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Close Button - stays in FAB position */}
          <motion.button
            initial={{ rotate: 0 }}
            animate={{ rotate: 45 }}
            exit={{ rotate: 0 }}
            onClick={onClose}
            className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg"
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>
        </>
      )}
    </AnimatePresence>
  );
}
