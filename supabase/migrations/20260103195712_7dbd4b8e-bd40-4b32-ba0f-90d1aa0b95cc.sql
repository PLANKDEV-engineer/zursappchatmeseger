-- Fix broken RLS policies on public.chat_participants that can throw
-- 'more than one row returned by a subquery used as an expression'

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can delete participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON public.chat_participants;

-- Recreate DELETE policy: user can remove themselves, or chat admins/owners can remove others
CREATE POLICY "Users can delete participants"
ON public.chat_participants
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
      AND cp.user_id = auth.uid()
      AND (cp.is_admin = true OR cp.is_owner = true)
  )
);

-- Recreate INSERT policy: user can add themselves, chat admins/owners can add anyone,
-- and chat creator can add participants
CREATE POLICY "Users can insert participants"
ON public.chat_participants
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
      AND cp.user_id = auth.uid()
      AND (cp.is_admin = true OR cp.is_owner = true)
  )
  OR EXISTS (
    SELECT 1
    FROM public.chats c
    WHERE c.id = chat_participants.chat_id
      AND c.created_by = auth.uid()
  )
);
