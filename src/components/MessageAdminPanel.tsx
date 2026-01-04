import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Check, X, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface MessageReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  reporter?: {
    name: string;
    avatar_url: string | null;
  };
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

export function MessageAdminPanel() {
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('message_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each report
      const enrichedReports: MessageReport[] = [];
      for (const report of data || []) {
        // Get message
        const { data: message } = await supabase
          .from('messages')
          .select('content, sender_id, created_at')
          .eq('id', report.message_id)
          .single();

        // Get reporter profile
        const { data: reporter } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', report.reporter_id)
          .single();

        // Get sender profile
        let sender = null;
        if (message?.sender_id) {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', message.sender_id)
            .single();
          sender = senderData;
        }

        enrichedReports.push({
          ...report,
          message: message || undefined,
          reporter: reporter || undefined,
          sender: sender || undefined,
        });
      }

      setReports(enrichedReports);
    } catch (error) {
      console.error('Error fetching message reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('message_reports')
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(action === 'resolved' ? 'Laporan ditangani' : 'Laporan dibatalkan');
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      toast.error('Gagal memproses laporan');
    }
  };

  const handleDeleteMessage = async (messageId: string, reportId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_deleted: true, deleted_for_everyone: true })
        .eq('id', messageId);

      await handleResolve(reportId, 'resolved');
      toast.success('Pesan dihapus dan laporan diselesaikan');
    } catch (error) {
      toast.error('Gagal menghapus pesan');
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Pelecehan',
      hate_speech: 'Ujaran Kebencian',
      violence: 'Kekerasan',
      scam: 'Penipuan',
      inappropriate: 'Konten Tidak Pantas',
      other: 'Lainnya',
    };
    return labels[reason] || reason;
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reports */}
      <div>
        <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Laporan Pesan Pending ({pendingReports.length})
        </h3>

        {pendingReports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Tidak ada laporan pesan pending
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={report.sender?.avatar_url || undefined}
                      name={report.sender?.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{report.sender?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        Dilaporkan oleh {report.reporter?.name}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive">
                    {getReasonLabel(report.reason)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-muted mb-3">
                  <p className="text-sm">{report.message?.content || 'Pesan tidak tersedia'}</p>
                </div>

                {report.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Keterangan: {report.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResolve(report.id, 'dismissed')}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Abaikan
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMessage(report.message_id, report.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus Pesan
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Reports */}
      {resolvedReports.length > 0 && (
        <div>
          <h3 className="text-lg font-display font-semibold mb-4">
            Laporan Selesai ({resolvedReports.length})
          </h3>
          <div className="space-y-2">
            {resolvedReports.slice(0, 10).map((report) => (
              <div
                key={report.id}
                className="p-3 rounded-lg bg-muted/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={report.sender?.avatar_url || undefined}
                    name={report.sender?.name}
                    size="xs"
                  />
                  <div>
                    <p className="text-sm font-medium">{report.sender?.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {report.message?.content}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.status === 'resolved' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {report.status === 'resolved' ? 'Ditangani' : 'Diabaikan'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
