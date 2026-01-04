import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Volume2, Vibrate, BellRing, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications(user?.id);

  const [messageNotifications, setMessageNotifications] = useState(() => {
    return localStorage.getItem('notif_messages') !== 'false';
  });
  const [groupNotifications, setGroupNotifications] = useState(() => {
    return localStorage.getItem('notif_groups') !== 'false';
  });
  const [callNotifications, setCallNotifications] = useState(() => {
    return localStorage.getItem('notif_calls') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('notif_sound') !== 'false';
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem('notif_vibration') !== 'false';
  });

  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, value.toString());
    setter(value);
    toast.success('Pengaturan disimpan');
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('Push notification dinonaktifkan');
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Push notification diaktifkan');
      } else if (permission === 'denied') {
        toast.error('Notifikasi diblokir. Ubah izin di pengaturan browser.');
      }
    }
  };

  const settingItems = [
    {
      icon: Bell,
      label: 'Notifikasi Pesan',
      description: 'Tampilkan notifikasi untuk pesan baru',
      value: messageNotifications,
      onChange: (v: boolean) => handleToggle('notif_messages', v, setMessageNotifications),
    },
    {
      icon: Bell,
      label: 'Notifikasi Grup',
      description: 'Tampilkan notifikasi untuk pesan grup',
      value: groupNotifications,
      onChange: (v: boolean) => handleToggle('notif_groups', v, setGroupNotifications),
    },
    {
      icon: Bell,
      label: 'Notifikasi Panggilan',
      description: 'Tampilkan notifikasi untuk panggilan masuk',
      value: callNotifications,
      onChange: (v: boolean) => handleToggle('notif_calls', v, setCallNotifications),
    },
    {
      icon: Volume2,
      label: 'Suara Notifikasi',
      description: 'Aktifkan suara untuk notifikasi',
      value: soundEnabled,
      onChange: (v: boolean) => handleToggle('notif_sound', v, setSoundEnabled),
    },
    {
      icon: Vibrate,
      label: 'Getar',
      description: 'Aktifkan getaran untuk notifikasi',
      value: vibrationEnabled,
      onChange: (v: boolean) => handleToggle('notif_vibration', v, setVibrationEnabled),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Notifikasi</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-2">
        {/* Push notification section */}
        {isSupported && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-card border border-border/50 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSubscribed ? 'bg-green-500/20' : 'bg-primary/10'
                }`}>
                  {isSubscribed ? (
                    <BellRing className="w-6 h-6 text-green-500" />
                  ) : (
                    <BellOff className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed 
                      ? 'Aktif - Anda akan menerima notifikasi'
                      : permission === 'denied'
                        ? 'Diblokir - Ubah izin di browser'
                        : 'Nonaktif - Aktifkan untuk menerima notifikasi'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={handlePushToggle}
                disabled={loading || permission === 'denied'}
              />
            </div>
            
            {permission === 'denied' && (
              <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                <p className="text-xs text-destructive">
                  Notifikasi diblokir oleh browser. Buka pengaturan situs dan izinkan notifikasi untuk mengaktifkan fitur ini.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {settingItems.map((item, index) => (
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
      </main>
    </div>
  );
}
