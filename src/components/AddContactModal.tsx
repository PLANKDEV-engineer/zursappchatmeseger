import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreateChat: (userId: string) => void;
}

export function AddContactModal({ isOpen, onClose, userId, onCreateChat }: AddContactModalProps) {
  const { contacts, addContact, searchUsers } = useContacts(userId);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      const { data } = await searchUsers(query);
      setSearchResults(data?.filter(u => u.user_id !== userId) || []);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim()) return;
    
    const { error } = await addContact(newContactName, newContactPhone || undefined);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menambah kontak', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Kontak berhasil ditambahkan' });
      setNewContactName('');
      setNewContactPhone('');
      setShowAddNew(false);
    }
  };

  const handleSelectUser = (user: any) => {
    onCreateChat(user.user_id);
  };

  const handleSelectContact = (contact: any) => {
    if (contact.contact_user_id) {
      onCreateChat(contact.contact_user_id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={onClose}
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
            <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold">Chat Baru</h2>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama atau nomor..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4">
              {/* Add New Contact Button */}
              <button
                onClick={() => setShowAddNew(!showAddNew)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all mb-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">Tambah Kontak Baru</h3>
                  <p className="text-sm text-muted-foreground">Simpan kontak baru ke daftar</p>
                </div>
              </button>

              {/* Add New Contact Form */}
              <AnimatePresence>
                {showAddNew && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                      <Input
                        placeholder="Nama"
                        value={newContactName}
                        onChange={e => setNewContactName(e.target.value)}
                      />
                      <Input
                        placeholder="Nomor Telepon (opsional)"
                        value={newContactPhone}
                        onChange={e => setNewContactPhone(e.target.value)}
                      />
                      <Button onClick={handleAddContact} className="w-full">
                        Simpan Kontak
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Results */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Hasil Pencarian</h3>
                  <div className="space-y-1">
                    {searchResults.map(user => (
                      <button
                        key={user.user_id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card-hover transition-all"
                      >
                        <Avatar
                          src={user.avatar_url}
                          name={user.name}
                          size="md"
                        />
                        <div className="text-left">
                          <h4 className="font-medium text-foreground">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Contacts */}
              {contacts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Kontak Tersimpan</h3>
                  <div className="space-y-1">
                    {contacts.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card-hover transition-all"
                      >
                        <Avatar
                          src={contact.profile?.avatar_url || undefined}
                          name={contact.name}
                          size="md"
                          isOnline={contact.profile?.is_online}
                          showStatus={!!contact.contact_user_id}
                        />
                        <div className="text-left">
                          <h4 className="font-medium text-foreground">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">{contact.phone || 'No phone'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {contacts.length === 0 && !searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada kontak tersimpan
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
