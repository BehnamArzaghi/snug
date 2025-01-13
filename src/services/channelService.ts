import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Channel = Database['public']['Tables']['channels']['Row'];
type ChannelMember = Database['public']['Tables']['channel_members']['Row'];

/**
 * Fetch all channels (optionally filtered by user membership)
 */
export async function fetchChannels(userId?: string): Promise<Channel[]> {
  let query = supabase.from('channels').select('*');
  
  if (userId) {
    query = query.eq('created_by', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single channel by ID
 */
export async function fetchChannelById(channelId: string): Promise<Channel> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new channel
 */
export async function createChannel(payload: {
  name: string;
  description?: string;
  is_private?: boolean;
  created_by: string;
}): Promise<Channel> {
  const { data, error } = await supabase
    .from('channels')
    .insert({
      ...payload,
      created_at: new Date().toISOString()
    })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update channel details
 */
export async function updateChannel(
  channelId: string,
  updates: Partial<Channel>
): Promise<Channel> {
  const { data, error } = await supabase
    .from('channels')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', channelId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add member to channel
 */
export async function addChannelMember(
  channelId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<ChannelMember> {
  const { data, error } = await supabase
    .from('channel_members')
    .insert({
      channel_id: channelId,
      user_id: userId,
      role,
      created_at: new Date().toISOString()
    })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove member from channel
 */
export async function removeChannelMember(
  channelId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('channel_id', channelId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Check if user is member of channel
 */
export async function isChannelMember(
  channelId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('channel_members')
    .select('id')
    .eq('channel_id', channelId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}
