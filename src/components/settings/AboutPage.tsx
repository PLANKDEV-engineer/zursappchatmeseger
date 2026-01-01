import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Heart, Code, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Tentang</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-8"
        >
          <Logo size="lg" showText={false} />
          <h2 className="text-2xl font-display font-bold text-gradient-primary mt-4">ZursApp</h2>
          <p className="text-muted-foreground">Version 1.0.0</p>
        </motion.div>

        {/* Features */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Enkripsi End-to-End</h3>
              <p className="text-sm text-muted-foreground">Semua pesan dan panggilan dilindungi</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Gratis & Tanpa Batas</h3>
              <p className="text-sm text-muted-foreground">Kirim pesan ke seluruh dunia</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
          >
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Dibuat dengan Cinta</h3>
              <p className="text-sm text-muted-foreground">Tim ZursApp Indonesia</p>
            </div>
          </motion.div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground pt-8">
          <p>© 2026 ZursApp. All rights reserved.</p>
          <p className="mt-1">Made in Indonesia 🇮🇩</p>
        </div>
      </main>
    </div>
  );
}
