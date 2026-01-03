import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Radio, 
  Users, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { useChatAdmin } from '@/hooks/useChatAdmin';
import { useToast } from '@/hooks/use-toast';

interface ChatAdminPanelProps {
  userId: string;
  isAdmin: boolean;
  onBack: () => void;
}

type Tab = 'reports' | 'blocked';

const DURATION_OPTIONS = [
  { label: '1 Jam', hours: 1 },
  { label: '1 Minggu', hours: 168 },
  { label: '1 Bulan', hours: 720 },
  { label: '1 Tahun', hours: 8760 },
  { label: 'Permanen', hours: undefined },
];

export function ChatAdminPanel({ userId, isAdmin, onBack }: ChatAdminPanelProps) {
  const {
    chatReports,
    chatBlocks,
    loading,
    fetchChatReports,
    fetchChatBlocks,
    blockChat,
    unblockChat,
    updateChatReportStatus,
  } = useChatAdmin(userId, isAdmin);

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatName, setSelectedChatName] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState<number | undefined>();

  useEffect(() => {
    if (isAdmin) {
      fetchChatReports();
      fetchChatBlocks();
    }
  }, [isAdmin, fetchChatReports, fetchChatBlocks]);

  const handleBlockChat = async () => {
    if (!selectedChatId || !blockReason) return;

    const { error } = await blockChat(selectedChatId, blockReason, blockDuration);
    if (error) {
      toast({ title: 'Error', description: 'Gagal memblokir', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Grup/Saluran telah diblokir' });
      setShowBlockModal(false);
      setSelectedChatId(null);
      setBlockReason('');
      setBlockDuration(undefined);
    }
  };

  const handleUnblock = async (blockId: string) => {
    const { error } = await unblockChat(blockId);
    if (error) {
      toast({ title: 'Error', description: 'Gagal membuka blokir', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Blokir telah dibuka' });
    }
  };

  const handleReportAction = async (reportId: string, status: string) => {
    const { error } = await updateChatReportStatus(reportId, status);
    if (error) {
      toast({ title: 'Error', description: 'Gagal memperbarui status', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Status laporan diperbarui' });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'reports' as Tab, label: 'Laporan', icon: AlertTriangle, count: chatReports.filter(r => r.status === 'pending').length },
    { id: 'blocked' as Tab, label: 'Diblokir', icon: Ban, count: chatBlocks.filter(b => b.status === 'active').length },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-bold">Moderasi Grup & Saluran</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-card-hover'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-primary/20 text-primary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-3">
                {chatReports.map(report => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={report.chat?.avatar_url || undefined}
                        name={report.chat?.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">
                              {report.chat?.name || 'Unknown'}
                            </h3>
                            {report.chat?.type === 'channel' ? (
                              <Radio className="w-4 h-4 text-primary" />
                            ) : (
                              <Users className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            report.status === 'reviewed' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Dilaporkan oleh: {report.reporter?.name || 'Unknown'}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Alasan:</span> {report.reason}
                        </p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReportAction(report.id, 'reviewed')}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Tinjau
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChatId(report.chat_id);
                            setSelectedChatName(report.chat?.name || '');
                            setShowBlockModal(true);
                          }}
                          className="flex-1 text-destructive border-destructive/30"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Blokir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReportAction(report.id, 'resolved')}
                          className="flex-1 text-primary border-primary/30"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Selesai
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}

                {chatReports.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada laporan grup/saluran
                  </div>
                )}
              </div>
            )}

            {/* Blocked Tab */}
            {activeTab === 'blocked' && (
              <div className="space-y-3">
                {chatBlocks.map(block => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar
                          src={block.chat?.avatar_url || undefined}
                          name={block.chat?.name}
                          size="md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <Ban className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">
                            {block.chat?.name || 'Unknown'}
                          </h3>
                          {block.chat?.type === 'channel' ? (
                            <Radio className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Users className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            block.status === 'active' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                          }`}>
                            {block.status === 'active' ? 'Diblokir' : 'Dibuka'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Alasan:</span> {block.reason}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3" />
                          <span>Diblokir: {formatDate(block.blocked_at)}</span>
                        </div>
                        {block.expires_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Berakhir: {formatDate(block.expires_at)}
                          </p>
                        )}
                        {!block.expires_at && block.status === 'active' && (
                          <p className="text-xs text-destructive mt-1">Permanen</p>
                        )}
                      </div>
                    </div>

                    {block.status === 'active' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblock(block.id)}
                          className="w-full text-primary border-primary/30"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Buka Blokir
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}

                {chatBlocks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada grup/saluran yang diblokir
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Block Modal */}
      <AnimatePresence>
        {showBlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBlockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-xl border border-border p-6"
            >
              <h2 className="text-xl font-display font-bold mb-2">Blokir Grup/Saluran</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedChatName}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Alasan</label>
                  <Input
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Masukkan alasan pemblokiran"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Durasi</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setBlockDuration(opt.hours)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          blockDuration === opt.hours
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleBlockChat}
                  disabled={!blockReason}
                  variant="destructive"
                  className="flex-1"
                >
                  Blokir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}