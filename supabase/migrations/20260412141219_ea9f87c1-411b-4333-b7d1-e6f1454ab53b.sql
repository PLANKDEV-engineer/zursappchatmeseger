-- Allow authenticated users to view group/channel chats (for join page)
CREATE POLICY "Anyone can view groups and channels"
ON public.chats
FOR SELECT
TO authenticated
USING (type IN ('group', 'channel'));