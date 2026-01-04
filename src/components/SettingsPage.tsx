import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Palette,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Moon,
  Shield,
  Archive,
  Star,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { NotificationsPage } from '@/components/settings/NotificationsPage';
import { PrivacyPage } from '@/components/settings/PrivacyPage';
import { SecurityPage } from '@/components/settings/SecurityPage';
import { AppearancePage } from '@/components/settings/AppearancePage';
import { HelpPage } from '@/components/settings/HelpPage';
import { AboutPage } from '@/components/settings/AboutPage';
import { ArchivedChatsPage } from '@/components/ArchivedChatsPage';
import { StarredMessagesPage } from '@/components/StarredMessagesPage';

interface SettingsPageProps {
  onEditProfile: () => void;
  initialView?: SettingsView;
}

type SettingsView =
  | 'main'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'appearance'
  | 'help'
  | 'about'
  | 'archived'
  | 'starred';

const settingsItems = [
  {
    icon: Archive,
    label: 'Chat Diarsipkan',
    description: 'Lihat chat yang telah diarsipkan',
    view: 'archived' as SettingsView,
  },
  {
    icon: Star,
    label: 'Pesan Berbintang',
    description: 'Lihat pesan yang ditandai bintang',
    view: 'starred' as SettingsView,
  },
  {
    icon: Bell,
    label: 'Notifikasi',
    description: 'Nada pesan, grup & panggilan',
    view: 'notifications' as SettingsView,
  },
  {
    icon: Lock,
    label: 'Privasi',
    description: 'Blokir kontak, pesan sementara',
    view: 'privacy' as SettingsView,
  },
  {
    icon: Shield,
    label: 'Keamanan',
    description: 'Enkripsi, kunci aplikasi',
    view: 'security' as SettingsView,
  },
  {
    icon: Palette,
    label: 'Tampilan',
    description: 'Tema, wallpaper, tampilan chat',
    view: 'appearance' as SettingsView,
  },
  {
    icon: HelpCircle,
    label: 'Bantuan',
    description: 'Pusat bantuan, hubungi kami',
    view: 'help' as SettingsView,
  },
  {
    icon: Info,
    label: 'Tentang',
    description: 'Versi aplikasi, lisensi',
    view: 'about' as SettingsView,
  },
];

export function SettingsPage({ onEditProfile, initialView }: SettingsPageProps) {
  const { profile, signOut, user } = useAuth();
  const [currentView, setCurrentView] = useState<SettingsView>(initialView ?? 'main');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    return saved !== 'light';
  });

  useEffect(() => {
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      setIsDarkMode(true);
    }
  }, []);

  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleBack = () => setCurrentView('main');

  // Render sub-pages
  if (currentView === 'notifications') {
    return <NotificationsPage onBack={handleBack} />;
  }
  if (currentView === 'privacy') {
    return <PrivacyPage onBack={handleBack} />;
  }
  if (currentView === 'security') {
    return <SecurityPage onBack={handleBack} />;
  }
  if (currentView === 'appearance') {
    return <AppearancePage onBack={handleBack} />;
  }
  if (currentView === 'help') {
    return <HelpPage onBack={handleBack} />;
  }
  if (currentView === 'about') {
    return <AboutPage onBack={handleBack} />;
  }
  if (currentView === 'archived') {
    return <ArchivedChatsPage userId={user?.id || ''} onBack={handleBack} onChatSelect={() => {}} />;
  }
  if (currentView === 'starred') {
    return <StarredMessagesPage userId={user?.id || ''} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <h1 className="text-2xl font-display font-bold text-gradient-primary">
          Settings
        </h1>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Profile Section */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onEditProfile}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-card-hover transition-all"
        >
          <Avatar
            src={profile?.avatar_url || undefined}
            name={profile?.name}
            size="lg"
            showStatus={false}
          />
          <div className="flex-1 text-left">
            <h2 className="font-display font-semibold text-lg text-foreground">
              {profile?.name || 'Your Name'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile?.description || 'Hey there! I am using ZursApp'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Settings Items */}
        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setCurrentView(item.view)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-card transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground">{item.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}

          {/* Dark Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-card transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-foreground">Mode Gelap</h3>
              <p className="text-sm text-muted-foreground">
                Aktifkan tema gelap
              </p>
            </div>
            <button
              onClick={handleToggleDarkMode}
              className={`w-12 h-7 rounded-full transition-colors ${
                isDarkMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <motion.div
                animate={{ x: isDarkMode ? 22 : 2 }}
                className="w-5 h-5 rounded-full bg-white shadow-md"
              />
            </button>
          </motion.div>
        </div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>
        </motion.div>

        {/* Version */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>ZursApp v1.0.0</p>
          <p className="mt-1">End-to-end encrypted</p>
        </div>
      </main>
    </div>
  );
}
