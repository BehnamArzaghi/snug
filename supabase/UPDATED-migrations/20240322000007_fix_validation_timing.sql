-- Migration: Supabase RLS Update with Fixed Validation Timing
-- This migration is wrapped in a transaction and can be rolled back

BEGIN;

-- Initial validation - just check if tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channels') OR
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages') OR
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channel_members') OR
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')
    THEN
        RAISE EXCEPTION 'Missing required tables. Please check your database structure.';
    END IF;
END $$;

-- Set correct schema
SET search_path TO public;

-- 1. First, drop all existing policies (except storage policies)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Channels are viewable by everyone or members" ON channels;
DROP POLICY IF EXISTS "Authenticated users can create channels" ON channels;
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Channel members are viewable by channel members" ON channel_members;
DROP POLICY IF EXISTS "Channel admins can manage members" ON channel_members;

-- 2. Temporarily disable RLS to avoid any conflicts
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 3. Create new indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_members_user_channel 
ON public.channel_members(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_channel_members_role 
ON public.channel_members(role);

CREATE INDEX IF NOT EXISTS idx_messages_channel 
ON public.messages(channel_id);

CREATE INDEX IF NOT EXISTS idx_messages_user 
ON public.messages(user_id);

-- 4. Create all policies before enabling RLS
-- 5. Recreate user policies (these were in the initial schema)
CREATE POLICY "Users are viewable by everyone"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update own record"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 6. Create new channel member policies
CREATE POLICY "view_channel_members"
ON public.channel_members FOR SELECT
USING (
    user_id = auth.uid()
    OR channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "manage_channel_members_admin"
ON public.channel_members FOR ALL
USING (
    channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "leave_channel"
ON public.channel_members FOR DELETE
USING (user_id = auth.uid());

-- 7. Create new channel policies
CREATE POLICY "view_public_channels"
ON public.channels FOR SELECT
USING (NOT is_private);

CREATE POLICY "view_member_channels"
ON public.channels FOR SELECT
USING (
    id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "create_channels"
ON public.channels FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "manage_channels_admin"
ON public.channels FOR UPDATE OR DELETE
USING (
    id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 8. Create new message policies
CREATE POLICY "view_messages"
ON public.messages FOR SELECT
USING (
    channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "create_messages"
ON public.messages FOR INSERT
WITH CHECK (
    channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

CREATE POLICY "edit_own_messages"
ON public.messages FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "delete_own_messages"
ON public.messages FOR DELETE
USING (user_id = auth.uid());

-- 9. Now that all policies are created, enable RLS
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 10. Create and configure new tables
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id, status)
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_access_requests"
ON public.access_requests FOR SELECT
USING (
    user_id = auth.uid()
    OR channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "create_access_requests"
ON public.access_requests FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = access_requests.channel_id
        AND user_id = auth.uid()
    )
);

-- 11. Create audit logs table and policies
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_audit_logs"
ON public.audit_logs FOR SELECT
USING (
    channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 12. Create notifications table and policies
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_own_notifications"
ON public.notifications FOR ALL
USING (user_id = auth.uid());

-- 13. Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_access_requests_channel 
ON public.access_requests(channel_id);

CREATE INDEX IF NOT EXISTS idx_access_requests_user 
ON public.access_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_channel 
ON public.audit_logs(channel_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON public.notifications(user_id);

-- 14. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE access_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Final validation checks
DO $$
DECLARE
    policy_count int;
BEGIN
    -- Count new policies to ensure they were created
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('channel_members', 'channels', 'messages');

    IF policy_count < 10 THEN  -- We expect at least 10 policies
        RAISE EXCEPTION 'Not all policies were created successfully. Rolling back...';
    END IF;

    -- Verify RLS is enabled on all required tables
    IF EXISTS (
        SELECT 1 FROM pg_tables
        JOIN pg_class ON pg_tables.tablename = pg_class.relname
        WHERE schemaname = 'public'
        AND tablename IN ('channel_members', 'channels', 'messages')
        AND NOT relrowsecurity
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on all required tables. Rolling back...';
    END IF;
END $$;

-- To commit the changes, uncomment the next line and comment out ROLLBACK
-- COMMIT;

-- To rollback all changes, uncomment the next line and comment out COMMIT
ROLLBACK; 