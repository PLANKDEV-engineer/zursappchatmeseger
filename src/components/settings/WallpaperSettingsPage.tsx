import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image, Upload, Check, X, Crop, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface WallpaperSettingsPageProps {
  onBack: () => void;
}

interface ChatOption {
  id: string;
  name: string;
  avatar_url: string | null;
  type: string;
}

const recommendedWallpapers = [
  { id: 'default', name: 'Default', preview: 'bg-background' },
  { id: 'gradient1', name: 'Ocean', preview: 'bg-gradient-to-br from-blue-900 to-cyan-700' },
  { id: 'gradient2', name: 'Sunset', preview: 'bg-gradient-to-br from-orange-600 to-pink-600' },
  { id: 'gradient3', name: 'Forest', preview: 'bg-gradient-to-br from-green-900 to-emerald-600' },
  { id: 'gradient4', name: 'Galaxy', preview: 'bg-gradient-to-br from-purple-900 to-indigo-600' },
  { id: 'gradient5', name: 'Night', preview: 'bg-gradient-to-br from-slate-900 to-slate-700' },
  { id: 'gradient6', name: 'Cyber', preview: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  { id: 'pattern1', name: 'Tech Grid', preview: 'tech-grid bg-background' },
];

export function WallpaperSettingsPage({ onBack }: WallpaperSettingsPageProps) {
  const { user } = useAuth();
  const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [showApplyOptions, setShowApplyOptions] = useState(false);
  const [chats, setChats] = useState<ChatOption[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [applyToAll, setApplyToAll] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load current wallpaper settings
    const savedWallpapers = localStorage.getItem('chat_wallpapers');
    const globalWallpaper = localStorage.getItem('global_chat_wallpaper');
    if (globalWallpaper) {
      setSelectedWallpaper(globalWallpaper);
    }
  }, []);

  useEffect(() => {
    // Fetch user's chats
    const fetchChats = async () => {
      if (!user?.id) return;
      
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);
      
      if (participants) {
        const chatIds = participants.map(p => p.chat_id);
        const { data: chatData } = await supabase
          .from('chats')
          .select('id, name, avatar_url, type')
          .in('id', chatIds);
        
        if (chatData) {
          // For private chats, get the other user's name
          const enrichedChats = await Promise.all(chatData.map(async (chat) => {
            if (chat.type === 'private') {
              const { data: otherParticipant } = await supabase
                .from('chat_participants')
                .select('user_id')
                .eq('chat_id', chat.id)
                .neq('user_id', user.id)
                .single();
              
              if (otherParticipant) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name, avatar_url')
                  .eq('user_id', otherParticipant.user_id)
                  .single();
                
                if (profile) {
                  return { ...chat, name: profile.name, avatar_url: profile.avatar_url };
                }
              }
            }
            return chat;
          }));
          
          setChats(enrichedChats.filter(c => c.name) as ChatOption[]);
        }
      }
    };
    
    fetchChats();
  }, [user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
        setSelectedWallpaper(null);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWallpaperSelect = (wpId: string) => {
    setSelectedWallpaper(wpId);
    setCustomImage(null);
    setCropMode(false);
  };

  const handleSave = () => {
    if (!selectedWallpaper && !customImage) {
      toast.error('Pilih wallpaper terlebih dahulu');
      return;
    }
    setCropMode(false);
    setShowApplyOptions(true);
  };

  const handleApply = () => {
    const wallpaperValue = customImage || selectedWallpaper;
    
    if (applyToAll) {
      // Apply to all chats
      localStorage.setItem('global_chat_wallpaper', wallpaperValue || 'default');
      localStorage.removeItem('chat_wallpapers');
      toast.success('Wallpaper diterapkan ke semua chat');
    } else {
      // Apply to selected chats only
      const existingWallpapers = JSON.parse(localStorage.getItem('chat_wallpapers') || '{}');
      selectedChats.forEach(chatId => {
        existingWallpapers[chatId] = wallpaperValue;
      });
      localStorage.setItem('chat_wallpapers', JSON.stringify(existingWallpapers));
      toast.success(`Wallpaper diterapkan ke ${selectedChats.length} chat`);
    }
    
    setShowApplyOptions(false);
    onBack();
  };

  const handleChatToggle = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const resetCrop = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Wallpaper Chat</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 pb-24">
        {/* Preview */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Pratinjau</h2>
          <div 
            className={`relative h-48 rounded-xl overflow-hidden border border-border ${
              customImage ? '' : (
                recommendedWallpapers.find(w => w.id === selectedWallpaper)?.preview || 'bg-background'
              )
            }`}
            style={customImage ? { 
              backgroundImage: `url(${customImage})`,
              backgroundSize: `${scale * 100}%`,
              backgroundPosition: `${50 + position.x}% ${50 + position.y}%`
            } : undefined}
          >
            {/* Sample chat bubbles */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end gap-2">
              <div className="self-start max-w-[70%] p-3 bg-card border border-border/50 rounded-2xl rounded-tl-sm">
                <p className="text-xs">Halo, apa kabar?</p>
              </div>
              <div className="self-end max-w-[70%] p-3 bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground rounded-2xl rounded-tr-sm">
                <p className="text-xs">Baik! Kamu gimana?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crop controls for custom image */}
        {customImage && cropMode && (
          <div className="space-y-3 p-4 bg-card rounded-xl border border-border">
            <h3 className="text-sm font-medium">Atur Wallpaper</h3>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetCrop}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Upload from gallery */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Dari Galeri</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full h-20 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload dari Galeri</span>
            </div>
          </Button>
        </div>

        {/* Recommended wallpapers */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Rekomendasi</h2>
          <div className="grid grid-cols-4 gap-2">
            {recommendedWallpapers.map((wp) => (
              <motion.button
                key={wp.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWallpaperSelect(wp.id)}
                className={`aspect-square rounded-xl border-2 transition-all ${wp.preview} ${
                  selectedWallpaper === wp.id
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border'
                }`}
              >
                {selectedWallpaper === wp.id && (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 rounded-xl">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" disabled={!selectedWallpaper && !customImage}>
          <Save className="w-4 h-4 mr-2" />
          Simpan & Pasang
        </Button>
      </main>

      {/* Apply options modal */}
      <AnimatePresence>
        {showApplyOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
            onClick={() => setShowApplyOptions(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-background rounded-t-2xl p-6 space-y-4 max-h-[80vh] overflow-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold">Pasang Wallpaper</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowApplyOptions(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Apply to all option */}
              <button
                onClick={() => {
                  setApplyToAll(true);
                  setSelectedChats([]);
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  applyToAll ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Pasang ke Semua Chat</h3>
                    <p className="text-sm text-muted-foreground">Terapkan wallpaper ini ke semua percakapan</p>
                  </div>
                </div>
              </button>

              {/* Select specific chats */}
              <div className="space-y-2">
                <button
                  onClick={() => setApplyToAll(false)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    !applyToAll ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <h3 className="font-medium">Pilih Chat Tertentu</h3>
                  <p className="text-sm text-muted-foreground">Terapkan hanya ke chat yang dipilih</p>
                </button>

                {!applyToAll && (
                  <div className="max-h-48 overflow-y-auto space-y-1 mt-3">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleChatToggle(chat.id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                          selectedChats.includes(chat.id) ? 'bg-primary/20' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs text-white font-medium">
                          {chat.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-left text-sm">{chat.name || 'Chat'}</span>
                        {selectedChats.includes(chat.id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleApply} 
                className="w-full"
                disabled={!applyToAll && selectedChats.length === 0}
              >
                Pasang Wallpaper
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}