-- Set correct schema
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