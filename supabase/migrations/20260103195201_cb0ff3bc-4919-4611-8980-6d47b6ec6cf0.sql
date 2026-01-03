-- Update SELECT policy so chat creator can read newly created chat before participants are inserted
DROP POLICY IF EXISTS "Participants can view chats" ON public.chats;

CREATE POLICY "Participants can view chats"
ON public.chats
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_official = true
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.chat_id = chats.id
      AND cp.user_id = auth.uid()
  )
);
