import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  senderName: string;
  userId: string;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Pelecehan' },
  { id: 'hate_speech', label: 'Ujaran Kebencian' },
  { id: 'violence', label: 'Kekerasan' },
  { id: 'scam', label: 'Penipuan' },
  { id: 'inappropriate', label: 'Konten Tidak Pantas' },
  { id: 'other', label: 'Lainnya' },
];

export function ReportMessageModal({
  isOpen,
  onClose,
  messageId,
  messageContent,
  senderName,
  userId,
}: ReportMessageModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Pilih alasan pelaporan');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('message_reports').insert({
        message_id: messageId,
        reporter_id: userId,
        reason: selectedReason,
        description: description || null,
      });

      if (error) throw error;

      toast.success('Pesan berhasil dilaporkan');
      onClose();
      setSelectedReason('');
      setDescription('');
    } catch (error) {
      console.error('Error reporting message:', error);
      toast.error('Gagal melaporkan pesan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border-t sm:border border-border"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-destructive" />
                  <h2 className="text-lg font-display font-bold">Laporkan Pesan</h2>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Message Preview */}
              <div className="p-3 rounded-lg bg-muted mb-4">
                <p className="text-xs text-muted-foreground mb-1">Pesan dari {senderName}:</p>
                <p className="text-sm line-clamp-3">{messageContent}</p>
              </div>

              {/* Reason Selection */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">Alasan Pelaporan</label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        selectedReason === reason.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Deskripsi (Opsional)</label>
                <Textarea
                  placeholder="Jelaskan lebih detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={loading || !selectedReason}
                  className="flex-1"
                >
                  {loading ? 'Mengirim...' : 'Laporkan'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
