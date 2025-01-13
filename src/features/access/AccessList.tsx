import { useEffect } from 'react';
import { useAccess } from './useAccess';
import { useAccessOperations } from './useAccessOperations';
import type { AccessRequest } from './access.types';

interface AccessListProps {
  channelId: string;
  onApprove?: (request: AccessRequest) => void;
  onDeny?: (request: AccessRequest) => void;
}

export function AccessList({ channelId, onApprove, onDeny }: AccessListProps) {
  const { pendingRequests, isLoading, error } = useAccess();
  const { loadChannelRequests, handleAccessRequest } = useAccessOperations();

  useEffect(() => {
    loadChannelRequests(channelId);
  }, [channelId, loadChannelRequests]);

  if (isLoading) {
    return <div className="p-4">Loading access requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (pendingRequests.length === 0) {
    return <div className="p-4 text-gray-500">No pending access requests</div>;
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <div 
          key={request.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <div>
            <p className="font-medium">{request.user_id}</p>
            <p className="text-sm text-gray-500">
              Requested: {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => {
                handleAccessRequest(request.id, 'approved')
                  .then(() => onApprove?.(request));
              }}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Approve
            </button>
            <button
              onClick={() => {
                handleAccessRequest(request.id, 'denied')
                  .then(() => onDeny?.(request));
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
