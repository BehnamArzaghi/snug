-- Set correct schema
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