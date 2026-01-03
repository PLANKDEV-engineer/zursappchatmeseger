-- Create table for group/channel blocks
CREATE TABLE IF NOT EXISTS public.chat_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  blocked_by uuid REFERENCES auth.users(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  duration_hours integer,
  blocked_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  lifted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_blocks
CREATE POLICY "Admins can manage chat blocks"
ON public.chat_blocks
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active chat blocks"
ON public.chat_blocks
FOR SELECT
USING (status = 'active');

-- Create table for group/channel reports
CREATE TABLE IF NOT EXISTS public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_reports
CREATE POLICY "Users can create chat reports"
ON public.chat_reports
FOR INSERT
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporters can view own reports"
ON public.chat_reports
FOR SELECT
USING (reporter_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage chat reports"
ON public.chat_reports
FOR ALL
USING (is_admin(auth.uid()));