-- Fix RLS: current INSERT policy on public.chats is RESTRICTIVE (blocks all inserts).
-- Recreate it as permissive so authenticated users can create chats when created_by = auth.uid().

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

CREATE POLICY "Users can create chats"
ON public.chats
FOR INSERT
WITH CHECK (created_by = auth.uid());
