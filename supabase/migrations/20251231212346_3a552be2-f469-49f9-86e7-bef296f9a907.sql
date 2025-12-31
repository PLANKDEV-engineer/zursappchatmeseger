-- Seed official group & channel and auto-join all users

-- 1) Create deterministic IDs for official chats
DO $$
BEGIN
  -- Official group
  IF NOT EXISTS (
    SELECT 1 FROM public.chats WHERE id = '7f9c4cc3-7c6a-4b75-9b7d-0fe8b14c6c1e'
  ) THEN
    INSERT INTO public.chats (
      id,
      type,
      name,
      description,
      is_official,
      followers_count,
      created_by
    ) VALUES (
      '7f9c4cc3-7c6a-4b75-9b7d-0fe8b14c6c1e',
      'group',
      'ZursApp Grup Resmi',
      'Grup pengumuman dan diskusi resmi ZursApp. Tidak bisa keluar.',
      true,
      0,
      NULL
    );
  END IF;

  -- Official channel
  IF NOT EXISTS (
    SELECT 1 FROM public.chats WHERE id = 'd0b4a0a1-2d6b-4a9b-9a2d-7c8e7a7f3b0f'
  ) THEN
    INSERT INTO public.chats (
      id,
      type,
      name,
      description,
      is_official,
      followers_count,
      created_by
    ) VALUES (
      'd0b4a0a1-2d6b-4a9b-9a2d-7c8e7a7f3b0f',
      'channel',
      'ZursApp Saluran Resmi',
      'Saluran resmi ZursApp. Tidak bisa unfollow.',
      true,
      147900000000000,
      NULL
    );
  END IF;
END $$;

-- 2) Backfill: ensure every existing user is a participant of official chats
INSERT INTO public.chat_participants (chat_id, user_id)
SELECT '7f9c4cc3-7c6a-4b75-9b7d-0fe8b14c6c1e', p.user_id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_participants cp
  WHERE cp.chat_id = '7f9c4cc3-7c6a-4b75-9b7d-0fe8b14c6c1e'
    AND cp.user_id = p.user_id
);

INSERT INTO public.chat_participants (chat_id, user_id)
SELECT 'd0b4a0a1-2d6b-4a9b-9a2d-7c8e7a7f3b0f', p.user_id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_participants cp
  WHERE cp.chat_id = 'd0b4a0a1-2d6b-4a9b-9a2d-7c8e7a7f3b0f'
    AND cp.user_id = p.user_id
);

-- 3) Update handle_new_user to auto-join official chats on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone'
  );

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

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
$$;

-- 4) Create a private media bucket for status/chat uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- 5) Storage policies for 'media'
-- Allow any authenticated user to read media (private bucket). We use signed URLs in app.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can read media'
  ) THEN
    CREATE POLICY "Authenticated can read media"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own media'
  ) THEN
    CREATE POLICY "Users can upload own media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'media'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own media'
  ) THEN
    CREATE POLICY "Users can update own media"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'media'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own media'
  ) THEN
    CREATE POLICY "Users can delete own media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'media'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;