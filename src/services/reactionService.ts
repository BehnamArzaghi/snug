import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Reaction = Database['public']['Tables']['reactions']['Row'];

/**
 * Fetch reactions for a message
 */
export async function fetchMessageReactions(messageId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Add a reaction to a message
 */
export async function addReaction(payload: {
  message_id: string;
  user_id: string;
  emoji: string;
}): Promise<Reaction> {
  const { data, error } = await supabase
    .from('reactions')
    .insert({
      ...payload,
      created_at: new Date().toISOString()
    })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a reaction
 */
export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw error;
}

/**
 * Check if user has reacted with specific emoji
 */
export async function hasUserReacted(
  messageId: string,
  userId: string,
  emoji: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Get reaction counts for a message
 */
export async function getReactionCounts(
  messageId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('message_id', messageId);

  if (error) throw error;

  return data.reduce((acc, { emoji }) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
