import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type StatusType = Tables<'statuses'>;
export type StatusViewerType = Tables<'status_viewers'>;

interface StatusWithViews extends StatusType {
  viewers: StatusViewerType[];
  profile?: {
    name: string;
    avatar_url: string | null;
  };
  viewCount: number;
}

interface UserStatuses {
  userId: string;
  userName: string;
  userAvatar: string | null;
  statuses: StatusWithViews[];
  hasUnviewed: boolean;
}

export function useStatuses(userId: string | undefined) {
  const [myStatuses, setMyStatuses] = useState<StatusWithViews[]>([]);
  const [contactStatuses, setContactStatuses] = useState<UserStatuses[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Fetch my statuses
      const { data: myData, error: myError } = await supabase
        .from('statuses')
        .select(`
          *,
          status_viewers (*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (myError) throw myError;
      
      const myStatusesWithViews = (myData || []).map(status => ({
        ...status,
        viewers: status.status_viewers || [],
        viewCount: status.status_viewers?.length || 0,
      }));
      
      setMyStatuses(myStatusesWithViews);
      
      // Fetch contact statuses
      const { data: contacts } = await supabase
        .from('contacts')
        .select('contact_user_id')
        .eq('user_id', userId)
        .not('contact_user_id', 'is', null);
      
      const contactIds = contacts?.map(c => c.contact_user_id).filter(Boolean) || [];
      
      if (contactIds.length > 0) {
        const { data: statusesData } = await supabase
          .from('statuses')
          .select(`
            *,
            status_viewers (*)
          `)
          .in('user_id', contactIds)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });
        
        // Group by user
        const groupedStatuses: Record<string, StatusWithViews[]> = {};
        for (const status of statusesData || []) {
          if (!groupedStatuses[status.user_id]) {
            groupedStatuses[status.user_id] = [];
          }
          groupedStatuses[status.user_id].push({
            ...status,
            viewers: status.status_viewers || [],
            viewCount: status.status_viewers?.length || 0,
          });
        }
        
        // Get profiles and check viewed status
        const userStatusesList: UserStatuses[] = [];
        for (const [statusUserId, statuses] of Object.entries(groupedStatuses)) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', statusUserId)
            .single();
          
          // Check if user has viewed all statuses
          const hasUnviewed = statuses.some(status => 
            !status.viewers.some(v => v.viewer_id === userId)
          );
          
          userStatusesList.push({
            userId: statusUserId,
            userName: profile?.name || 'Unknown',
            userAvatar: profile?.avatar_url,
            statuses,
            hasUnviewed,
          });
        }
        
        // Sort: unviewed first
        userStatusesList.sort((a, b) => {
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          return 0;
        });
        
        setContactStatuses(userStatusesList);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatuses();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('statuses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses' },
        () => fetchStatuses()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'status_viewers' },
        () => fetchStatuses()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatuses]);

  const createStatus = async (
    type: 'text' | 'image' | 'video',
    content: string,
    options?: {
      caption?: string;
      backgroundColor?: string;
      textColor?: string;
      fontFamily?: string;
      mediaUrl?: string;
      visibility?: 'all' | 'contacts' | 'contacts_except' | 'only_me';
      excludedContacts?: string[];
    }
  ) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const status: TablesInsert<'statuses'> = {
      user_id: userId,
      type,
      content,
      caption: options?.caption,
      background_color: options?.backgroundColor,
      text_color: options?.textColor,
      font_family: options?.fontFamily,
      media_url: options?.mediaUrl,
      visibility: options?.visibility || 'all',
      excluded_contacts: options?.excludedContacts,
    };
    
    const { data, error } = await supabase
      .from('statuses')
      .insert(status)
      .select()
      .single();
    
    if (!error) {
      fetchStatuses();
    }
    
    return { data, error };
  };

  const viewStatus = async (statusId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    // Check if already viewed
    const { data: existing } = await supabase
      .from('status_viewers')
      .select('id')
      .eq('status_id', statusId)
      .eq('viewer_id', userId)
      .single();
    
    if (existing) {
      return { data: existing, error: null };
    }
    
    const { data, error } = await supabase
      .from('status_viewers')
      .insert({ status_id: statusId, viewer_id: userId })
      .select()
      .single();
    
    if (!error) {
      fetchStatuses();
    }
    
    return { data, error };
  };

  const deleteStatus = async (statusId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', statusId)
      .eq('user_id', userId);
    
    if (!error) {
      fetchStatuses();
    }
    
    return { error };
  };

  return {
    myStatuses,
    contactStatuses,
    loading,
    createStatus,
    viewStatus,
    deleteStatus,
    refreshStatuses: fetchStatuses,
  };
}
