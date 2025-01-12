-- =============================================================================
-- MIGRATION: Add Unread Counts Function (20240321000006_add_unread_counts.sql)
-- =============================================================================
SET search_path TO public;

-- Add last_read column to channel_members
ALTER TABLE channel_members
ADD COLUMN IF NOT EXISTS last_read TIMESTAMP WITH TIME ZONE;

-- Add index for faster unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at
ON messages (created_at);

CREATE INDEX IF NOT EXISTS idx_channel_members_last_read
ON channel_members (last_read);

-- Function to get unread message counts for channels
CREATE OR REPLACE FUNCTION get_unread_counts(
  user_id UUID,
  since_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  channel_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.channel_id,
    COUNT(m.id)::BIGINT as unread_count
  FROM messages m
  JOIN channel_members cm ON cm.channel_id = m.channel_id
  WHERE 
    cm.user_id = get_unread_counts.user_id
    AND m.created_at >= get_unread_counts.since_timestamp
    AND (
      cm.last_read IS NULL 
      OR m.created_at > cm.last_read
    )
    AND m.user_id != get_unread_counts.user_id -- Don't count user's own messages
  GROUP BY m.channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark channel as read
CREATE OR REPLACE FUNCTION mark_channel_as_read(
  p_channel_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE channel_members
  SET last_read = NOW()
  WHERE channel_id = p_channel_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 