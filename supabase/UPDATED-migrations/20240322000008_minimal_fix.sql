-- Migration: Fix Recursive Policy Checks
-- This migration only addresses the infinite recursion issue in RLS policies

BEGIN;

-- Temporarily disable RLS
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Channel members are viewable by channel members" ON channel_members;
DROP POLICY IF EXISTS "Channels are viewable by everyone or members" ON channels;

-- Create non-recursive replacement policies
CREATE POLICY "channel_members_access"
ON public.channel_members FOR SELECT
USING (
    user_id = auth.uid()
    OR channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "channels_access"
ON public.channels FOR SELECT
USING (
    NOT is_private 
    OR id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid()
    )
);

-- Re-enable RLS
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- To commit the changes, uncomment the next line and comment out ROLLBACK
-- COMMIT;

-- To rollback all changes, uncomment the next line and comment out COMMIT
ROLLBACK; 