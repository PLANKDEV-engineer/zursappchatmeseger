import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Clock, UserX, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from '@/components/Avatar';

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlockedUsers();
  }, [user?.id]);

  const fetchBlockedUsers = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*, profiles:blocked_id(name, avatar_url)')
        .eq('blocker_id', user.id);
      
      if (error) throw error;
      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Pengguna telah di-unblock' });
      fetchBlockedUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal unblock pengguna', variant: 'destructive' });
    }
  };

  const privacySettings = [
    {
      icon: Clock,
      label: 'Tampilkan Terakhir Dilihat',
      description: 'Izinkan orang lain melihat kapan kamu terakhir online',
      value: showLastSeen,
      onChange: setShowLastSeen,
    },
    {
      icon: Eye,
      label: 'Tampilkan Status Online',
      description: 'Izinkan orang lain melihat saat kamu online',
      value: showOnlineStatus,
      onChange: setShowOnlineStatus,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Privasi</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Privacy Settings */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Pengaturan Privasi</h2>
          {privacySettings.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={item.value}
                onCheckedChange={item.onChange}
              />
            </motion.div>
          ))}
        </div>

        {/* Blocked Users */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-2 flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Pengguna yang Diblokir ({blockedUsers.length})
          </h2>
          
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Memuat...</div>
          ) : blockedUsers.length === 0 ? (
            <div className="p-4 rounded-xl bg-card border border-border/50 text-center text-muted-foreground">
              Tidak ada pengguna yang diblokir
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((blocked) => (
                <motion.div
                  key={blocked.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={blocked.profiles?.avatar_url}
                      name={blocked.profiles?.name}
                      size="md"
                    />
                    <span className="font-medium">{blocked.profiles?.name || 'Unknown'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blocked.blocked_id)}
                  >
                    Unblock
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
