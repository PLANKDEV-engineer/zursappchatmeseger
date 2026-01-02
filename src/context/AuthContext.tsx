import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type AdminBlock = Tables<'admin_blocks'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  blockInfo: AdminBlock | null;
  signUp: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
  refreshProfile: () => void;
  submitAppeal: (message: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState<AdminBlock | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      setIsAdmin(roleData?.role === 'admin');

      // Check if user is blocked by admin
      const { data: blockData } = await supabase
        .from('admin_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (blockData) {
        // Check if block has expired
        if (blockData.expires_at && new Date(blockData.expires_at) < new Date()) {
          // Block has expired, update status
          await supabase
            .from('admin_blocks')
            .update({ status: 'expired' })
            .eq('id', blockData.id);
          setIsBlocked(false);
          setBlockInfo(null);
        } else {
          setIsBlocked(true);
          setBlockInfo(blockData);
        }
      } else {
        setIsBlocked(false);
        setBlockInfo(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsBlocked(false);
          setBlockInfo(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
        },
      },
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setIsBlocked(false);
      setBlockInfo(null);
    }
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
    
    return { data, error };
  };

  const refreshProfile = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  const submitAppeal = async (message: string) => {
    if (!blockInfo) return { error: new Error('No block found') };
    
    const { error } = await supabase
      .from('admin_blocks')
      .update({ 
        appeal_message: message, 
        appeal_status: 'pending' 
      })
      .eq('id', blockInfo.id);
    
    if (!error) {
      setBlockInfo({ ...blockInfo, appeal_message: message, appeal_status: 'pending' });
    }
    
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        isBlocked,
        blockInfo,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
        submitAppeal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
