import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Volume2, Vibrate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
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

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
        {/* Push notification info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4"
        >
          <h3 className="font-medium text-foreground mb-1">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {('Notification' in window && Notification.permission === 'granted')
              ? 'Push notifications aktif'
              : 'Izinkan notifikasi untuk menerima pesan baru'}
          </p>
          {('Notification' in window && Notification.permission !== 'granted') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => Notification.requestPermission()}
            >
              Aktifkan Notifikasi
            </Button>
          )}
        </motion.div>

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
