-- Set correct schema
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