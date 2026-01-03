import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, MessageCircle, Copy, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { UserInfoSheet, type UserInfoSheetUser } from '@/components/UserInfoSheet';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreateChat: (userId: string) => void;
}

export function AddContactModal({ isOpen, onClose, userId, onCreateChat }: AddContactModalProps) {
  const { contacts, addContact, searchUsers, findUserByPublicId } = useContacts(userId);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newContactPublicId, setNewContactPublicId] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [infoUser, setInfoUser] = useState<UserInfoSheetUser | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);

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

  const handleFindByPublicId = async () => {
    if (!newContactPublicId.trim()) return;
    
    setIsFinding(true);
    const { data, error } = await findUserByPublicId(newContactPublicId.trim());
    setIsFinding(false);
    
    if (error || !data) {
      toast({ title: 'Tidak ditemukan', description: 'User ID tidak ditemukan', variant: 'destructive' });
      setFoundUser(null);
    } else if (data.user_id === userId) {
      toast({ title: 'Error', description: 'Tidak bisa menambahkan diri sendiri', variant: 'destructive' });
      setFoundUser(null);
    } else {
      setFoundUser(data);
    }
  };

  const handleAddFoundUser = async () => {
    if (!foundUser) return;
    
    const { error } = await addContact(foundUser.name, foundUser.phone, foundUser.public_id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Kontak berhasil ditambahkan' });
      setNewContactPublicId('');
      setFoundUser(null);
      setShowAddNew(false);
    }
  };

  const handleSelectUser = async (user: any) => {
    // First save as contact
    await addContact(user.name, user.phone, user.public_id);
    // Then open chat
    onCreateChat(user.user_id);
    onClose();
  };

  const handleSelectContact = (contact: any) => {
    if (contact.contact_user_id) {
      onCreateChat(contact.contact_user_id);
      onClose();
    }
  };

  const copyMyPublicId = () => {
    if (profile?.public_id) {
      navigator.clipboard.writeText(profile.public_id);
      setCopied(true);
      toast({ title: 'Tersalin!', description: 'User ID Anda telah disalin' });
      setTimeout(() => setCopied(false), 2000);
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

              {/* My User ID */}
              {profile?.public_id && (
                <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">User ID Anda (bagikan untuk ditambahkan)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-primary truncate">
                      {profile.public_id}
                    </code>
                    <Button variant="ghost" size="icon-sm" onClick={copyMyPublicId}>
                      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama, telepon, atau User ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4">
              {/* Add New Contact Button */}
              <button
                onClick={() => setShowAddNew(!showAddNew)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all mb-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">Tambah dengan User ID</h3>
                  <p className="text-sm text-muted-foreground">Masukkan User ID untuk menambahkan kontak</p>
                </div>
              </button>

              {/* Add by User ID Form */}
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
                        placeholder="Masukkan User ID"
                        value={newContactPublicId}
                        onChange={e => setNewContactPublicId(e.target.value)}
                      />
                      <Button 
                        onClick={handleFindByPublicId} 
                        className="w-full"
                        disabled={isFinding || !newContactPublicId.trim()}
                      >
                        {isFinding ? 'Mencari...' : 'Cari User'}
                      </Button>

                      {/* Found User Preview */}
                      {foundUser && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={foundUser.avatar_url}
                              name={foundUser.name}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground">{foundUser.name}</h4>
                              <p className="text-sm text-muted-foreground truncate">{foundUser.phone || 'No phone'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              variant="outline"
                              onClick={handleAddFoundUser} 
                              className="flex-1"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Simpan
                            </Button>
                            <Button 
                              onClick={() => {
                                handleSelectUser(foundUser);
                              }} 
                              className="flex-1"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Results */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Hasil Pencarian</h3>
                  <div className="space-y-1">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectUser(user)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleSelectUser(user);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card-hover transition-all cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoUser({
                              user_id: user.user_id,
                              name: user.name,
                              phone: user.phone,
                              avatar_url: user.avatar_url,
                              public_id: user.public_id,
                            });
                            setShowUserInfo(true);
                          }}
                          className="rounded-full"
                          aria-label={`Lihat info akun ${user.name}`}
                        >
                          <Avatar src={user.avatar_url} name={user.name} size="md" />
                        </button>

                        <div className="text-left flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{user.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{user.phone || 'No phone'}</p>
                          <p className="text-xs text-primary/70 font-mono truncate">ID: {user.public_id?.slice(0, 8)}...</p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoUser({
                              user_id: user.user_id,
                              name: user.name,
                              phone: user.phone,
                              avatar_url: user.avatar_url,
                              public_id: user.public_id,
                            });
                            setShowUserInfo(true);
                          }}
                          aria-label={`Info akun ${user.name}`}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-4 text-muted-foreground">
                  Tidak ada pengguna ditemukan
                </div>
              )}

              {/* Existing Contacts */}
              {contacts.length > 0 && !searchQuery && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Kontak Tersimpan</h3>
                  <div className="space-y-1">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectContact(contact)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleSelectContact(contact);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card-hover transition-all cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!contact.contact_user_id) return;
                            setInfoUser({
                              user_id: contact.contact_user_id,
                              name: contact.name,
                              phone: contact.phone,
                              avatar_url: contact.profile?.avatar_url || null,
                              public_id: contact.profile?.public_id,
                            });
                            setShowUserInfo(true);
                          }}
                          className="rounded-full"
                          aria-label={`Lihat info akun ${contact.name}`}
                        >
                          <Avatar
                            src={contact.profile?.avatar_url || undefined}
                            name={contact.name}
                            size="md"
                            isOnline={contact.profile?.is_online}
                            showStatus={!!contact.contact_user_id}
                          />
                        </button>

                        <div className="text-left flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{contact.phone || 'No phone'}</p>
                          {contact.profile?.public_id && (
                            <p className="text-xs text-primary/70 font-mono truncate">
                              ID: {contact.profile.public_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!contact.contact_user_id) return;
                            setInfoUser({
                              user_id: contact.contact_user_id,
                              name: contact.name,
                              phone: contact.phone,
                              avatar_url: contact.profile?.avatar_url || null,
                              public_id: contact.profile?.public_id,
                            });
                            setShowUserInfo(true);
                          }}
                          aria-label={`Info akun ${contact.name}`}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contacts.length === 0 && !searchQuery && !showAddNew && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada kontak tersimpan</p>
                  <p className="text-sm mt-1">Gunakan User ID untuk menambahkan teman</p>
                </div>
              )}
            </div>
            </motion.div>

            <UserInfoSheet
              isOpen={showUserInfo}
              onClose={() => setShowUserInfo(false)}
              user={infoUser}
              onChat={(targetUserId) => {
                onCreateChat(targetUserId);
                onClose();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
}
