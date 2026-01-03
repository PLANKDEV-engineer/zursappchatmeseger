-- Ensure RLS is enabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Recreate INSERT policy explicitly as PERMISSIVE for authenticated users
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

CREATE POLICY "Users can create chats"
ON public.chats
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());
