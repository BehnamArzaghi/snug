import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

/**
 * Fetch user by ID
 */
export async function fetchUserById(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch multiple users by IDs
 */
export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);

  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    avatar_url?: string;
  }
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user's last seen timestamp
 */
export async function updateLastSeen(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      last_seen: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Search users by name or email
 */
export async function searchUsers(
  query: string,
  limit = 10
): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get online users (seen in last 5 minutes)
 */
export async function getOnlineUsers(): Promise<User[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .gt('last_seen', fiveMinutesAgo);

  if (error) throw error;
  return data;
}
