'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { useChannelAccess } from '@/lib/hooks/useChannelAccess';

interface RequestAccessButtonProps {
  channelId: string;
  className?: string;
}

export const RequestAccessButton = memo(function RequestAccessButton({ 
  channelId, 
  className 
}: RequestAccessButtonProps) {
  const { isMember, hasPendingRequest, requestAccess } = useChannelAccess(channelId);

  if (isMember) return null;

  return (
    <Button
      variant="outline"
      onClick={requestAccess}
      disabled={hasPendingRequest}
      className={className}
    >
      {hasPendingRequest ? 'Request Pending' : 'Request Access'}
    </Button>
  );
}); 