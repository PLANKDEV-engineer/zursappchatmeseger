CREATE OR REPLACE FUNCTION public.group_join_system_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type chat_type; v_name text;
BEGIN
  SELECT type INTO v_type FROM public.chats WHERE id = NEW.chat_id;
  IF v_type = 'group' AND COALESCE(NEW.is_owner, false) = false THEN
    SELECT name INTO v_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.messages (chat_id, sender_id, content, type, status)
    VALUES (NEW.chat_id, NULL, '[system] ' || COALESCE(v_name, 'Pengguna') || ' bergabung ke grup', 'text', 'sent');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_group_join_system_message AFTER INSERT ON public.chat_participants
FOR EACH ROW EXECUTE FUNCTION public.group_join_system_message();