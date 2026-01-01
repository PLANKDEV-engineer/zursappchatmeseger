import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Search, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreateGroup: (name: string, participantIds: string[], isChannel?: boolean) => void;
  mode?: 'group' | 'channel';
}

export function CreateGroupModal({ 
  isOpen, 
  onClose, 
  userId, 
  onCreateGroup,
  mode = 'group'
}: CreateGroupModalProps) {
  const { contacts, searchUsers } = useContacts(userId);
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [step, setStep] = useState<'info' | 'select'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setGroupName('');
      setGroupDescription('');
      setSelectedContacts([]);
      setStep('info');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const { data } = await searchUsers(query);
      setSearchResults(data?.filter(u => u.user_id !== userId) || []);
    } else {
      setSearchResults([]);
    }
  };

  const handleToggleContact = (contactUserId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactUserId)
        ? prev.filter(id => id !== contactUserId)
        : [...prev, contactUserId]
    );
  };

  const handleNext = () => {
    if (!groupName.trim()) {
      toast({ title: 'Error', description: `Masukkan nama ${mode === 'channel' ? 'saluran' : 'grup'}`, variant: 'destructive' });
      return;
    }
    setStep('select');
  };

  const handleCreate = () => {
    onCreateGroup(groupName, selectedContacts, mode === 'channel');
    handleClose();
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedContacts([]);
    setStep('info');
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const isChannel = mode === 'channel';
  const Icon = isChannel ? Radio : Users;
  const title = isChannel ? 'Saluran Baru' : 'Grup Baru';

  // Merge contacts with search results, avoiding duplicates
  const allUsers = [
    ...contacts.filter(c => c.contact_user_id).map(c => ({
      user_id: c.contact_user_id!,
      name: c.name,
      avatar_url: c.profile?.avatar_url,
      is_online: c.profile?.is_online,
    })),
    ...searchResults.filter(sr => 
      !contacts.some(c => c.contact_user_id === sr.user_id)
    ).map(sr => ({
      user_id: sr.user_id,
      name: sr.name,
      avatar_url: sr.avatar_url,
      is_online: false,
    })),
  ];

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
                  <Icon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-display font-bold">
                    {step === 'info' ? title : 'Tambah Anggota (Opsional)'}
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
              {step === 'info' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <Input
                    placeholder={`Nama ${isChannel ? 'saluran' : 'grup'}...`}
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="text-center text-lg"
                    autoFocus
                  />
                  <Input
                    placeholder="Deskripsi (opsional)"
                    value={groupDescription}
                    onChange={e => setGroupDescription(e.target.value)}
                    className="text-center"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {isChannel 
                      ? 'Saluran adalah tempat untuk menyiarkan pesan ke banyak pengikut'
                      : 'Grup adalah tempat untuk berdiskusi bersama teman-teman'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Cari pengguna..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-12"
                    />
                  </div>

                  {/* Selected chips */}
                  {selectedContacts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedContacts.map(id => {
                        const user = allUsers.find(u => u.user_id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                          >
                            {user?.name || 'Unknown'}
                            <button onClick={() => handleToggleContact(id)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Users list */}
                  {allUsers.length > 0 ? (
                    <div className="space-y-1">
                      {allUsers.map(user => {
                        const isSelected = selectedContacts.includes(user.user_id);
                        return (
                          <button
                            key={user.user_id}
                            onClick={() => handleToggleContact(user.user_id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isSelected ? 'bg-primary/10' : 'hover:bg-card-hover'
                            }`}
                          >
                            <div className="relative">
                              <Avatar
                                src={user.avatar_url || undefined}
                                name={user.name}
                                size="md"
                              />
                              {isSelected && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-left flex-1">
                              <h4 className="font-medium text-foreground">{user.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {user.is_online ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Tidak ada pengguna ditemukan</p>
                      <p className="text-sm mt-1">Cari pengguna atau lanjut tanpa anggota</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border/50 p-4">
              {step === 'info' ? (
                <Button
                  onClick={handleNext}
                  disabled={!groupName.trim()}
                  className="w-full"
                >
                  Lanjut
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('info')}
                    className="flex-1"
                  >
                    Kembali
                  </Button>
                  <Button
                    onClick={handleCreate}
                    className="flex-1"
                  >
                    Buat {isChannel ? 'Saluran' : 'Grup'}
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
