import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, FileText, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpPageProps {
  onBack: () => void;
}

export function HelpPage({ onBack }: HelpPageProps) {
  const helpItems = [
    {
      icon: MessageCircle,
      label: 'Pusat Bantuan',
      description: 'Temukan jawaban untuk pertanyaan umum',
      action: () => window.open('https://help.zursapp.com', '_blank'),
    },
    {
      icon: Mail,
      label: 'Hubungi Kami',
      description: 'Kirim email ke tim support',
      action: () => window.open('mailto:support@zursapp.com', '_blank'),
    },
    {
      icon: FileText,
      label: 'Kebijakan Privasi',
      description: 'Baca kebijakan privasi kami',
      action: () => window.open('https://zursapp.com/privacy', '_blank'),
    },
    {
      icon: FileText,
      label: 'Syarat & Ketentuan',
      description: 'Baca syarat dan ketentuan layanan',
      action: () => window.open('https://zursapp.com/terms', '_blank'),
    },
  ];

  const faqItems = [
    {
      question: 'Bagaimana cara menghapus akun?',
      answer: 'Buka Pengaturan > Akun > Hapus Akun. Perhatikan bahwa tindakan ini tidak dapat dibatalkan.',
    },
    {
      question: 'Apakah pesan saya aman?',
      answer: 'Ya, semua pesan di ZursApp dilindungi dengan enkripsi end-to-end.',
    },
    {
      question: 'Bagaimana cara memblokir seseorang?',
      answer: 'Buka profil pengguna > ketuk menu titik tiga > pilih Blokir.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Bantuan</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Help Links */}
        <div className="space-y-2">
          {helpItems.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={item.action}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:bg-card-hover transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2">FAQ</h2>
          <div className="space-y-2">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (helpItems.length + index) * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border/50"
              >
                <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
