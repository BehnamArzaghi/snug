import { useContext } from 'react';
import { AccessContext } from './AccessProvider';
import {
  createAccessRequest,
  updateAccessRequestStatus,
  fetchAccessRequests,
  deleteAccessRequest,
  checkPendingRequest
} from '@/services/accessService';
import type { AccessRequest } from './access.types';

/**
 * Provides access request operations, integrating the access service
 * with the local store. Follows the pattern from the Service Boilerplate
 * where operations handle loading/error states and service calls.
 */
export function useAccessOperations() {
  const store = useContext(AccessContext);
  if (!store) {
    throw new Error('useAccessOperations must be used within <AccessProvider>.');
  }

  const setLoading = store((s) => s.setLoading);
  const setError = store((s) => s.setError);
  const addRequest = store((s) => s.addRequest);
  const updateRequest = store((s) => s.updateRequest);
  const removeRequest = store((s) => s.removeRequest);
  const setRequests = store((s) => s.setRequests);

  /**
   * Load all access requests for a channel
   */
  async function loadChannelRequests(channelId: string) {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchAccessRequests(channelId);
      setRequests(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access requests');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Request access to a channel
   */
  async function requestAccess(channelId: string, userId: string) {
    setLoading(true);
    setError(null);
    try {
      // First check if request already exists
      const hasPending = await checkPendingRequest(channelId, userId);
      if (hasPending) {
        throw new Error('Access request already pending');
      }

      const newRequest = await createAccessRequest(channelId, userId);
      addRequest(newRequest);
      return newRequest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request access');
      throw err; // Re-throw for UI handling
    } finally {
      setLoading(false);
    }
  }

  /**
   * Approve or deny an access request
   */
  async function handleAccessRequest(
    requestId: string,
    status: 'approved' | 'denied'
  ) {
    setLoading(true);
    setError(null);
    try {
      const updatedRequest = await updateAccessRequestStatus(requestId, status);
      updateRequest(requestId, updatedRequest);
      return updatedRequest;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${status} request`);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete an access request
   */
  async function cancelAccessRequest(requestId: string) {
    setLoading(true);
    setError(null);
    try {
      await deleteAccessRequest(requestId);
      removeRequest(requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    loadChannelRequests,
    requestAccess,
    handleAccessRequest,
    cancelAccessRequest,
  };
}
