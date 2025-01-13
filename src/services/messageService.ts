import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

/**
 * Fetch messages for a channel
 */
export async function fetchMessages(
  channelId: string,
  limit = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Fetch a single message by ID
 */
export async function fetchMessageById(messageId: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new message
 */
export async function createMessage(payload: {
  channel_id: string;
  user_id: string;
  content: string;
  file_url?: string;
  parent_message_id?: string;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      ...payload,
      created_at: new Date().toISOString()
    })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a message
 */
export async function updateMessage(
  messageId: string,
  updates: {
    content?: string;
    file_url?: string;
    edited_by: string;
  }
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .update({
      ...updates,
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

/**
 * Fetch thread messages
 */
export async function fetchThreadMessages(
  parentMessageId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('parent_message_id', parentMessageId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
