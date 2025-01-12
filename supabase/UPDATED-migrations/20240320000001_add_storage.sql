-- Set correct schema
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