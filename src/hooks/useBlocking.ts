import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type BlockedUserType = Tables<'blocked_users'>;

interface BlockedUserWithProfile extends BlockedUserType {
  profile?: {
    name: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

export function useBlocking(userId: string | undefined) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserWithProfile[]>([]);
  const [blockedByUsers, setBlockedByUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch users I've blocked
      const { data: blocked, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', userId);

      if (error) throw error;

      // Fetch profiles for blocked users
      const blockedWithProfiles: BlockedUserWithProfile[] = [];
      for (const block of blocked || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url, phone')
          .eq('user_id', block.blocked_id)
          .single();

        blockedWithProfiles.push({
          ...block,
          profile: profile || undefined,
        });
      }

      setBlockedUsers(blockedWithProfiles);

      // Fetch users who blocked me
      const { data: blockedBy } = await supabase
        .from('blocked_users')
        .select('blocker_id')
        .eq('blocked_id', userId);

      setBlockedByUsers(blockedBy?.map(b => b.blocker_id) || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const blockUser = async (blockedId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };

    const block: TablesInsert<'blocked_users'> = {
      blocker_id: userId,
      blocked_id: blockedId,
    };

    const { data, error } = await supabase
      .from('blocked_users')
      .insert(block)
      .select()
      .single();

    if (!error) {
      fetchBlocked();
    }

    return { data, error };
  };

  const unblockUser = async (blockedId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_id', blockedId);

    if (!error) {
      fetchBlocked();
    }

    return { error };
  };

  const isBlocked = useCallback((checkUserId: string) => {
    return blockedUsers.some(b => b.blocked_id === checkUserId);
  }, [blockedUsers]);

  const isBlockedBy = useCallback((checkUserId: string) => {
    return blockedByUsers.includes(checkUserId);
  }, [blockedByUsers]);

  return {
    blockedUsers,
    blockedByUsers,
    loading,
    blockUser,
    unblockUser,
    isBlocked,
    isBlockedBy,
    refreshBlocked: fetchBlocked,
  };
}
