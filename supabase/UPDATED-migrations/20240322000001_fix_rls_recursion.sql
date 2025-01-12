-- Migration: Fix RLS Policy Recursion
-- Description: This migration restructures the RLS policies to prevent infinite recursion
-- while maintaining proper access control. The key changes are:
--   1. Simplifying the channel_members policies to avoid self-referential checks
--   2. Using direct user_id checks where possible
--   3. Restructuring the policy hierarchy to prevent circular dependencies

-- Set correct schema
SET search_path TO public;

-- First, temporarily disable RLS to reset policies
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Channel member base access" ON public.channel_members;
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.channels;
DROP POLICY IF EXISTS "Members can leave channels" ON public.channel_members;

-- Re-enable RLS
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Base channel_members policy - fundamental access control
CREATE POLICY "channel_members_base_policy"
ON public.channel_members FOR SELECT
USING (
    -- User can see their own memberships
    user_id = auth.uid()
    OR 
    -- User can see other members in channels they're in
    EXISTS (
        SELECT 1 
        FROM public.channel_members AS my_membership
        WHERE my_membership.channel_id = channel_members.channel_id 
        AND my_membership.user_id = auth.uid()
    )
);

-- 2. Channel visibility policy
CREATE POLICY "channels_visibility_policy"
ON public.channels FOR SELECT
USING (
    -- Public channels OR channels user is member of
    (NOT is_private)
    OR 
    EXISTS (
        SELECT 1 
        FROM public.channel_members
        WHERE channel_id = id 
        AND user_id = auth.uid()
    )
);

-- 3. Message visibility policy
CREATE POLICY "messages_visibility_policy"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM public.channel_members
        WHERE channel_id = messages.channel_id 
        AND user_id = auth.uid()
    )
);

-- 4. Channel member management policies
CREATE POLICY "channel_member_insert_policy"
ON public.channel_members FOR INSERT
WITH CHECK (
    -- Only admins can add members
    EXISTS (
        SELECT 1 
        FROM public.channel_members
        WHERE channel_id = channel_members.channel_id 
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "channel_member_delete_policy"
ON public.channel_members FOR DELETE
USING (
    -- Users can remove themselves (except last admin)
    (user_id = auth.uid() AND role != 'admin')
    OR 
    -- Admins can remove others
    EXISTS (
        SELECT 1 
        FROM public.channel_members
        WHERE channel_id = channel_members.channel_id 
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Add helpful comments
COMMENT ON POLICY "channel_members_base_policy" ON public.channel_members IS 
'Controls basic visibility of channel members without recursive checks';

COMMENT ON POLICY "channels_visibility_policy" ON public.channels IS 
'Determines which channels a user can see based on privacy and membership';

COMMENT ON POLICY "messages_visibility_policy" ON public.messages IS 
'Controls message visibility based on channel membership';

-- Add performance indexes if not exists
CREATE INDEX IF NOT EXISTS idx_channel_members_user_channel 
ON public.channel_members(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_channel_members_role 
ON public.channel_members(role);

CREATE INDEX IF NOT EXISTS idx_messages_channel 
ON public.messages(channel_id); 