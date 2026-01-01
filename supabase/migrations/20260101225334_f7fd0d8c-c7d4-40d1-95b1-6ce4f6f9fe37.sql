-- Add official group and channel with fixed UUIDs
INSERT INTO public.chats (id, type, name, description, avatar_url, is_official, only_admins_can_send, allow_reactions, created_at)
VALUES 
  ('7f9c4cc3-7c6a-4b75-9b7d-0fe8b14c6c1e', 'group', 'ZursApp Official', 'Grup resmi ZursApp untuk pengumuman dan diskusi', 'https://i.ibb.co.com/q3XJK7DL/zursapp-logo.png', true, false, true, now()),
  ('d0b4a0a1-2d6b-4a9b-9a2d-7c8e7a7f3b0f', 'channel', 'ZursApp Channel', 'Saluran resmi ZursApp untuk berita dan update terbaru', 'https://i.ibb.co.com/q3XJK7DL/zursapp-logo.png', true, true, true, now())
ON CONFLICT (id) DO UPDATE SET
  is_official = true,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  avatar_url = EXCLUDED.avatar_url;

-- Create typing_status table for realtime typing indicators
CREATE TABLE IF NOT EXISTS public.typing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS typing_status_chat_user ON public.typing_status(chat_id, user_id);
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view typing status" ON public.typing_status
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_id = typing_status.chat_id
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own typing status" ON public.typing_status
FOR ALL USING (user_id = auth.uid());

-- Enable realtime for typing_status
ALTER TABLE public.typing_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;

-- Add trigger to auto-update last_seen
CREATE OR REPLACE FUNCTION public.update_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profile_presence ON public.profiles;
CREATE TRIGGER update_profile_presence
  BEFORE UPDATE OF is_online ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_presence();