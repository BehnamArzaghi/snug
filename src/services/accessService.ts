import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type AccessRequest = Database['public']['Tables']['access_requests']['Row'];

/**
 * Fetch access requests for a channel
 */
export async function fetchAccessRequests(channelId: string): Promise<AccessRequest[]> {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('channel_id', channelId);
  
  if (error) throw error;
  return data;
}

/**
 * Create a new access request
 */
export async function createAccessRequest(
  channelId: string,
  userId: string
): Promise<AccessRequest> {
  const payload = {
    channel_id: channelId,
    user_id: userId,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('access_requests')
    .insert(payload)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update access request status (approve/deny)
 */
export async function updateAccessRequestStatus(
  requestId: string,
  status: 'approved' | 'denied'
): Promise<AccessRequest> {
  const { data, error } = await supabase
    .from('access_requests')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an access request
 */
export async function deleteAccessRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('access_requests')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Check if user has pending access request for channel
 */
export async function checkPendingRequest(
  channelId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('access_requests')
    .select('id')
    .eq('channel_id', channelId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return !!data;
}
