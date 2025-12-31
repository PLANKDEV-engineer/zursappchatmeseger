import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && profile) {
      setName(profile.name || '');
      setDescription(profile.description || '');
      setPhone(profile.phone || '');
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [isOpen, profile]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Ukuran file maks 5MB', variant: 'destructive' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile && user) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      const { error } = await updateProfile({
        name: name.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
      });

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Profil berhasil diperbarui' });
      refreshProfile();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Gagal memperbarui profil', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-card rounded-t-3xl border-t border-border overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">Edit Profil</h2>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar
                    src={avatarPreview || profile?.avatar_url || undefined}
                    name={name || profile?.name}
                    size="xl"
                    showStatus={false}
                  />
                  <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                    <Camera className="w-5 h-5 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nama</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deskripsi</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Hey there! I am using ZursApp"
                  rows={3}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nomor Telepon</label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border/50 p-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
