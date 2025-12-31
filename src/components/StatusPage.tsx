import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import type { StatusType } from '@/hooks/useStatuses';
import type { Profile } from '@/context/AuthContext';

interface UserStatuses {
  userId: string;
  userName: string;
  userAvatar: string | null;
  statuses: StatusType[];
  hasUnviewed: boolean;
}

interface StatusPageProps {
  myStatuses: StatusType[];
  contactStatuses: UserStatuses[];
  profile: Profile | null;
  onViewStatus: (statuses: StatusType[]) => void;
  onCreateStatus: () => void;
}

export function StatusPage({ 
  myStatuses, 
  contactStatuses, 
  profile,
  onViewStatus, 
  onCreateStatus 
}: StatusPageProps) {
  const formatTime = (date: string) => {
    const now = new Date();
    const statusDate = new Date(date);
    const diff = now.getTime() - statusDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) return `${hours}j lalu`;
    if (minutes > 0) return `${minutes}m lalu`;
    return 'Baru saja';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <h1 className="text-2xl font-display font-bold text-gradient-primary">
          Status
        </h1>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* My Status */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Status Saya
          </h2>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={myStatuses.length > 0 ? () => onViewStatus(myStatuses) : onCreateStatus}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-card-hover transition-all"
          >
            <div className="relative">
              <div className={`p-0.5 rounded-full ${myStatuses.length > 0 ? 'bg-gradient-to-br from-primary to-accent' : ''}`}>
                <div className="bg-background rounded-full p-0.5">
                  <Avatar 
                    src={profile?.avatar_url || undefined} 
                    name={profile?.name || 'You'} 
                    size="lg" 
                    showStatus={false} 
                  />
                </div>
              </div>
              {myStatuses.length === 0 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="text-left">
              <h3 className="font-display font-semibold text-foreground">
                {myStatuses.length > 0 ? 'Status Saya' : 'Tambah Status'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {myStatuses.length > 0
                  ? `${myStatuses.length} update • ${formatTime(myStatuses[0].created_at)}`
                  : 'Tap untuk menambah status'}
              </p>
            </div>
          </motion.button>
        </section>

        {/* Recent Updates */}
        {contactStatuses.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Update Terbaru
            </h2>
            <div className="space-y-2">
              {contactStatuses.map((userStatus, index) => (
                <motion.button
                  key={userStatus.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onViewStatus(userStatus.statuses)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-card transition-all"
                >
                  <div
                    className={`relative p-0.5 rounded-full ${
                      userStatus.hasUnviewed
                        ? 'bg-gradient-to-br from-primary to-accent'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="bg-background rounded-full p-0.5">
                      <Avatar
                        src={userStatus.userAvatar || undefined}
                        name={userStatus.userName}
                        size="md"
                        showStatus={false}
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-display font-semibold text-foreground">
                      {userStatus.userName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(userStatus.statuses[0]?.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">{userStatus.statuses.length}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {contactStatuses.length === 0 && myStatuses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <Eye className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              Belum Ada Status
            </h2>
            <p className="text-muted-foreground">
              Status dari kontak akan muncul di sini
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
