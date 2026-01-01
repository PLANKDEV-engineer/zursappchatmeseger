import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type CallHistoryType = Tables<'call_history'>;

interface CallWithProfile extends CallHistoryType {
  callerProfile?: {
    name: string;
    avatar_url: string | null;
  };
  receiverProfile?: {
    name: string;
    avatar_url: string | null;
  };
}

export function useCalls(userId: string | undefined) {
  const [calls, setCalls] = useState<CallWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<CallWithProfile | null>(null);

  const fetchCalls = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('call_history')
        .select('*')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Fetch profiles
      const callsWithProfiles: CallWithProfile[] = [];
      
      for (const call of data || []) {
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', call.caller_id)
          .single();
        
        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', call.receiver_id)
          .single();
        
        callsWithProfiles.push({
          ...call,
          callerProfile: callerProfile || undefined,
          receiverProfile: receiverProfile || undefined,
        });
      }
      
      setCalls(callsWithProfiles);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const initiateCall = async (receiverId: string, type: 'voice' | 'video') => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const callData: TablesInsert<'call_history'> = {
      caller_id: userId,
      receiver_id: receiverId,
      type,
      status: 'ringing',
      started_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('call_history')
      .insert(callData)
      .select()
      .single();
    
    if (error) return { data: null, error };
    
    // Get receiver profile
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', receiverId)
      .single();
    
    const callWithProfile: CallWithProfile = {
      ...data,
      receiverProfile: receiverProfile || undefined,
    };
    
    setActiveCall(callWithProfile);
    fetchCalls();
    
    return { data: callWithProfile, error: null };
  };

  const endCall = async (callId: string) => {
    const { error } = await supabase
      .from('call_history')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId);
    
    if (!error) {
      setActiveCall(null);
      fetchCalls();
    }
    
    return { error };
  };

  const updateCallStatus = async (callId: string, status: string, duration?: number) => {
    const updates: any = { status };
    if (duration !== undefined) {
      updates.duration_seconds = duration;
    }
    if (status === 'ended' || status === 'missed' || status === 'declined') {
      updates.ended_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('call_history')
      .update(updates)
      .eq('id', callId);
    
    if (!error) {
      if (status === 'ended' || status === 'missed' || status === 'declined') {
        setActiveCall(null);
      }
      fetchCalls();
    }
    
    return { error };
  };

  return {
    calls,
    loading,
    activeCall,
    initiateCall,
    endCall,
    updateCallStatus,
    refreshCalls: fetchCalls,
  };
}
