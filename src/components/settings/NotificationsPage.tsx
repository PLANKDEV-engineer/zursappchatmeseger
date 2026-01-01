import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, BellOff, Volume2, Vibrate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState(true);
  const [callNotifications, setCallNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const settingItems = [
    {
      icon: Bell,
      label: 'Notifikasi Pesan',
      description: 'Tampilkan notifikasi untuk pesan baru',
      value: messageNotifications,
      onChange: setMessageNotifications,
    },
    {
      icon: Bell,
      label: 'Notifikasi Grup',
      description: 'Tampilkan notifikasi untuk pesan grup',
      value: groupNotifications,
      onChange: setGroupNotifications,
    },
    {
      icon: Bell,
      label: 'Notifikasi Panggilan',
      description: 'Tampilkan notifikasi untuk panggilan masuk',
      value: callNotifications,
      onChange: setCallNotifications,
    },
    {
      icon: Volume2,
      label: 'Suara Notifikasi',
      description: 'Aktifkan suara untuk notifikasi',
      value: soundEnabled,
      onChange: setSoundEnabled,
    },
    {
      icon: Vibrate,
      label: 'Getar',
      description: 'Aktifkan getaran untuk notifikasi',
      value: vibrationEnabled,
      onChange: setVibrationEnabled,
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
