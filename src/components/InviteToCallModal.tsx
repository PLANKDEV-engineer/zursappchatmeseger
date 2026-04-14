import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface InviteToCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onInvite: (targetUserId: string) => void;
}

export function InviteToCallModal({ isOpen, onClose, userId, onInvite }: InviteToCallModalProps) {
  const [contacts, setContacts] = useState<{ user_id: string; name: string; avatar_url: string | null }[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchContacts = async () => {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('contact_user_id, name')
        .eq('user_id', userId)
        .not('contact_user_id', 'is', null);

      if (!contactData) return;

      const userIds = contactData.map(c => c.contact_user_id).filter(Boolean) as string[];
      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      setContacts(profiles || []);
    };
    fetchContacts();
  }, [isOpen, userId]);

  const filtered = search
    ? contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : contacts;

  const handleInvite = (targetId: string, name: string) => {
    onInvite(targetId);
    toast.success(`Undangan panggilan dikirim ke ${name}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[110] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-t-2xl border border-border shadow-xl max-h-[70vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-display font-bold text-foreground">Undang ke Panggilan</h3>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kontak..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada kontak</p>
              ) : (
                filtered.map(contact => (
                  <button
                    key={contact.user_id}
                    onClick={() => handleInvite(contact.user_id, contact.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors"
                  >
                    <Avatar
                      src={contact.avatar_url || undefined}
                      name={contact.name}
                      size="sm"
                      showStatus={false}
                    />
                    <span className="flex-1 text-left font-medium text-foreground">{contact.name}</span>
                    <Phone className="w-4 h-4 text-primary" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
