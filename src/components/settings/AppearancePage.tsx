import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Palette, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface AppearancePageProps {
  onBack: () => void;
}

const themes = [
  { id: 'dark', name: 'Gelap', icon: Moon, color: 'from-slate-700 to-slate-900' },
  { id: 'light', name: 'Terang', icon: Sun, color: 'from-slate-100 to-slate-300' },
  { id: 'cyber', name: 'Cyber', icon: Palette, color: 'from-cyan-500 to-blue-600' },
  { id: 'neon', name: 'Neon', icon: Palette, color: 'from-pink-500 to-purple-600' },
];

const wallpapers = [
  { id: 'default', name: 'Default', color: 'bg-background' },
  { id: 'gradient1', name: 'Gradient 1', color: 'bg-gradient-to-br from-primary/20 to-accent/20' },
  { id: 'gradient2', name: 'Gradient 2', color: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' },
  { id: 'pattern', name: 'Pattern', color: 'tech-grid bg-background' },
];

export function AppearancePage({ onBack }: AppearancePageProps) {
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  const [largeFont, setLargeFont] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Tampilan</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Themes */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Tema</h2>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${theme.color} mb-3`} />
                <span className="text-sm font-medium">{theme.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Wallpapers */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Wallpaper Chat
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {wallpapers.map((wp) => (
              <motion.button
                key={wp.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedWallpaper(wp.id)}
                className={`aspect-square rounded-xl border-2 transition-all ${wp.color} ${
                  selectedWallpaper === wp.id
                    ? 'border-primary'
                    : 'border-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Font Size */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
        >
          <div>
            <h3 className="font-medium text-foreground">Font Besar</h3>
            <p className="text-sm text-muted-foreground">Gunakan ukuran font yang lebih besar</p>
          </div>
          <Switch
            checked={largeFont}
            onCheckedChange={setLargeFont}
          />
        </motion.div>
      </main>
    </div>
  );
}
