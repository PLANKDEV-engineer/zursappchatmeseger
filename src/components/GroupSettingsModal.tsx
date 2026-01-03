import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: {
    id: string;
    name: string | null;
    description: string | null;
    avatar_url: string | null;
    type: string;
  };
  onUpdate: () => void;
}

export function GroupSettingsModal({ isOpen, onClose, chat, onUpdate }: GroupSettingsModalProps) {
  const [name, setName] = useState(chat.name || '');
  const [description, setDescription] = useState(chat.description || '');
  const [avatarUrl, setAvatarUrl] = useState(chat.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${chat.id}-${Date.now()}.${fileExt}`;
      const filePath = `chats/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Foto berhasil diupload');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Gagal mengupload foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('chats')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', chat.id);

      if (error) throw error;

      toast.success('Pengaturan berhasil disimpan');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const isChannel = chat.type === 'channel';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-display font-bold">
                Pengaturan {isChannel ? 'Saluran' : 'Grup'}
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar
                    src={avatarUrl || undefined}
                    name={name}
                    size="xl"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Ketuk untuk mengubah foto
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nama {isChannel ? 'Saluran' : 'Grup'}
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={`Masukkan nama ${isChannel ? 'saluran' : 'grup'}`}
                  className="mt-1"
                  maxLength={50}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Deskripsi
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={`Deskripsi ${isChannel ? 'saluran' : 'grup'} (opsional)`}
                  className="mt-1 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/200 karakter
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Simpan
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}