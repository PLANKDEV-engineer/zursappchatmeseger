-- Enable realtime for chat-critical tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN
  -- already added
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Increment unread counts for recipients on new message
CREATE OR REPLACE FUNCTION public.increment_unread_counts_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ignore soft-deleted messages or missing sender
  IF NEW.is_deleted IS TRUE OR NEW.sender_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.chat_participants
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE chat_id = NEW.chat_id
    AND user_id <> NEW.sender_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_unread_counts_on_message ON public.messages;
CREATE TRIGGER trg_increment_unread_counts_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_unread_counts_on_message();
