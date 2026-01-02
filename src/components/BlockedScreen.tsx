import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ban, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, type AdminBlock } from '@/context/AuthContext';
import { toast } from 'sonner';

interface BlockedScreenProps {
  blockInfo: AdminBlock;
}

export function BlockedScreen({ blockInfo }: BlockedScreenProps) {
  const { signOut, submitAppeal, refreshProfile } = useAuth();
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAppeal = blockInfo.appeal_status !== 'none' && blockInfo.appeal_message;
  const isPending = blockInfo.appeal_status === 'pending';
  const isApproved = blockInfo.appeal_status === 'approved';
  const isRejected = blockInfo.appeal_status === 'rejected';

  const formatDate = (date: string | null) => {
    if (!date) return 'Permanen';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmitAppeal = async () => {
    if (!appealMessage.trim()) {
      toast.error('Pesan banding tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    const { error } = await submitAppeal(appealMessage.trim());
    
    if (error) {
      toast.error('Gagal mengirim banding');
    } else {
      toast.success('Banding berhasil dikirim');
    }
    setIsSubmitting(false);
  };

  const handleCheckStatus = () => {
    refreshProfile();
    toast.info('Memeriksa status...');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Blocked Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
            <Ban className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-center text-foreground mb-2">
          Akun Diblokir
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Akun Anda telah diblokir karena melanggar aturan ZursApp
        </p>

        {/* Block Info Card */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Alasan</span>
            <span className="text-sm font-medium text-foreground">
              {blockInfo.reason || 'Pelanggaran aturan'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Diblokir pada</span>
            <span className="text-sm font-medium text-foreground">
              {formatDate(blockInfo.blocked_at)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Berakhir</span>
            <span className="text-sm font-medium text-foreground">
              {formatDate(blockInfo.expires_at)}
            </span>
          </div>
        </div>

        {/* Appeal Section */}
        {!hasAppeal ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Ajukan Banding</h3>
            <Textarea
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Jelaskan mengapa Anda merasa blokir ini tidak tepat..."
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleSubmitAppeal}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                'Mengirim...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Banding
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Appeal Status */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                {isPending && (
                  <>
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-500">Banding Sedang Ditinjau</span>
                  </>
                )}
                {isApproved && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-500">Banding Disetujui!</span>
                  </>
                )}
                {isRejected && (
                  <>
                    <XCircle className="w-5 h-5 text-destructive" />
                    <span className="font-medium text-destructive">Banding Ditolak</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Pesan banding: {blockInfo.appeal_message}
              </p>
            </div>

            {isPending && (
              <Button
                onClick={handleCheckStatus}
                variant="outline"
                className="w-full"
              >
                Cek Status Tinjauan
              </Button>
            )}

            {isApproved && (
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verifikasi Ulang
              </Button>
            )}
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="w-full mt-4 text-muted-foreground"
        >
          Keluar
        </Button>
      </motion.div>
    </div>
  );
}