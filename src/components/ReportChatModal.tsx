import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  chatType: string;
  userId: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Konten Tidak Pantas' },
  { value: 'harassment', label: 'Pelecehan' },
  { value: 'scam', label: 'Penipuan' },
  { value: 'violence', label: 'Kekerasan' },
  { value: 'other', label: 'Lainnya' },
];

export function ReportChatModal({
  isOpen,
  onClose,
  chatId,
  chatName,
  chatType,
  userId,
}: ReportChatModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Pilih alasan laporan');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('chat_reports').insert({
        chat_id: chatId,
        reporter_id: userId,
        reason: selectedReason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success('Laporan berhasil dikirim');
      onClose();
      setSelectedReason('');
      setDescription('');
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.error('Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
    }
  };

  const isChannel = chatType === 'channel';

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
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-display font-bold">
                  Laporkan {isChannel ? 'Saluran' : 'Grup'}
                </h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Laporkan <span className="font-medium text-foreground">{chatName}</span> jika melanggar aturan komunitas
              </p>

              {/* Reason Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Alasan Laporan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_REASONS.map(reason => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`p-3 rounded-xl text-left text-sm transition-all ${
                        selectedReason === reason.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Deskripsi (opsional)
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Jelaskan lebih detail tentang laporan Anda..."
                  className="mt-1 resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedReason}
                variant="destructive"
                className="flex-1"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Laporkan
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}