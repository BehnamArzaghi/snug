import type { Database } from '@/lib/database.types';

export type AccessRequest = Database['public']['Tables']['access_requests']['Row'];

export interface AccessState {
  requests: Record<string, AccessRequest>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRequests: (requests: AccessRequest[]) => void;
  addRequest: (request: AccessRequest) => void;
  updateRequest: (requestId: string, updates: Partial<AccessRequest>) => void;
  removeRequest: (requestId: string) => void;
}
