import { create } from 'zustand';
import type { AccessState, AccessRequest } from './access.types';

/**
 * Creates the access store with SSR safety
 */
export function createAccessStore() {
  // Return null during SSR
  if (typeof window === 'undefined') return null;

  return create<AccessState>((set, get) => ({
    // State
    requests: {},
    isLoading: false,
    error: null,

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    
    setRequests: (requests) => set({
      requests: requests.reduce((acc, request) => {
        acc[request.id] = request;
        return acc;
      }, {} as Record<string, AccessRequest>)
    }),

    addRequest: (request) => set((state) => ({
      requests: {
        ...state.requests,
        [request.id]: request
      }
    })),

    updateRequest: (requestId, updates) => set((state) => {
      const request = state.requests[requestId];
      if (!request) return state;

      return {
        requests: {
          ...state.requests,
          [requestId]: { ...request, ...updates }
        }
      };
    }),

    removeRequest: (requestId) => set((state) => {
      const { [requestId]: removed, ...remaining } = state.requests;
      return { requests: remaining };
    })
  }));
}
