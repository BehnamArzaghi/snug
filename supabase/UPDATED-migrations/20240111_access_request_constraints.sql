-- Set correct schema
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