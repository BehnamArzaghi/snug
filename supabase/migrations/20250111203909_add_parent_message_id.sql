-- Add parent_message_id column to messages table
ALTER TABLE messages
ADD COLUMN parent_message_id UUID REFERENCES messages(id) NULL;

-- Add index for better query performance on threads
CREATE INDEX idx_messages_parent_message_id ON messages(parent_message_id);

-- Add comment for documentation
COMMENT ON COLUMN messages.parent_message_id IS 'References the parent message in a thread. NULL for top-level messages.';
