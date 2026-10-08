import { isActuallyOnline } from '@/lib/presence';
import React from 'react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Mail, 
  AtSign, 
  Ban, 
  Flag, 
  Trash2,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    user_id: string;
    name: string;
    phone?: string | null;
    avatar_url?: string | null;
    description?: string | null;
    public_id?: string;
    is_online?: boolean;
    last_seen?: string | null;
  };
  isBlocked: boolean;
  isOfficial?: boolean;
  onCall: () => void;
  onVideoCall: () => void;
  onBlock: () => void;
  onReport: () => void;
  onDeleteChat: () => void;
}

export function ProfileView({
  isOpen,
  onClose,
  profile,
  isBlocked,
  isOfficial,
  onCall,
  onVideoCall,
  onBlock,
  onReport,
  onDeleteChat,
}: ProfileViewProps) {
  const formatLastSeen = (date: string | null | undefined) => {
    if (!date) return 'Tidak diketahui';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed inset-0 bg-background z-50 flex flex-col"
        >
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
            <div className="flex items-center gap-3 p-4">
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-display font-bold">Info Kontak</h1>
            </div>
          </header>

          {/* Profile Content */}
          <main className="flex-1 overflow-y-auto">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center py-8 px-4">
              <div className="relative">
                <Avatar
                  src={profile.avatar_url || undefined}
                  name={profile.name}
                  size="xl"
                  isOnline={isActuallyOnline(profile)}
                  showStatus
                />
                {isOfficial && (
                  <div className="absolute -bottom-1 -right-1">
                    <VerifiedBadge className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {profile.name}
                </h2>
                {isOfficial && (
                  <VerifiedBadge className="w-5 h-5" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {isActuallyOnline(profile) ? (
                  <span className="text-primary">Online</span>
                ) : (
                  `Terakhir dilihat ${formatLastSeen(profile.last_seen)}`
                )}
              </p>

              {profile.description && (
                <p className="text-center text-muted-foreground mt-4 max-w-xs">
                  {profile.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 pb-6">
              <button
                onClick={onCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Panggil</span>
              </button>
              <button
                onClick={onVideoCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Video</span>
              </button>
            </div>

            {/* Info Section */}
            <div className="px-4 space-y-4">
              <div className="bg-card rounded-xl border border-border/50 p-4 space-y-4">
                {/* User ID - menggunakan nomor telepon */}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <AtSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="text-foreground font-mono">
                        {profile.phone.replace(/\D/g, '').slice(-11)}
                      </p>
                    </div>
                  </div>
                )}
                
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p className="text-foreground">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <button
                  onClick={onBlock}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors ${
                    isBlocked ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  <Ban className="w-5 h-5" />
                  <span className="font-medium">
                    {isBlocked ? 'Buka Blokir' : 'Blokir Pengguna'}
                  </span>
                </button>
                
                <div className="h-px bg-border" />
                
                <button
                  onClick={onReport}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-destructive"
                >
                  <Flag className="w-5 h-5" />
                  <span className="font-medium">Laporkan</span>
                </button>
                
                <div className="h-px bg-border" />
                
                <button
                  onClick={onDeleteChat}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Hapus Riwayat Chat</span>
                </button>
              </div>
            </div>

            <div className="h-20" />
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
