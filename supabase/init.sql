-- =============================================================================
-- MIGRATION 1: Initial Schema (20240101000000_initial_schema.sql)
-- =============================================================================
SET search_path TO public;

-- Create core tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.channel_members (
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MIGRATION 2: Access Requests (20240110_access_requests.sql)
-- =============================================================================
SET search_path TO public;

-- Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id, status)
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Policies for access_requests
CREATE POLICY "Users can view their own requests"
ON public.access_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Channel admins can view channel requests"
ON public.access_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
        AND channel_members.role = 'admin'
    )
);

CREATE POLICY "Users can create access requests"
ON public.access_requests FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.access_requests ar
        WHERE ar.channel_id = access_requests.channel_id
        AND ar.user_id = auth.uid()
        AND ar.status = 'pending'
    )
);

CREATE POLICY "Channel admins can update request status"
ON public.access_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
        AND channel_members.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
        AND channel_members.role = 'admin'
    )
);

-- =============================================================================
-- MIGRATION 3: Access Request Constraints (20240111_access_request_constraints.sql)
-- =============================================================================
SET search_path TO public;

-- Add unique constraint to prevent concurrent pending requests
ALTER TABLE public.access_requests
DROP CONSTRAINT IF EXISTS unique_pending_request;

CREATE UNIQUE INDEX unique_pending_request
ON public.access_requests (channel_id, user_id)
WHERE status = 'pending';

-- Add trigger to clean up old requests when a new one is created
CREATE OR REPLACE FUNCTION public.clean_old_requests()
RETURNS TRIGGER AS $$
BEGIN
    -- Archive old requests from the same user for the same channel
    UPDATE public.access_requests
    SET status = 'archived'
    WHERE channel_id = NEW.channel_id
    AND user_id = NEW.user_id
    AND id != NEW.id
    AND status IN ('approved', 'denied');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clean_old_requests_trigger ON public.access_requests;

CREATE TRIGGER clean_old_requests_trigger
    AFTER INSERT ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.clean_old_requests();

-- =============================================================================
-- MIGRATION 4: Channel Deletion (20240111_channel_deletion.sql)
-- =============================================================================
SET search_path TO public;

-- Add trigger to archive access requests when a channel is deleted
CREATE OR REPLACE FUNCTION public.archive_channel_requests()
RETURNS TRIGGER AS $$
BEGIN
    -- Archive all access requests for the channel
    UPDATE public.access_requests
    SET status = 'archived'
    WHERE channel_id = OLD.id
    AND status = 'pending';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS archive_channel_requests_trigger ON public.channels;

CREATE TRIGGER archive_channel_requests_trigger
    BEFORE DELETE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION public.archive_channel_requests();

-- Add policy for channel deletion
CREATE POLICY "Channel admins can delete channels" ON public.channels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = channels.id
            AND channel_members.user_id = auth.uid()
            AND channel_members.role = 'admin'
        )
    );

-- =============================================================================
-- MIGRATION 5: Add Storage (20240320000001_add_storage.sql)
-- =============================================================================
SET search_path TO public;

-- Add attachment_path column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Create storage bucket for message attachments (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow viewing attachments if user is a member of the channel
CREATE POLICY "Channel members can view attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
        SELECT 1 FROM public.channel_members cm
        JOIN public.messages m ON m.channel_id = cm.channel_id
        WHERE m.attachment_path = storage.objects.name
        AND cm.user_id = auth.uid()
    )
);

-- Policy to allow uploading attachments if user is a member of the channel
CREATE POLICY "Channel members can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'message-attachments'
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.user_id = auth.uid()
    )
);

-- =============================================================================
-- MIGRATION 6: Extend Core Tables (20240321000000_extend_core_tables.sql)
-- =============================================================================
SET search_path TO public;

-- Add metadata columns to channels
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add metadata columns to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES public.users(id);

-- Create trigger to set channel creator
CREATE OR REPLACE FUNCTION public.set_channel_creator()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_channel_creator_trigger ON public.channels;

CREATE TRIGGER set_channel_creator_trigger
    BEFORE INSERT ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION public.set_channel_creator();

-- Create trigger to track message edits
CREATE OR REPLACE FUNCTION public.track_message_edits()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content != NEW.content THEN
        NEW.edited_at := NOW();
        NEW.edited_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_message_edits_trigger ON public.messages;

CREATE TRIGGER track_message_edits_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.track_message_edits();

