-- Add is_archived and is_starred columns to chat_participants if not exists
ALTER TABLE public.chat_participants 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;

-- Add is_starred column to messages for starred messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS starred_by uuid[] DEFAULT '{}';

-- Create message_reports table for reporting messages
CREATE TABLE IF NOT EXISTS public.message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reports
CREATE POLICY "Users can create message reports"
ON public.message_reports
FOR INSERT
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporters can view own reports"
ON public.message_reports
FOR SELECT
USING (reporter_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage message reports"
ON public.message_reports
FOR ALL
USING (is_admin(auth.uid()));