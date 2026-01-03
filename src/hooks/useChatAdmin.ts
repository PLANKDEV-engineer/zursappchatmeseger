import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatReport {
  id: string;
  chat_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  chat?: {
    name: string;
    type: string;
    avatar_url: string | null;
  };
  reporter?: {
    name: string;
    avatar_url: string | null;
  };
}

interface ChatBlock {
  id: string;
  chat_id: string;
  reason: string;
  status: string;
  duration_hours: number | null;
  blocked_at: string;
  expires_at: string | null;
  chat?: {
    name: string;
    type: string;
    avatar_url: string | null;
  };
}

export function useChatAdmin(userId: string | undefined, isAdmin: boolean) {
  const [chatReports, setChatReports] = useState<ChatReport[]>([]);
  const [chatBlocks, setChatBlocks] = useState<ChatBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChatReports = useCallback(async (status?: string) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      let query = supabase
        .from('chat_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch chat and reporter info
      const reportsWithDetails: ChatReport[] = [];
      for (const report of data || []) {
        const { data: chat } = await supabase
          .from('chats')
          .select('name, type, avatar_url')
          .eq('id', report.chat_id)
          .single();

        const { data: reporter } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', report.reporter_id)
          .single();

        reportsWithDetails.push({
          ...report,
          chat: chat || undefined,
          reporter: reporter || undefined,
        });
      }

      setChatReports(reportsWithDetails);
    } catch (err) {
      console.error('Error fetching chat reports:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchChatBlocks = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_blocks')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      // Fetch chat info
      const blocksWithDetails: ChatBlock[] = [];
      for (const block of data || []) {
        const { data: chat } = await supabase
          .from('chats')
          .select('name, type, avatar_url')
          .eq('id', block.chat_id)
          .single();

        blocksWithDetails.push({
          ...block,
          chat: chat || undefined,
        });
      }

      setChatBlocks(blocksWithDetails);
    } catch (err) {
      console.error('Error fetching chat blocks:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const blockChat = useCallback(async (
    chatId: string,
    reason: string,
    durationHours?: number
  ) => {
    if (!userId || !isAdmin) return { error: new Error('Not authorized') };

    try {
      const expiresAt = durationHours
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('chat_blocks').insert({
        chat_id: chatId,
        blocked_by: userId,
        reason,
        status: 'active',
        duration_hours: durationHours || null,
        expires_at: expiresAt,
      });

      if (error) throw error;
      await fetchChatBlocks();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [userId, isAdmin, fetchChatBlocks]);

  const unblockChat = useCallback(async (blockId: string) => {
    if (!isAdmin) return { error: new Error('Not authorized') };

    try {
      const { error } = await supabase
        .from('chat_blocks')
        .update({
          status: 'lifted',
          lifted_at: new Date().toISOString(),
        })
        .eq('id', blockId);

      if (error) throw error;
      await fetchChatBlocks();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [isAdmin, fetchChatBlocks]);

  const updateChatReportStatus = useCallback(async (
    reportId: string,
    status: string
  ) => {
    if (!userId || !isAdmin) return { error: new Error('Not authorized') };

    try {
      const { error } = await supabase
        .from('chat_reports')
        .update({
          status,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
      await fetchChatReports();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [userId, isAdmin, fetchChatReports]);

  return {
    chatReports,
    chatBlocks,
    loading,
    fetchChatReports,
    fetchChatBlocks,
    blockChat,
    unblockChat,
    updateChatReportStatus,
  };
}