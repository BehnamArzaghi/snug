'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button'
import { useChannelAccess } from '@/lib/hooks/useChannelAccess'
import { Check, X } from 'lucide-react'

interface ManageAccessRequestsProps {
  channelId: string
  className?: string
}

export const ManageAccessRequests = memo(function ManageAccessRequests({ channelId, className }: ManageAccessRequestsProps) {
  const { isAdmin, accessRequests, loading, handleRequest } = useChannelAccess(channelId)

  if (!isAdmin || loading || accessRequests.length === 0) return null

  return (
    <div className={className}>
      <h3 className="font-semibold mb-4">Pending Access Requests</h3>
      <div className="space-y-4">
        {accessRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
          >
            <div>
              <p className="font-medium">{request.user?.name}</p>
              <p className="text-sm text-muted-foreground">{request.user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRequest(request.id, true)}
                className="text-green-500 hover:text-green-600"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRequest(request.id, false)}
                className="text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}) 