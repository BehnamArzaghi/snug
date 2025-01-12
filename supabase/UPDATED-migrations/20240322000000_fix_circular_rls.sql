-- Migration: Fix Circular Dependencies in RLS Policies
-- Description: This migration addresses the infinite recursion issue in Row Level Security (RLS) policies
-- by restructuring the policies to avoid circular references while maintaining security.
-- The fix involves:
--   1. Simplifying channel member access checks
--   2. Restructuring message policies to avoid recursive checks
--   3. Ensuring channel policies don't create circular dependencies
--   4. Maintaining security while improving performance

-- Set correct schema
SET search_path TO public;

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view channel members in their channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.channels;

-- Create base channel member policy with direct user check
CREATE POLICY "Channel member base access"
ON public.channel_members FOR SELECT
USING (
    -- Direct check against user_id without recursive membership verification
    user_id = auth.uid()
    OR 
    channel_id IN (
        -- Get channels where user is a direct member
        SELECT channel_id 
        FROM public.channel_members 
        WHERE user_id = auth.uid()
    )
);

-- Update message viewing policy to use simplified access check
CREATE POLICY "Users can view messages in their channels"
ON public.messages FOR SELECT
USING (
    channel_id IN (
        -- Direct membership check without recursive policies
        SELECT channel_id 
        FROM public.channel_members 
        WHERE user_id = auth.uid()
    )
);

-- Update channel viewing policy to use simplified access check
CREATE POLICY "Users can view channels they are members of"
ON public.channels FOR SELECT
USING (
    id IN (
        -- Direct membership check
        SELECT channel_id 
        FROM public.channel_members 
        WHERE user_id = auth.uid()
    )
);

-- Add performance indexes to support the new policy structure
CREATE INDEX IF NOT EXISTS idx_channel_members_user_channel 
ON public.channel_members(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_messages_channel 
ON public.messages(channel_id);

COMMENT ON POLICY "Channel member base access" ON public.channel_members IS 
'Allows users to view channel members for channels they belong to using direct membership checks';

COMMENT ON POLICY "Users can view messages in their channels" ON public.messages IS 
'Allows users to view messages in channels they are members of using simplified access checks';

COMMENT ON POLICY "Users can view channels they are members of" ON public.channels IS 
'Allows users to view channels they are members of using direct membership verification'; 