import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPromptProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPrompt({ userId, isOpen, onClose }: NotificationPromptProps) {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications(userId);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      onClose();
    }
  };

  const handleDisable = async () => {
    await unsubscribe();
    onClose();
  };

  if (!isSupported) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              {isSubscribed ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
            </h3>
            
            <p className="text-muted-foreground mb-6">
              {isSubscribed 
                ? 'Anda akan menerima notifikasi untuk pesan baru, panggilan, dan aktivitas grup.'
                : 'Dapatkan pemberitahuan saat ada pesan baru, panggilan masuk, atau aktivitas di grup Anda.'}
            </p>

            {permission === 'denied' ? (
              <div className="p-4 bg-destructive/10 rounded-xl mb-4">
                <p className="text-sm text-destructive">
                  Notifikasi diblokir. Silakan ubah izin di pengaturan browser Anda.
                </p>
              </div>
            ) : null}

            <div className="flex gap-3">
              {isSubscribed ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDisable}
                    disabled={loading}
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    Matikan
                  </Button>
                  <Button className="flex-1" onClick={onClose}>
                    Tutup
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Nanti
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleEnable}
                    disabled={loading || permission === 'denied'}
                  >
                    {loading ? 'Memproses...' : 'Aktifkan'}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
