import React, { useState } from 'react';
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
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface SettingsPageProps {
  onEditProfile: () => void;
}

const settingsItems = [
  {
    icon: Bell,
    label: 'Notifications',
    description: 'Message, group & call tones',
  },
  {
    icon: Lock,
    label: 'Privacy',
    description: 'Block contacts, disappearing messages',
  },
  {
    icon: Shield,
    label: 'Security',
    description: 'End-to-end encryption, app lock',
  },
  {
    icon: Palette,
    label: 'Appearance',
    description: 'Theme, wallpaper, chat display',
  },
  {
    icon: HelpCircle,
    label: 'Help',
    description: 'Help center, contact us, privacy policy',
  },
  {
    icon: Info,
    label: 'About',
    description: 'App version, licenses',
  },
];

export function SettingsPage({ onEditProfile }: SettingsPageProps) {
  const { currentUser, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);

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
            src={currentUser?.avatar}
            name={currentUser?.name}
            size="lg"
            showStatus={false}
          />
          <div className="flex-1 text-left">
            <h2 className="font-display font-semibold text-lg text-foreground">
              {currentUser?.name || 'Your Name'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentUser?.description || 'Hey there! I am using ZursApp'}
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
              <h3 className="font-medium text-foreground">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">
                Toggle dark theme
              </p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
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
            onClick={logout}
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
