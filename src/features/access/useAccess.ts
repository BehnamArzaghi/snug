import { useContext } from 'react';
import { AccessContext } from './AccessProvider';
import type { AccessRequest } from './access.types';

export function useAccess() {
  const store = useContext(AccessContext);
  if (!store) {
    throw new Error('useAccess must be used within AccessProvider');
  }

  const requests = store((s) => s.requests);
  const isLoading = store((s) => s.isLoading);
  const error = store((s) => s.error);

  const requestsList = Object.values(requests);
  const pendingRequests = requestsList.filter(r => r.status === 'pending');
  const approvedRequests = requestsList.filter(r => r.status === 'approved');
  const deniedRequests = requestsList.filter(r => r.status === 'denied');

  return {
    requests,
    requestsList,
    pendingRequests,
    approvedRequests,
    deniedRequests,
    isLoading,
    error
  };
}
