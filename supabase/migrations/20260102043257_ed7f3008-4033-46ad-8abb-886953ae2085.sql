-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Participants can view members" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join/manage participation" ON public.chat_participants;

-- Create a non-recursive SELECT policy
-- Users can see their own participations
CREATE POLICY "Users can view own participations" 
ON public.chat_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can view other participants in chats they are part of
-- Using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_chat_member(p_chat_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_id = p_chat_id AND user_id = p_user_id
  );
$$;

-- Policy for viewing all participants in chats user belongs to
CREATE POLICY "Users can view chat participants" 
ON public.chat_participants 
FOR SELECT 
USING (
  user_is_chat_member(chat_id, auth.uid())
);

-- INSERT policy - users can add themselves or admins can add others
CREATE POLICY "Users can insert participants" 
ON public.chat_participants 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  OR 
  (SELECT is_admin FROM chat_participants WHERE chat_id = chat_participants.chat_id AND user_id = auth.uid())
  OR
  (SELECT created_by FROM chats WHERE id = chat_participants.chat_id) = auth.uid()
);

-- UPDATE policy - users can update their own participation or admins can update others
CREATE POLICY "Users can update participants" 
ON public.chat_participants 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR 
  user_is_chat_member(chat_id, auth.uid())
);

-- DELETE policy - users can remove themselves or admins can remove others
CREATE POLICY "Users can delete participants" 
ON public.chat_participants 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR 
  (SELECT is_admin FROM chat_participants WHERE chat_id = chat_participants.chat_id AND user_id = auth.uid() LIMIT 1) = true
);