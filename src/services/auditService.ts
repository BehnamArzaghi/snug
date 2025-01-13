import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

/**
 * Fetch audit logs with optional filtering
 */
export async function fetchAuditLogs(
  channelId?: string,
  actorId?: string,
  limit = 50
): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (channelId) {
    query = query.eq('channel_id', channelId);
  }
  if (actorId) {
    query = query.eq('actor_id', actorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(payload: {
  channel_id?: string;
  actor_id: string;
  action: string;
  details?: Record<string, any>;
}): Promise<AuditLog> {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      ...payload,
      created_at: new Date().toISOString()
    })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch recent audit logs for a specific action type
 */
export async function fetchRecentActionLogs(
  action: string,
  limit = 10
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
