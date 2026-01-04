import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Palette, Image, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { WallpaperSettingsPage } from './WallpaperSettingsPage';

interface AppearancePageProps {
  onBack: () => void;
}

const themes = [
  { id: 'dark', name: 'Gelap', icon: Moon, color: 'from-slate-700 to-slate-900' },
  { id: 'light', name: 'Terang', icon: Sun, color: 'from-slate-100 to-slate-300' },
  { id: 'cyber', name: 'Cyber', icon: Palette, color: 'from-cyan-500 to-blue-600' },
  { id: 'neon', name: 'Neon', icon: Palette, color: 'from-pink-500 to-purple-600' },
];

export function AppearancePage({ onBack }: AppearancePageProps) {
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'dark';
  });
  const [largeFont, setLargeFont] = useState(() => {
    return localStorage.getItem('large_font') === 'true';
  });
  const [showWallpaperSettings, setShowWallpaperSettings] = useState(false);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('app_theme', themeId);
    
    // Apply theme
    if (themeId === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    
    toast.success(`Tema ${themes.find(t => t.id === themeId)?.name} diterapkan`);
  };

  const handleFontToggle = (value: boolean) => {
    setLargeFont(value);
    localStorage.setItem('large_font', value.toString());
    
    if (value) {
      document.documentElement.classList.add('large-font');
    } else {
      document.documentElement.classList.remove('large-font');
    }
    
    toast.success(value ? 'Font besar diaktifkan' : 'Font normal');
  };

  // Apply saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    
    const savedFont = localStorage.getItem('large_font') === 'true';
    if (savedFont) {
      document.documentElement.classList.add('large-font');
    }
  }, []);

  if (showWallpaperSettings) {
    return <WallpaperSettingsPage onBack={() => setShowWallpaperSettings(false)} />;
  }

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
                onClick={() => handleThemeChange(theme.id)}
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

        {/* Wallpaper Settings */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowWallpaperSettings(true)}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-card-hover transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-medium text-foreground">Wallpaper Chat</h3>
            <p className="text-sm text-muted-foreground">Atur gambar latar belakang chat</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

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
            onCheckedChange={handleFontToggle}
          />
        </motion.div>
      </main>
    </div>
  );
}
