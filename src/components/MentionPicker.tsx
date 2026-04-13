import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/Avatar';

interface MemberInfo {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

interface MentionPickerProps {
  isOpen: boolean;
  chatId: string;
  filter: string;
  onSelect: (member: MemberInfo) => void;
  onClose: () => void;
}

export function MentionPicker({ isOpen, chatId, filter, onSelect, onClose }: MentionPickerProps) {
  const [members, setMembers] = useState<MemberInfo[]>([]);

  useEffect(() => {
    if (!isOpen || !chatId) return;
    
    const fetchMembers = async () => {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId);

      if (!participants) return;

      const userIds = participants.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        setMembers(profiles);
      }
    };
    
    fetchMembers();
  }, [isOpen, chatId]);

  const filtered = filter
    ? members.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()))
    : members;

  return (
    <AnimatePresence>
      {isOpen && filtered.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-t-2xl shadow-xl max-h-48 overflow-y-auto z-20"
        >
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2">Tag anggota</p>
          </div>
          <div className="py-1">
            {filtered.map((member) => (
              <button
                key={member.user_id}
                onClick={() => onSelect(member)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
              >
                <Avatar
                  src={member.avatar_url || undefined}
                  name={member.name}
                  size="xs"
                  showStatus={false}
                />
                <span className="text-sm font-medium text-foreground">{member.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
