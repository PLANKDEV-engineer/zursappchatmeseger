import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Key, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface SecurityPageProps {
  onBack: () => void;
}

export function SecurityPage({ onBack }: SecurityPageProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [appLockEnabled, setAppLockEnabled] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);

  const securityItems = [
    {
      icon: Key,
      label: 'Verifikasi 2 Langkah',
      description: 'Tambahkan lapisan keamanan ekstra dengan PIN',
      value: twoFactorEnabled,
      onChange: setTwoFactorEnabled,
    },
    {
      icon: Lock,
      label: 'Kunci Aplikasi',
      description: 'Kunci aplikasi dengan PIN atau pola',
      value: appLockEnabled,
      onChange: setAppLockEnabled,
    },
    {
      icon: Fingerprint,
      label: 'Biometrik',
      description: 'Buka kunci dengan sidik jari atau wajah',
      value: biometricEnabled,
      onChange: setBiometricEnabled,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Keamanan</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* E2E Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">Enkripsi End-to-End</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Semua pesan dan panggilan di ZursApp dilindungi dengan enkripsi end-to-end. 
                Hanya kamu dan penerima yang dapat membaca atau mendengarnya.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <div className="space-y-2">
          {securityItems.map((item, index) => (
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
      </main>
    </div>
  );
}
