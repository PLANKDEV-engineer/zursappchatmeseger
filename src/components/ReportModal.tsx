import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useReporting } from '@/hooks/useReporting';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ReportReason = Database['public']['Enums']['report_reason'];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  userId: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Pesan berulang atau tidak diinginkan' },
  { value: 'sexual', label: 'Konten Seksual', description: 'Konten dewasa atau tidak pantas' },
  { value: 'scam', label: 'Penipuan', description: 'Mencoba menipu atau penipuan finansial' },
  { value: 'illegal', label: 'Konten Ilegal', description: 'Aktivitas atau konten ilegal' },
  { value: 'hack', label: 'Hacking/Cheating', description: 'Upaya peretasan atau eksploitasi' },
  { value: 'other', label: 'Lainnya', description: 'Alasan lain yang tidak tercantum' },
];

export function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  userId,
}: ReportModalProps) {
  const { reportUser, loading } = useReporting(userId);
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({ title: 'Pilih alasan laporan', variant: 'destructive' });
      return;
    }

    const { error } = await reportUser(reportedUserId, selectedReason, description || undefined);

    if (error) {
      toast({ title: 'Gagal mengirim laporan', variant: 'destructive' });
    } else {
      toast({ title: 'Laporan terkirim', description: 'Tim kami akan meninjau laporan Anda' });
      onClose();
      setSelectedReason(null);
      setDescription('');
    }
  };

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
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-display font-bold">Laporkan {reportedUserName}</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                Pilih alasan melaporkan pengguna ini:
              </p>

              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedReason === reason.value
                        ? 'bg-primary/20 border-primary border'
                        : 'bg-muted hover:bg-muted/80 border border-transparent'
                    }`}
                  >
                    <p className="font-medium text-foreground">{reason.label}</p>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Detail tambahan (opsional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan masalah yang Anda alami..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                {loading ? 'Mengirim...' : 'Laporkan'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
