-- Migration: Complete RLS Policy Implementation
-- Description: Implements comprehensive RLS policies covering all functionality
-- while maintaining non-recursive approach for performance and stability

-- Set correct schema
SET search_path TO public;

-- Temporarily disable RLS
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_user_to_see_own_memberships" ON public.channel_members;
DROP POLICY IF EXISTS "allow_public_channels" ON public.channels;
DROP POLICY IF EXISTS "allow_member_channels" ON public.channels;
DROP POLICY IF EXISTS "allow_channel_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_self_management" ON public.channel_members;
DROP POLICY IF EXISTS "allow_admin_management" ON public.channel_members;

-- Re-enable RLS
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Channel Member Policies
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

-- Channel Policies
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

-- Message Policies
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

-- Access Request Policies
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

-- Audit Log Policies
CREATE POLICY "view_audit_logs"
ON public.audit_logs FOR SELECT
USING (
    channel_id IN (
        SELECT channel_id FROM public.channel_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Notification Policies
CREATE POLICY "manage_own_notifications"
ON public.notifications FOR ALL
USING (user_id = auth.uid());

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_channel_members_user_channel 
ON public.channel_members(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_channel_members_role 
ON public.channel_members(role);

CREATE INDEX IF NOT EXISTS idx_messages_channel 
ON public.messages(channel_id);

CREATE INDEX IF NOT EXISTS idx_messages_user 
ON public.messages(user_id);

CREATE INDEX IF NOT EXISTS idx_access_requests_channel 
ON public.access_requests(channel_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_channel 
ON public.audit_logs(channel_id);

COMMENT ON POLICY "view_channel_members" ON public.channel_members IS 
'Users can view members of channels they belong to';

COMMENT ON POLICY "manage_channel_members_admin" ON public.channel_members IS 
'Channel admins can manage member roles and access';

COMMENT ON POLICY "view_messages" ON public.messages IS 
'Users can view messages in channels they are members of';

COMMENT ON POLICY "create_messages" ON public.messages IS 
'Users can create messages in channels they are members of'; 