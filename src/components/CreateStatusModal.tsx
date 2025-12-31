import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Image, Video, Camera, Palette, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStatus: (
    type: 'text' | 'image' | 'video',
    content: string,
    options?: {
      caption?: string;
      backgroundColor?: string;
      textColor?: string;
      mediaUrl?: string;
    }
  ) => void;
}

const colorPalette = [
  { bg: '#1a1a2e', text: '#ffffff' },
  { bg: '#16213e', text: '#e94560' },
  { bg: '#0f3460', text: '#00fff5' },
  { bg: '#533483', text: '#ffffff' },
  { bg: '#e94560', text: '#ffffff' },
  { bg: '#00adb5', text: '#222831' },
  { bg: '#ff6b6b', text: '#ffffff' },
  { bg: '#4ecdc4', text: '#1a535c' },
];

export function CreateStatusModal({ isOpen, onClose, onCreateStatus }: CreateStatusModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [type, setType] = useState<'text' | 'image' | 'video'>('text');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast({ title: 'Error', description: 'File harus berupa gambar atau video', variant: 'destructive' });
      return;
    }

    // Max 50MB for video, 10MB for image
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ 
        title: 'Error', 
        description: `File terlalu besar. Maks ${isVideo ? '50MB' : '10MB'}`, 
        variant: 'destructive' 
      });
      return;
    }

    setMediaFile(file);
    setType(isVideo ? 'video' : 'image');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (type === 'text' && !content.trim()) {
      toast({ title: 'Error', description: 'Tulis sesuatu untuk status', variant: 'destructive' });
      return;
    }

    if ((type === 'image' || type === 'video') && !mediaFile) {
      toast({ title: 'Error', description: 'Pilih file media', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl: string | undefined;

      if (mediaFile && user) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      onCreateStatus(type, type === 'text' ? content : '', {
        caption: type !== 'text' ? caption : undefined,
        backgroundColor: type === 'text' ? colorPalette[selectedColor].bg : undefined,
        textColor: type === 'text' ? colorPalette[selectedColor].text : undefined,
        mediaUrl,
      });

      // Reset
      setContent('');
      setCaption('');
      setMediaFile(null);
      setMediaPreview(null);
      setType('text');
      setSelectedColor(0);
    } catch (error) {
      console.error('Error creating status:', error);
      toast({ title: 'Error', description: 'Gagal membuat status', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setCaption('');
    setMediaFile(null);
    setMediaPreview(null);
    setType('text');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background z-50 flex flex-col"
        >
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border/50">
            <Button variant="ghost" size="icon-sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-display font-bold">Buat Status</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? 'Mengunggah...' : 'Bagikan'}
            </Button>
          </header>

          {/* Type Selector */}
          <div className="flex gap-2 p-4 border-b border-border/50">
            <button
              onClick={() => { setType('text'); setMediaFile(null); setMediaPreview(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                type === 'text' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-card-hover'
              }`}
            >
              <Type className="w-5 h-5" />
              <span className="text-sm font-medium">Teks</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                type === 'image' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-card-hover'
              }`}
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Foto</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                type === 'video' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-card-hover'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {type === 'text' ? (
              <div
                className="min-h-full flex flex-col items-center justify-center p-8"
                style={{ backgroundColor: colorPalette[selectedColor].bg }}
              >
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis status kamu..."
                  className="bg-transparent border-none text-center text-2xl font-medium resize-none min-h-[200px] focus-visible:ring-0"
                  style={{ color: colorPalette[selectedColor].text }}
                />
              </div>
            ) : (
              <div className="min-h-full flex flex-col">
                {mediaPreview ? (
                  <div className="flex-1 flex items-center justify-center bg-black p-4">
                    {type === 'image' ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-w-full max-h-[60vh] object-contain rounded-xl"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="max-w-full max-h-[60vh] rounded-xl"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Camera className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-muted-foreground">
                      Pilih foto atau video untuk status
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Pilih File
                    </Button>
                  </div>
                )}

                {mediaPreview && (
                  <div className="p-4 border-t border-border/50">
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Tambahkan caption..."
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Color Palette (for text) */}
          {type === 'text' && (
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <div className="flex gap-2 overflow-x-auto py-1">
                  {colorPalette.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(index)}
                      className={`w-8 h-8 rounded-full flex-shrink-0 transition-all ${
                        selectedColor === index ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{ backgroundColor: color.bg }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
