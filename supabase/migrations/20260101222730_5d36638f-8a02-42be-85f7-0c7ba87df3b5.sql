-- Add immutable public user ID to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_id uuid;

UPDATE public.profiles
SET public_id = gen_random_uuid()
WHERE public_id IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN public_id SET NOT NULL;

ALTER TABLE public.profiles
ALTER COLUMN public_id SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_public_id_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_public_id_key UNIQUE (public_id);
  END IF;
END $$;

-- Ensure new users get public_id + allow bootstrapping admin role by phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text;
BEGIN
  v_phone := NEW.raw_user_meta_data ->> 'phone';

  INSERT INTO public.profiles (user_id, name, phone, public_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    v_phone,
    gen_random_uuid()
  );

  -- Assign role (admin bootstrap for the primary admin phone)
  IF v_phone = '+6283824299082' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;

  -- Auto-join official group & channel
  INSERT INTO public.chat_participants (chat_id, user_id)
  SELECT x.chat_id, NEW.id
  FROM (VALUES
    ('7f9c4cc3-7c6a-4b75-9b7d-0fe8b14c6c1e'::uuid),
    ('d0b4a0a1-2d6b-4a9b-9a2d-7c8e7a7f3b0f'::uuid)
  ) AS x(chat_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = x.chat_id
      AND cp.user_id = NEW.id
  );

  RETURN NEW;
END;
$function$;