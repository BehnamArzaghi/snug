-- Set correct schema
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

-- Trigger function for channel member changes
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