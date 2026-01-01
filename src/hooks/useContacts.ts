import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ContactType = Tables<'contacts'>;

interface ContactWithProfile extends ContactType {
  profile?: {
    name: string;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string | null;
    public_id: string;
    phone: string | null;
  };
}

export function useContacts(userId: string | undefined) {
  const [contacts, setContacts] = useState<ContactWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_saved', true)
        .order('name');
      
      if (error) throw error;
      
      // Fetch profiles for contacts with contact_user_id
      const contactsWithProfiles: ContactWithProfile[] = [];
      
      for (const contact of data || []) {
        if (contact.contact_user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url, is_online, last_seen, public_id, phone')
            .eq('user_id', contact.contact_user_id)
            .single();
          
          contactsWithProfiles.push({
            ...contact,
            profile: profile || undefined,
          });
        } else {
          contactsWithProfiles.push(contact);
        }
      }
      
      setContacts(contactsWithProfiles);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (name: string, phone?: string, publicId?: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    // Try to find user with this phone or public_id
    let contactUserId: string | undefined;
    let foundProfile: any = null;
    
    if (publicId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, phone')
        .eq('public_id', publicId)
        .single();
      
      if (profile) {
        contactUserId = profile.user_id;
        foundProfile = profile;
      }
    } else if (phone) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, phone')
        .eq('phone', phone)
        .single();
      
      if (profile) {
        contactUserId = profile.user_id;
        foundProfile = profile;
      }
    }
    
    // Only allow adding if user is registered
    if (!contactUserId) {
      return { error: new Error('User not found'), data: null };
    }
    
    // Check if already a contact
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_user_id', contactUserId)
      .single();
    
    if (existingContact) {
      return { error: new Error('Contact already exists'), data: null };
    }
    
    const contact: TablesInsert<'contacts'> = {
      user_id: userId,
      name: foundProfile?.name || name,
      phone: foundProfile?.phone || phone,
      contact_user_id: contactUserId,
      is_saved: true,
    };
    
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (!error) {
      fetchContacts();
    }
    
    return { data, error };
  };

  const updateContact = async (contactId: string, updates: Partial<ContactType>) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (!error) {
      fetchContacts();
    }
    
    return { data, error };
  };

  const deleteContact = async (contactId: string) => {
    if (!userId) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId);
    
    if (!error) {
      fetchContacts();
    }
    
    return { error };
  };

  const searchUsers = async (query: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url, phone, public_id')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,public_id::text.ilike.%${query}%`)
      .limit(20);
    
    return { data, error };
  };

  const findUserByPublicId = async (publicId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url, phone, public_id')
      .eq('public_id', publicId)
      .single();
    
    return { data, error };
  };

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    searchUsers,
    findUserByPublicId,
    refreshContacts: fetchContacts,
  };
}
