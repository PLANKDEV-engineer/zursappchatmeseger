import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreateGroup: (name: string, participantIds: string[]) => void;
}

export function CreateGroupModal({ isOpen, onClose, userId, onCreateGroup }: CreateGroupModalProps) {
  const { contacts } = useContacts(userId);
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'name'>(1 === 1 ? 'select' : 'name');

  const handleToggleContact = (contactUserId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactUserId)
        ? prev.filter(id => id !== contactUserId)
        : [...prev, contactUserId]
    );
  };

  const handleNext = () => {
    if (selectedContacts.length === 0) {
      toast({ title: 'Error', description: 'Pilih minimal 1 kontak', variant: 'destructive' });
      return;
    }
    setStep('name');
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      toast({ title: 'Error', description: 'Masukkan nama grup', variant: 'destructive' });
      return;
    }
    onCreateGroup(groupName, selectedContacts);
    setGroupName('');
    setSelectedContacts([]);
    setStep('select');
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedContacts([]);
    setStep('select');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-card rounded-t-3xl border-t border-border overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-display font-bold">
                    {step === 'select' ? 'Pilih Anggota' : 'Nama Grup'}
                  </h2>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={handleClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {step === 'select' && selectedContacts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedContacts.length} anggota dipilih
                </p>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-4">
              {step === 'select' ? (
                <>
                  {contacts.filter(c => c.contact_user_id).length > 0 ? (
                    <div className="space-y-1">
                      {contacts
                        .filter(c => c.contact_user_id)
                        .map(contact => {
                          const isSelected = selectedContacts.includes(contact.contact_user_id!);
                          return (
                            <button
                              key={contact.id}
                              onClick={() => handleToggleContact(contact.contact_user_id!)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                isSelected ? 'bg-primary/10' : 'hover:bg-card-hover'
                              }`}
                            >
                              <div className="relative">
                                <Avatar
                                  src={contact.profile?.avatar_url || undefined}
                                  name={contact.name}
                                  size="md"
                                />
                                {isSelected && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="text-left flex-1">
                                <h4 className="font-medium text-foreground">{contact.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {contact.profile?.is_online ? 'Online' : 'Offline'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Belum ada kontak dengan akun ZursApp
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <Input
                    placeholder="Nama grup..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="text-center text-lg"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {selectedContacts.length} anggota akan ditambahkan
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border/50 p-4">
              {step === 'select' ? (
                <Button
                  onClick={handleNext}
                  disabled={selectedContacts.length === 0}
                  className="w-full"
                >
                  Lanjut
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('select')}
                    className="flex-1"
                  >
                    Kembali
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!groupName.trim()}
                    className="flex-1"
                  >
                    Buat Grup
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
