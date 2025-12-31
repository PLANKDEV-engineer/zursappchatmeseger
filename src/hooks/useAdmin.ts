import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ReportType = Tables<'reports'>;
export type AdminBlockType = Tables<'admin_blocks'>;
export type UserRoleType = Tables<'user_roles'>;

interface UserWithDetails {
  user_id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  is_online: boolean;
  created_at: string;
  role: 'admin' | 'moderator' | 'user';
  isBlocked: boolean;
  blockInfo?: AdminBlockType;
}

interface ReportWithUsers extends ReportType {
  reporter?: { name: string; avatar_url: string | null };
  reportedUser?: { name: string; avatar_url: string | null };
}

export function useAdmin(userId: string | undefined, isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [reports, setReports] = useState<ReportWithUsers[]>([]);
  const [appeals, setAppeals] = useState<AdminBlockType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (search?: string) => {
    if (!isAdmin) return;
    setLoading(true);
    
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      const { data: profiles, error } = await query.limit(100);
      if (error) throw error;
      
      const usersWithDetails: UserWithDetails[] = [];
      
      for (const profile of profiles || []) {
        // Get role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .single();
        
        // Check if blocked
        const { data: blockData } = await supabase
          .from('admin_blocks')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('status', 'active')
          .single();
        
        usersWithDetails.push({
          user_id: profile.user_id,
          name: profile.name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          is_online: profile.is_online || false,
          created_at: profile.created_at,
          role: roleData?.role || 'user',
          isBlocked: !!blockData,
          blockInfo: blockData || undefined,
        });
      }
      
      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchReports = useCallback(async (status?: string) => {
    if (!isAdmin) return;
    setLoading(true);
    
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      const reportsWithUsers: ReportWithUsers[] = [];
      
      for (const report of data || []) {
        const { data: reporter } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', report.reporter_id)
          .single();
        
        const { data: reportedUser } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', report.reported_user_id)
          .single();
        
        reportsWithUsers.push({
          ...report,
          reporter: reporter || undefined,
          reportedUser: reportedUser || undefined,
        });
      }
      
      setReports(reportsWithUsers);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAppeals = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('admin_blocks')
        .select('*')
        .eq('appeal_status', 'pending')
        .order('blocked_at', { ascending: false });
      
      if (error) throw error;
      setAppeals(data || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const blockUser = async (
    targetUserId: string, 
    reason: string, 
    durationHours?: number
  ) => {
    if (!isAdmin || !userId) return { error: new Error('Not authorized') };
    
    const expiresAt = durationHours 
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : null;
    
    const block: TablesInsert<'admin_blocks'> = {
      user_id: targetUserId,
      blocked_by: userId,
      reason,
      duration_hours: durationHours,
      expires_at: expiresAt,
      status: 'active',
    };
    
    const { data, error } = await supabase
      .from('admin_blocks')
      .insert(block)
      .select()
      .single();
    
    if (!error) {
      fetchUsers();
    }
    
    return { data, error };
  };

  const unblockUser = async (blockId: string) => {
    if (!isAdmin) return { error: new Error('Not authorized') };
    
    const { error } = await supabase
      .from('admin_blocks')
      .update({ 
        status: 'lifted', 
        lifted_at: new Date().toISOString() 
      })
      .eq('id', blockId);
    
    if (!error) {
      fetchUsers();
    }
    
    return { error };
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    if (!isAdmin || !userId) return { error: new Error('Not authorized') };
    
    const { error } = await supabase
      .from('reports')
      .update({ 
        status, 
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId);
    
    if (!error) {
      fetchReports();
    }
    
    return { error };
  };

  const handleAppeal = async (blockId: string, approved: boolean) => {
    if (!isAdmin) return { error: new Error('Not authorized') };
    
    const updates: Partial<AdminBlockType> = {
      appeal_status: approved ? 'approved' : 'rejected',
    };
    
    if (approved) {
      updates.status = 'lifted';
      updates.lifted_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('admin_blocks')
      .update(updates)
      .eq('id', blockId);
    
    if (!error) {
      fetchAppeals();
      fetchUsers();
    }
    
    return { error };
  };

  const updateUserRole = async (
    targetUserId: string, 
    role: 'admin' | 'moderator' | 'user'
  ) => {
    if (!isAdmin) return { error: new Error('Not authorized') };
    
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', targetUserId);
    
    if (!error) {
      fetchUsers();
    }
    
    return { error };
  };

  return {
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
    updateUserRole,
  };
}
