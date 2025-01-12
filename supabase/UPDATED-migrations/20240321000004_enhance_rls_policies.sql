-- Set correct schema
SET search_path TO public;

--
-- Channel Member Policies
--
DROP POLICY IF EXISTS "Users can view channel members in their channels" ON public.channel_members;
DROP POLICY IF EXISTS "Members can leave channels" ON public.channel_members;

-- Allow members to view other members in their channels
CREATE POLICY "Users can view channel members in their channels"
ON public.channel_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channel_members.channel_id
        AND cm.user_id = auth.uid()
    )
);

-- Allow members to leave channels (delete their own membership)
CREATE POLICY "Members can leave channels"
ON public.channel_members FOR DELETE
USING (
    user_id = auth.uid()
    AND role != 'admin' -- Prevent last admin from leaving
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channel_members.channel_id
        AND role = 'admin'
        AND user_id != auth.uid()
    )
);

--
-- Message Policies
--
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- View messages in channels they're members of
CREATE POLICY "Users can view messages in their channels"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

-- Create messages in channels they're members of
CREATE POLICY "Users can create messages in their channels"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

-- Edit their own messages
CREATE POLICY "Users can edit their own messages"
ON public.messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

-- Delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

--
-- Channel Policies
--
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Channel admins can update channel settings" ON public.channels;

-- View channels they're members of
CREATE POLICY "Users can view channels they are members of"
ON public.channels FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channels.id
        AND user_id = auth.uid()
    )
);

-- Anyone can create channels (they'll automatically become admin)
CREATE POLICY "Users can create channels"
ON public.channels FOR INSERT
WITH CHECK (true);

-- Channel settings (name, description, etc.) can only be updated by admins
CREATE POLICY "Channel admins can update channel settings"
ON public.channels FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = channels.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
); 