-- =============================================================================
-- MIGRATION 7: Add Audit System (20240321000001_add_audit_system.sql)
-- =============================================================================
SET search_path TO public;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing audit logs
CREATE POLICY "Channel members can view audit logs"
ON public.audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = audit_logs.channel_id
        AND channel_members.user_id = auth.uid()
    )
);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_channel_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (channel_id, actor_id, action, details)
    VALUES (p_channel_id, auth.uid(), p_action, p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for access request status changes
CREATE OR REPLACE FUNCTION public.audit_channel_member_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            NEW.channel_id,
            'member_added',
            jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.role != NEW.role THEN
            PERFORM create_audit_log(
                NEW.channel_id,
                'member_role_changed',
                jsonb_build_object(
                    'user_id', NEW.user_id,
                    'old_role', OLD.role,
                    'new_role', NEW.role
                )
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            OLD.channel_id,
            'member_removed',
            jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for channel member changes
DROP TRIGGER IF EXISTS audit_channel_member_changes_trigger ON public.channel_members;

CREATE TRIGGER audit_channel_member_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.channel_members
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_channel_member_changes();

-- =============================================================================
-- MIGRATION 8: Add Notifications (20240321000002_add_notifications.sql)
-- =============================================================================
SET search_path TO public;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Create simple policy for updating notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create validation trigger function
CREATE OR REPLACE FUNCTION public.validate_notification_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id != OLD.id
        OR NEW.user_id != OLD.user_id
        OR NEW.type != OLD.type
        OR NEW.title != OLD.title
        OR NEW.content IS DISTINCT FROM OLD.content
        OR NEW.data IS DISTINCT FROM OLD.data
        OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Only the is_read field can be updated';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger
DROP TRIGGER IF EXISTS validate_notification_update_trigger ON public.notifications;

CREATE TRIGGER validate_notification_update_trigger
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_notification_update();

-- Function to create notifications for access request status changes
CREATE OR REPLACE FUNCTION public.notify_access_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the user who made the request
    INSERT INTO public.notifications (user_id, type, title, content, data)
    SELECT
        NEW.user_id,
        'access_request_' || NEW.status,
        CASE 
            WHEN NEW.status = 'approved' THEN 'Channel Access Approved'
            WHEN NEW.status = 'denied' THEN 'Channel Access Denied'
            ELSE 'Channel Access Request ' || NEW.status
        END,
        CASE 
            WHEN NEW.status = 'approved' THEN 'Your request to join the channel has been approved.'
            WHEN NEW.status = 'denied' THEN 'Your request to join the channel has been denied.'
            ELSE 'Your channel access request status has changed to ' || NEW.status
        END,
        jsonb_build_object(
            'channel_id', NEW.channel_id,
            'request_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status
        )
    WHERE NEW.status IS DISTINCT FROM OLD.status;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for access request status changes
DROP TRIGGER IF EXISTS notify_access_request_status_change_trigger ON public.access_requests;

CREATE TRIGGER notify_access_request_status_change_trigger
    AFTER UPDATE ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_access_request_status_change();

-- =============================================================================
-- MIGRATION 9: Add Message Features (20240321000003_add_message_features.sql)
-- =============================================================================
SET search_path TO public;

-- Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing reactions
CREATE POLICY "Users can view reactions in their channels"
ON public.reactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members cm
        JOIN public.messages m ON m.channel_id = cm.channel_id
        WHERE m.id = reactions.message_id
        AND cm.user_id = auth.uid()
    )
);

-- Create policy for adding reactions
CREATE POLICY "Users can add reactions in their channels"
ON public.reactions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channel_members cm
        JOIN public.messages m ON m.channel_id = cm.channel_id
        WHERE m.id = message_id
        AND cm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

-- Create policy for removing reactions
CREATE POLICY "Users can remove their own reactions"
ON public.reactions FOR DELETE
USING (user_id = auth.uid());

