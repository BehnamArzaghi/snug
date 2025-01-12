-- Set correct schema
SET search_path TO public;

-- Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id, status)
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Policies for access_requests

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.access_requests FOR SELECT
USING (auth.uid() = user_id);

-- Channel admins can view requests for their channels
CREATE POLICY "Channel admins can view channel requests"
ON public.access_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
        AND channel_members.role = 'admin'
    )
);

-- Users can create requests for channels they're not members of
CREATE POLICY "Users can create access requests"
ON public.access_requests FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.access_requests ar
        WHERE ar.channel_id = access_requests.channel_id
        AND ar.user_id = auth.uid()
        AND ar.status = 'pending'
    )
);

-- Channel admins can update request status
CREATE POLICY "Channel admins can update request status"
ON public.access_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
        AND channel_members.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_members.channel_id = access_requests.channel_id
        AND channel_members.user_id = auth.uid()
        AND channel_members.role = 'admin'
    )
); 