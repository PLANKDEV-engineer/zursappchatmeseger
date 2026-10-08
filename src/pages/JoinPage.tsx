import React, { useState, useEffect } from 'react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Radio, ArrowLeft, UserPlus, Check, Loader2, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatInfo {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  type: 'group' | 'channel';
  is_official: boolean;
  followers_count: number;
  memberCount: number;
  isBlocked: boolean;
}

export default function JoinPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setError('Link tidak valid');
      setLoading(false);
      return;
    }

    fetchChatInfo();
  }, [chatId, user]);

  const fetchChatInfo = async () => {
    if (!chatId) return;
    
    try {
      // First try to find by exact ID
      let { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .maybeSingle();

      // If not found by ID, try by invite_link
      if (!chat) {
        const { data: chatByLink } = await supabase
          .from('chats')
          .select('*')
          .ilike('invite_link', `%${chatId}%`)
          .maybeSingle();
        
        chat = chatByLink;
      }

      if (!chat) {
        setError('Grup atau saluran tidak ditemukan');
        setLoading(false);
        return;
      }

      // Check if chat is blocked
      const { data: blockData } = await supabase
        .from('chat_blocks')
        .select('*')
        .eq('chat_id', chat.id)
        .eq('status', 'active')
        .maybeSingle();

      const isBlocked = !!blockData;

      // Get member count
      const { count } = await supabase
        .from('chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id);

      setChatInfo({
        id: chat.id,
        name: chat.name || 'Unknown',
        description: chat.description,
        avatar_url: chat.avatar_url,
        type: chat.type as 'group' | 'channel',
        is_official: chat.is_official || false,
        followers_count: chat.followers_count || 0,
        memberCount: count || 0,
        isBlocked,
      });

      // Check if user is already a member
      if (user) {
        const { data: participant } = await supabase
          .from('chat_participants')
          .select('id')
          .eq('chat_id', chat.id)
          .eq('user_id', user.id)
          .single();

        setAlreadyMember(!!participant);
      }
    } catch (err) {
      console.error('Error fetching chat info:', err);
      setError('Gagal memuat informasi');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !chatInfo || !profile) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    setJoining(true);

    try {
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatInfo.id,
          user_id: user.id,
          is_admin: false,
          is_owner: false,
        });

      if (error) throw error;

      // Update followers count for channels
      if (chatInfo.type === 'channel') {
        await supabase
          .from('chats')
          .update({ followers_count: (chatInfo.followers_count || 0) + 1 })
          .eq('id', chatInfo.id);
      }

      // Send system message for group join
      if (chatInfo.type === 'group') {
        await supabase
          .from('messages')
          .insert({
            chat_id: chatInfo.id,
            sender_id: user.id,
            content: `${profile.name} telah bergabung ke grup menggunakan link tautan`,
            type: 'text',
          });
      }

      toast.success(
        chatInfo.type === 'channel' 
          ? 'Berhasil mengikuti saluran!' 
          : 'Berhasil bergabung ke grup!'
      );
      
      navigate('/');
    } catch (err) {
      console.error('Error joining:', err);
      toast.error('Gagal bergabung');
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-xl font-display font-bold text-foreground mb-2">{error}</h1>
        <p className="text-muted-foreground text-center mb-6">
          Link yang Anda akses tidak valid atau sudah tidak berlaku
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  if (!chatInfo) return null;

  // Show blocked chat view
  if (chatInfo.isBlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Avatar
                src={chatInfo.avatar_url || undefined}
                name={chatInfo.name}
                size="xl"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                <Ban className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-xl font-display font-bold text-foreground mb-2">
            {chatInfo.name}
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-destructive mb-6">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">
              {chatInfo.type === 'channel' ? 'Saluran tidak tersedia lagi' : 'Grup sudah tidak tersedia'}
            </span>
          </div>

          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <Avatar
            src={chatInfo.avatar_url || undefined}
            name={chatInfo.name}
            size="xl"
          />
        </div>

        {/* Info */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {chatInfo.name}
            </h1>
            {chatInfo.is_official && (
              <Check className="w-5 h-5 text-primary" />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-primary mb-3">
            {chatInfo.type === 'channel' ? (
              <>
                <Radio className="w-4 h-4" />
                <span>Saluran • {chatInfo.followers_count.toLocaleString()} pengikut</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Grup • {chatInfo.memberCount} anggota</span>
              </>
            )}
          </div>

          {chatInfo.description && (
            <p className="text-muted-foreground text-sm">
              {chatInfo.description}
            </p>
          )}
        </div>

        {/* Actions */}
        {!user ? (
          <div className="space-y-3">
            <p className="text-center text-muted-foreground text-sm mb-4">
              Login untuk {chatInfo.type === 'channel' ? 'mengikuti saluran' : 'bergabung ke grup'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Login / Daftar
            </Button>
          </div>
        ) : alreadyMember ? (
          <div className="space-y-3">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Check className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-foreground">
                Anda sudah {chatInfo.type === 'channel' ? 'mengikuti saluran ini' : 'anggota grup ini'}
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Buka Chat
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {chatInfo.type === 'channel' ? 'Ikuti' : 'Gabung'}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}