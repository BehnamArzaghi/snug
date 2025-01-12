-- Set correct schema
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