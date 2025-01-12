-- Set correct schema
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

-- migrate:down
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS reactions;
DROP FUNCTION IF EXISTS get_message_with_reactions;
DROP FUNCTION IF EXISTS toggle_reaction;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can add reactions in accessible channels" ON reactions;
DROP POLICY IF EXISTS "Users can see reactions in accessible channels" ON reactions;
DROP INDEX IF EXISTS idx_reactions_user;
DROP INDEX IF EXISTS idx_reactions_message;
DROP TABLE IF EXISTS reactions; 