-- Function to toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_reaction(
    p_message_id UUID,
    p_emoji TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_removed BOOLEAN;
BEGIN
    -- Try to remove existing reaction
    WITH deletion AS (
        DELETE FROM public.reactions
        WHERE message_id = p_message_id
        AND user_id = auth.uid()
        AND emoji = p_emoji
        RETURNING id
    )
    SELECT EXISTS (SELECT 1 FROM deletion) INTO v_removed;

    -- If no reaction was removed, add new one
    IF NOT v_removed THEN
        INSERT INTO public.reactions (message_id, user_id, emoji)
        VALUES (p_message_id, auth.uid(), p_emoji);
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get message with reactions
CREATE OR REPLACE FUNCTION public.get_message_with_reactions(p_message_id UUID)
RETURNS TABLE (
    message_id UUID,
    content TEXT,
    user_id UUID,
    channel_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as message_id,
        m.content,
        m.user_id,
        m.channel_id,
        m.created_at,
        COALESCE(
            jsonb_object_agg(
                r.emoji,
                jsonb_build_object(
                    'count', COUNT(*),
                    'users', jsonb_agg(r.user_id)
                )
            ) FILTER (WHERE r.id IS NOT NULL),
            '{}'::jsonb
        ) as reactions
    FROM public.messages m
    LEFT JOIN public.reactions r ON r.message_id = m.id
    WHERE m.id = p_message_id
    GROUP BY m.id, m.content, m.user_id, m.channel_id, m.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MIGRATION 10: Enhance RLS Policies (20240321000004_enhance_rls_policies.sql)
-- =============================================================================
SET search_path TO public;

--
-- Channel Member Policies
--
DROP POLICY IF EXISTS "Users can view channel members in their channels" ON public.channel_members;
DROP POLICY IF EXISTS "Members can leave channels" ON public.channel_members;

-- Allow members to view other members in their channels
CREATE POLICY "Users can view channel members in their channels"
ON public.channel_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channel_members.channel_id
        AND cm.user_id = auth.uid()
    )
);

-- Allow members to leave channels (delete their own membership)
CREATE POLICY "Members can leave channels"
ON public.channel_members FOR DELETE
USING (
    user_id = auth.uid()
    AND role != 'admin' -- Prevent last admin from leaving
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channel_members.channel_id
        AND role = 'admin'
        AND user_id != auth.uid()
    )
);

--
-- Message Policies
--
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- View messages in channels they're members of
CREATE POLICY "Users can view messages in their channels"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

-- Create messages in channels they're members of
CREATE POLICY "Users can create messages in their channels"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

-- Edit their own messages
CREATE POLICY "Users can edit their own messages"
ON public.messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

-- Delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

--
-- Channel Policies
--
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Channel admins can update channel settings" ON public.channels;

-- View channels they're members of
CREATE POLICY "Users can view channels they are members of"
ON public.channels FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channels.id
        AND user_id = auth.uid()
    )
);

-- Anyone can create channels (they'll automatically become admin)
CREATE POLICY "Users can create channels"
ON public.channels FOR INSERT
WITH CHECK (true);

-- Channel settings (name, description, etc.) can only be updated by admins
CREATE POLICY "Channel admins can update channel settings"
ON public.channels FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channels.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- =============================================================================
-- MIGRATION 11: Add Performance Indexes (20240321000005_add_performance_indexes.sql)
-- =============================================================================
SET search_path TO public;

--
-- Message Indexes
--

-- For fetching messages in a channel (ordered by creation time)
CREATE INDEX IF NOT EXISTS idx_messages_channel_created 
ON public.messages (channel_id, created_at DESC);

-- For checking message ownership quickly
CREATE INDEX IF NOT EXISTS idx_messages_user 
ON public.messages (user_id);

--
-- Channel Member Indexes
--

-- For checking channel membership quickly
CREATE INDEX IF NOT EXISTS idx_channel_members_user 
ON public.channel_members (user_id);

-- For listing channel members
CREATE INDEX IF NOT EXISTS idx_channel_members_channel 
ON public.channel_members (channel_id);

-- For finding channel admins quickly
CREATE INDEX IF NOT EXISTS idx_channel_members_admin 
ON public.channel_members (channel_id, user_id) 
WHERE role = 'admin';

--
-- Access Request Indexes
--

-- For finding pending requests
CREATE INDEX IF NOT EXISTS idx_access_requests_pending 
ON public.access_requests (channel_id, user_id) 
WHERE status = 'pending';

-- For user's request history
CREATE INDEX IF NOT EXISTS idx_access_requests_user 
ON public.access_requests (user_id, created_at DESC);

--
-- Notification Indexes
--

-- For fetching user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notifications (user_id, created_at DESC) 
WHERE NOT is_read;

-- For general notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON public.notifications (user_id, created_at DESC);

--
-- Reaction Indexes
--

-- For fetching message reactions
CREATE INDEX IF NOT EXISTS idx_reactions_message 
ON public.reactions (message_id);

-- For checking user's reactions
CREATE INDEX IF NOT EXISTS idx_reactions_user 
ON public.reactions (user_id);

--
-- Audit Log Indexes
--

-- For fetching channel audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_channel 
ON public.audit_logs (channel_id, created_at DESC);

-- For user activity auditing
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor 
ON public.audit_logs (actor_id, created_at DESC); 