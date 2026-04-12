import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Link as LinkIcon,
  Crown,
  Shield,
  LogOut,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  Copy,
  CheckCircle2,
  MessageCircle,
  MoreVertical,
  Settings,
  Flag,
} from 'lucide-react';
import { UserInfoSheet, UserInfoSheetUser } from '@/components/UserInfoSheet';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { GroupSettingsModal } from '@/components/GroupSettingsModal';
import { ReportChatModal } from '@/components/ReportChatModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatWithDetails } from '@/hooks/useChats';

interface Participant {
  id: string;
  user_id: string;
  is_admin: boolean;
  is_owner: boolean;
  joined_at: string;
  profile?: {
    name: string;
    phone: string | null;
    avatar_url: string | null;
    is_online: boolean;
    public_id: string;
  };
}

interface GroupChannelInfoProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatWithDetails;
  userId: string;
  onChatWithUser: (userId: string) => void;
}

export function GroupChannelInfo({
  isOpen,
  onClose,
  chat,
  userId,
  onChatWithUser,
}: GroupChannelInfoProps) {
  const { isAdmin: isAppAdmin } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserParticipant, setCurrentUserParticipant] = useState<Participant | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [chatData, setChatData] = useState(chat);

  // For viewing user info sheet
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userInfoData, setUserInfoData] = useState<UserInfoSheetUser | null>(null);

  const isChannel = chatData.type === 'channel';
  const isOfficial = chat.is_official;

  useEffect(() => {
    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen, chat.id]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data: participantsData, error } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chat.id);

      if (error) throw error;

      // Fetch profiles for all participants
      const participantsWithProfiles: Participant[] = [];
        for (const p of participantsData || []) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, phone, avatar_url, is_online, public_id')
            .eq('user_id', p.user_id)
            .maybeSingle();

        const participant: Participant = {
          ...p,
          profile: profile || undefined,
        };

        participantsWithProfiles.push(participant);

        if (p.user_id === userId) {
          setCurrentUserParticipant(participant);
        }
      }

      // Sort: owners first, then admins, then others
      participantsWithProfiles.sort((a, b) => {
        if (a.is_owner && !b.is_owner) return -1;
        if (!a.is_owner && b.is_owner) return 1;
        if (a.is_admin && !b.is_admin) return -1;
        if (!a.is_admin && b.is_admin) return 1;
        return 0;
      });

      setParticipants(participantsWithProfiles);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    // Use current origin for the invite link so it works in any environment
    const origin = window.location.origin;
    const link = chat.invite_link || `${origin}/join/${chat.id}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('Link berhasil disalin!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const promoteToAdmin = async (targetUserId: string) => {
    const { error } = await supabase
      .from('chat_participants')
      .update({ is_admin: true })
      .eq('chat_id', chat.id)
      .eq('user_id', targetUserId);

    if (error) {
      toast.error('Gagal mempromosikan admin');
    } else {
      toast.success('Berhasil menjadi admin');
      fetchParticipants();
    }
    setShowMemberMenu(false);
  };

  const demoteFromAdmin = async (targetUserId: string) => {
    const { error } = await supabase
      .from('chat_participants')
      .update({ is_admin: false })
      .eq('chat_id', chat.id)
      .eq('user_id', targetUserId);

    if (error) {
      toast.error('Gagal menurunkan admin');
    } else {
      toast.success('Admin diturunkan');
      fetchParticipants();
    }
    setShowMemberMenu(false);
  };

  const kickMember = async (targetUserId: string) => {
    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', chat.id)
      .eq('user_id', targetUserId);

    if (error) {
      toast.error('Gagal mengeluarkan anggota');
    } else {
      toast.success('Anggota dikeluarkan');
      fetchParticipants();
    }
    setShowMemberMenu(false);
  };

  const leaveGroup = async () => {
    if (isOfficial) {
      toast.error('Tidak dapat keluar dari grup/saluran resmi');
      return;
    }

    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', chat.id)
      .eq('user_id', userId);

    if (error) {
      toast.error('Gagal keluar dari grup');
    } else {
      toast.success('Berhasil keluar dari grup');
      onClose();
    }
  };

  const toggleGroupClosed = async () => {
    const newState = !chatData.is_closed;
    const { error } = await supabase
      .from('chats')
      .update({ is_closed: newState })
      .eq('id', chatData.id);

    if (error) {
      toast.error('Gagal mengubah pengaturan');
    } else {
      setChatData({ ...chatData, is_closed: newState });
      toast.success(newState ? 'Grup ditutup' : 'Grup dibuka');
    }
  };

  const refreshChatData = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatData.id)
      .single();
    if (data) {
      setChatData({ ...chatData, ...data });
    }
  };

  const deleteGroup = async () => {
    if (!currentUserParticipant?.is_owner) {
      toast.error('Hanya pemilik yang dapat menghapus');
      return;
    }

    // Delete all participants first
    await supabase.from('chat_participants').delete().eq('chat_id', chat.id);
    // Delete all messages
    await supabase.from('messages').delete().eq('chat_id', chat.id);
    // Delete the chat
    const { error } = await supabase.from('chats').delete().eq('id', chat.id);

    if (error) {
      toast.error('Gagal menghapus grup');
    } else {
      toast.success('Grup dihapus');
      onClose();
    }
  };

  const isUserAdmin = currentUserParticipant?.is_admin || currentUserParticipant?.is_owner || isAppAdmin;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed inset-0 bg-background z-50 overflow-y-auto"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-display font-bold text-lg">
                Info {isChannel ? 'Saluran' : 'Grup'}
              </h1>
            </div>
          </header>

          {/* Chat Info */}
          <div className="p-6 flex flex-col items-center border-b border-border">
            <Avatar
              src={chatData.avatar_url || undefined}
              name={chatData.name || undefined}
              size="xl"
            />
            <div className="flex items-center gap-2 mt-4">
              <h2 className="text-xl font-display font-bold">{chatData.name}</h2>
              {isOfficial && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </div>
            <p className="text-primary text-sm mt-1">
              {isChannel 
                ? `${chatData.followers_count?.toLocaleString() || 0} pengikut`
                : `${participants.length} anggota`
              }
            </p>
            {chatData.description && (
              <p className="text-muted-foreground text-center mt-3 max-w-sm">
                {chatData.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Dibuat {new Date(chatData.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Invite Link */}
          <div className="p-4 border-b border-border">
            <button
              onClick={copyInviteLink}
              className="w-full flex items-center gap-3 p-4 bg-card rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {linkCopied ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <LinkIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Link Undangan</p>
                <p className="text-sm text-muted-foreground truncate">
                  {chatData.invite_link || `${window.location.host}/join/${chatData.id.slice(0, 8)}...`}
                </p>
              </div>
              <Copy className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Settings (for admins only) */}
          {isUserAdmin && (
            <div className="p-4 border-b border-border space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Pengaturan</h3>
              
              {/* Edit Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-xl"
              >
                <Settings className="w-5 h-5 text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Edit {isChannel ? 'Saluran' : 'Grup'}</p>
                  <p className="text-sm text-muted-foreground">
                    Ubah nama, deskripsi, foto profil
                  </p>
                </div>
              </button>

              {/* Close/Open Group - only for groups */}
              {!isChannel && (
                <button
                  onClick={toggleGroupClosed}
                  className="w-full flex items-center gap-3 p-4 bg-card rounded-xl"
                >
                  {chatData.is_closed ? (
                    <Lock className="w-5 h-5 text-primary" />
                  ) : (
                    <Unlock className="w-5 h-5 text-primary" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium">
                      {chatData.is_closed ? 'Grup Tertutup' : 'Grup Terbuka'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {chatData.is_closed 
                        ? 'Hanya admin yang dapat mengirim pesan' 
                        : 'Semua anggota dapat mengirim pesan'
                      }
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => toast.info('Fitur tambah anggota akan segera hadir')}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-xl"
              >
                <UserPlus className="w-5 h-5 text-primary" />
                <span className="font-medium">Tambah Anggota</span>
              </button>
            </div>
          )}

          {/* Report Button - for non-admins */}
          {!isUserAdmin && !isOfficial && (
            <div className="p-4 border-b border-border">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-xl text-destructive"
              >
                <Flag className="w-5 h-5" />
                <span className="font-medium">Laporkan {isChannel ? 'Saluran' : 'Grup'}</span>
              </button>
            </div>
          )}

          {/* Members List (hidden for channels - only show for groups) */}
          {!isChannel && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Anggota ({participants.length})
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-xl"
                    >
                      {/* Avatar - click opens UserInfoSheet */}
                      <button
                        type="button"
                        className="focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (participant.user_id !== userId) {
                            setUserInfoData({
                              user_id: participant.user_id,
                              name: participant.profile?.name || 'Unknown',
                              phone: participant.profile?.phone,
                              avatar_url: participant.profile?.avatar_url,
                              public_id: participant.profile?.public_id,
                            });
                            setShowUserInfo(true);
                          }
                        }}
                      >
                        <Avatar
                          src={participant.profile?.avatar_url || undefined}
                          name={participant.profile?.name}
                          size="sm"
                          showStatus={participant.profile?.is_online}
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {participant.profile?.name || 'Unknown'}
                            {participant.user_id === userId && (
                              <span className="text-xs text-muted-foreground ml-1">(Anda)</span>
                            )}
                          </p>
                          {participant.is_owner && (
                            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                          {participant.is_admin && !participant.is_owner && (
                            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {participant.is_owner 
                            ? 'Pemilik' 
                            : participant.is_admin 
                              ? 'Admin' 
                              : 'Anggota'
                          }
                        </p>
                      </div>

                      {/* Chat button for other users */}
                      {participant.user_id !== userId && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChatWithUser(participant.user_id);
                            onClose();
                          }}
                          title="Chat Pribadi"
                        >
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </Button>
                      )}

                      {/* Actions menu for admins (to manage other non-owner members) */}
                      {isUserAdmin && participant.user_id !== userId && !participant.is_owner && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipant(participant);
                            setShowMemberMenu(true);
                          }}
                          title="Menu Admin"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leave/Delete Actions */}
          <div className="p-4 space-y-2">
            {!isOfficial && (
              <button
                onClick={leaveGroup}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-xl text-destructive"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar {isChannel ? 'Saluran' : 'Grup'}</span>
              </button>
            )}

            {currentUserParticipant?.is_owner && !isOfficial && (
              <button
                onClick={deleteGroup}
                className="w-full flex items-center gap-3 p-4 bg-destructive/10 rounded-xl text-destructive"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Hapus {isChannel ? 'Saluran' : 'Grup'}</span>
              </button>
            )}
          </div>

          {/* Member Actions Menu */}
          <AnimatePresence>
            {showMemberMenu && selectedParticipant && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
                onClick={() => setShowMemberMenu(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border p-4"
                >
                  <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      src={selectedParticipant.profile?.avatar_url || undefined}
                      name={selectedParticipant.profile?.name}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold">{selectedParticipant.profile?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedParticipant.is_admin ? 'Admin' : 'Anggota'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onChatWithUser(selectedParticipant.user_id);
                        setShowMemberMenu(false);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat Pribadi</span>
                    </button>

                    {selectedParticipant.is_admin ? (
                      <button
                        onClick={() => demoteFromAdmin(selectedParticipant.user_id)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Hapus sebagai Admin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => promoteToAdmin(selectedParticipant.user_id)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
                      >
                        <Shield className="w-5 h-5 text-primary" />
                        <span>Jadikan Admin</span>
                      </button>
                    )}

                    <button
                      onClick={() => kickMember(selectedParticipant.user_id)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-destructive"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Keluarkan dari Grup</span>
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowMemberMenu(false)}
                    className="w-full mt-4"
                  >
                    Batal
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Info Sheet - Displayed when avatar is clicked */}
          <UserInfoSheet
            isOpen={showUserInfo}
            onClose={() => setShowUserInfo(false)}
            user={userInfoData}
            onChat={(uid) => {
              setShowUserInfo(false);
              onChatWithUser(uid);
              onClose();
            }}
          />

          {/* Group Settings Modal */}
          <GroupSettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            chat={{
              id: chatData.id,
              name: chatData.name,
              description: chatData.description,
              avatar_url: chatData.avatar_url,
              type: chatData.type,
            }}
            onUpdate={refreshChatData}
          />

          {/* Report Chat Modal */}
          <ReportChatModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            chatId={chatData.id}
            chatName={chatData.name || ''}
            chatType={chatData.type}
            userId={userId}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}