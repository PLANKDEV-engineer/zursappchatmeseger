import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Shield, Users, AlertTriangle, Ban, CheckCircle, XCircle, Eye, MessageSquare, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatAdminPanel } from '@/components/ChatAdminPanel';
import { MessageAdminPanel } from '@/components/MessageAdminPanel';

interface AdminPanelProps {
  userId: string;
  onBack: () => void;
}

type Tab = 'users' | 'reports' | 'appeals' | 'chats' | 'messages';

export function AdminPanel({ userId, onBack }: AdminPanelProps) {
  const { isAdmin } = useAuth();
  const { 
    users, 
    reports, 
    appeals, 
    loading,
    fetchUsers, 
    fetchReports, 
    fetchAppeals,
    blockUser,
    unblockUser,
    updateReportStatus,
    handleAppeal,
    updateUserRole
  } = useAdmin(userId, isAdmin);
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState<number | undefined>();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchReports();
      fetchAppeals();
    }
  }, [isAdmin, fetchUsers, fetchReports, fetchAppeals]);

  useEffect(() => {
    if (searchQuery) {
      fetchUsers(searchQuery);
    } else {
      fetchUsers();
    }
  }, [searchQuery, fetchUsers]);

  const handleBlockUser = async () => {
    if (!selectedUserId || !blockReason) return;
    
    const { error } = await blockUser(selectedUserId, blockReason, blockDuration);
    if (error) {
      toast({ title: 'Error', description: 'Gagal memblokir pengguna', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Pengguna telah diblokir' });
      setShowBlockModal(false);
      setSelectedUserId(null);
      setBlockReason('');
      setBlockDuration(undefined);
    }
  };

  const handleUnblock = async (blockId: string) => {
    const { error } = await unblockUser(blockId);
    if (error) {
      toast({ title: 'Error', description: 'Gagal membuka blokir', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Blokir telah dibuka' });
    }
  };

  const handleReportAction = async (reportId: string, status: string) => {
    const { error } = await updateReportStatus(reportId, status);
    if (error) {
      toast({ title: 'Error', description: 'Gagal memperbarui laporan', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Status laporan diperbarui' });
    }
  };

  const handleAppealAction = async (blockId: string, approved: boolean) => {
    const { error } = await handleAppeal(blockId, approved);
    if (error) {
      toast({ title: 'Error', description: 'Gagal memproses banding', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: approved ? 'Banding disetujui' : 'Banding ditolak' });
    }
  };

  const tabs = [
    { id: 'users' as Tab, label: 'Pengguna', icon: Users, count: users.length },
    { id: 'reports' as Tab, label: 'Laporan', icon: AlertTriangle, count: reports.filter(r => r.status === 'pending').length },
    { id: 'appeals' as Tab, label: 'Banding', icon: MessageSquare, count: appeals.length },
    { id: 'chats' as Tab, label: 'Grup/Saluran', icon: Radio, count: 0 },
    { id: 'messages' as Tab, label: 'Pesan', icon: MessageSquare, count: 0 },
  ];

  // If chats tab is selected, render the ChatAdminPanel
  if (activeTab === 'chats') {
    return (
      <ChatAdminPanel
        userId={userId}
        isAdmin={isAdmin}
        onBack={() => setActiveTab('users')}
      />
    );
  }

  // If messages tab is selected, render the MessageAdminPanel
  if (activeTab === 'messages') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon-sm" onClick={() => setActiveTab('users')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-display font-bold">Laporan Pesan</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4">
          <MessageAdminPanel />
        </main>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-bold">Admin Panel</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
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

        {/* Search (for users tab) */}
        {activeTab === 'users' && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-2">
                {users.map(user => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="relative">
                      <Avatar
                        src={user.avatar_url || undefined}
                        name={user.name}
                        size="md"
                        isOnline={user.is_online}
                        showStatus
                      />
                      {user.isBlocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <Ban className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === 'admin' ? 'bg-primary/20 text-primary' :
                          user.role === 'moderator' ? 'bg-accent/20 text-accent' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                      <p className="text-xs text-muted-foreground">Bergabung: {formatDate(user.created_at)}</p>
                    </div>

                    <div className="flex gap-2">
                      {user.isBlocked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => user.blockInfo && handleUnblock(user.blockInfo.id)}
                          className="text-primary border-primary/30"
                        >
                          Buka Blokir
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(user.user_id);
                            setShowBlockModal(true);
                          }}
                          className="text-destructive border-destructive/30"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Blokir
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada pengguna ditemukan
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-2">
                {reports.map(report => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={report.reportedUser?.avatar_url || undefined}
                        name={report.reportedUser?.name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">
                            {report.reportedUser?.name || 'Unknown User'}
                          </h3>
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

                {reports.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada laporan
                  </div>
                )}
              </div>
            )}

            {/* Appeals Tab */}
            {activeTab === 'appeals' && (
              <div className="space-y-2">
                {appeals.map(appeal => (
                  <motion.div
                    key={appeal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          User ID: {appeal.user_id.slice(0, 8)}...
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Alasan blokir:</span> {appeal.reason}
                        </p>
                        {appeal.appeal_message && (
                          <div className="mt-2 p-3 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium mb-1">Pesan banding:</p>
                            <p className="text-sm text-muted-foreground">{appeal.appeal_message}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Diblokir: {formatDate(appeal.blocked_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAppealAction(appeal.id, false)}
                        className="flex-1 text-destructive border-destructive/30"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Tolak
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAppealAction(appeal.id, true)}
                        className="flex-1 text-primary border-primary/30"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Setujui
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {appeals.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada banding
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
              <h2 className="text-xl font-display font-bold mb-4">Blokir Pengguna</h2>
              
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
                  <label className="text-sm font-medium text-foreground">Durasi (jam)</label>
                  <div className="flex gap-2 mt-2">
                    {[24, 168, 720, 8760].map(hours => (
                      <button
                        key={hours}
                        onClick={() => setBlockDuration(hours)}
                        className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                          blockDuration === hours
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {hours === 24 ? '1 Hari' :
                         hours === 168 ? '1 Minggu' :
                         hours === 720 ? '1 Bulan' :
                         '1 Tahun'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setBlockDuration(undefined)}
                    className={`w-full mt-2 py-2 rounded-lg text-sm transition-all ${
                      blockDuration === undefined
                        ? 'bg-destructive text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Permanen
                  </button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBlockModal(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleBlockUser}
                    disabled={!blockReason}
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                  >
                    Blokir
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
