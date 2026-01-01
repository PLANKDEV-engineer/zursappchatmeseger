import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, Database } from '@/integrations/supabase/types';

type ReportReason = Database['public']['Enums']['report_reason'];

export function useReporting(userId: string | undefined) {
  const [loading, setLoading] = useState(false);

  const reportUser = useCallback(async (
    reportedUserId: string,
    reason: ReportReason,
    description?: string
  ) => {
    if (!userId) return { error: new Error('Not authenticated') };

    setLoading(true);

    try {
      const report: TablesInsert<'reports'> = {
        reporter_id: userId,
        reported_user_id: reportedUserId,
        reason,
        description,
      };

      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single();

      return { data, error };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    reportUser,
    loading,
  };
}
