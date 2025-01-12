-- Migration: Simplify RLS Policies
-- Description: Simplifies RLS policies to avoid recursion by using direct table access
-- This approach focuses on the minimal necessary checks without circular references

-- Set correct schema
SET search_path TO public;

-- Temporarily disable RLS
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "channel_members_base_policy" ON public.channel_members;
DROP POLICY IF EXISTS "channels_visibility_policy" ON public.channels;
DROP POLICY IF EXISTS "messages_visibility_policy" ON public.messages;
DROP POLICY IF EXISTS "channel_member_insert_policy" ON public.channel_members;
DROP POLICY IF EXISTS "channel_member_delete_policy" ON public.channel_members;

-- Re-enable RLS
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Simple direct access policies
CREATE POLICY "allow_user_to_see_own_memberships"
ON public.channel_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "allow_public_channels"
ON public.channels FOR SELECT
USING (NOT is_private);

CREATE POLICY "allow_member_channels"
ON public.channels FOR SELECT
USING (
    id IN (
        SELECT channel_id 
        FROM public.channel_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "allow_channel_messages"
ON public.messages FOR SELECT
USING (
    channel_id IN (
        SELECT channel_id 
        FROM public.channel_members 
        WHERE user_id = auth.uid()
    )
);

-- Basic management policies
CREATE POLICY "allow_self_management"
ON public.channel_members FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "allow_admin_management"
ON public.channel_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.channel_members
        WHERE channel_id = channel_members.channel_id 
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_channel_members_user_channel 
ON public.channel_members(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_messages_channel 
ON public.messages(channel_id); 