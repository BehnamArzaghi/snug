'use client';

import { useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/lib/database.types';
import { useAuth } from '@/components/providers/AuthProvider';
import { Lock, Shield } from 'lucide-react';
import { useChannelOperations } from '@/hooks/useChannel';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const ChannelList = memo(function ChannelList() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useSupabaseClient<Database>();
  const { 
    channels, 
    loading, 
    error,
    setChannels,
    setLoading,
    setError,
    updateUnreadCount,
    setCurrentChannel,
  } = useChannelOperations();

  const fetchChannels = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get all channels and their membership info
      const { data: channelsWithMembership, error: channelsError } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members (
            role,
            user_id
          )
        `)
        .order('name');
      
      if (channelsError) throw channelsError;

      // Get unread message counts
      const { data: unreadCounts, error: unreadError } = await supabase
        .rpc('get_unread_counts', {
          user_id: user.id,
          since_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        });

      if (unreadError) throw unreadError;

      // Process the channels with membership and unread info
      const processedChannels = channelsWithMembership?.map(channel => {
        const membership = channel.channel_members?.find(
          (m: Database['public']['Tables']['channel_members']['Row']) => m.user_id === user.id
        );
        const unreadCount = unreadCounts?.find(
          (c: { channel_id: string; unread_count: number }) => c.channel_id === channel.id
        );

        return {
          ...channel,
          is_admin: membership?.role === 'admin',
          is_member: !!membership,
          member_role: membership?.role,
          unread_count: unreadCount?.unread_count ?? 0
        };
      }) || [];

      setChannels(processedChannels);
      setError(null);
    } catch (e) {
      setError('Failed to load channels');
      console.error('Error loading channels:', e);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, setChannels, setLoading, setError]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to channel changes
    const channelSubscription = supabase
      .channel('channel-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channels' },
        () => fetchChannels()
      )
      .subscribe();

    // Subscribe to channel_members changes
    const membershipSubscription = supabase
      .channel('membership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_members',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchChannels()
      )
      .subscribe();

    // Subscribe to new messages for unread counts
    const messageSubscription = supabase
      .channel('message-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchChannels()
      )
      .subscribe();

    // Initial fetch
    fetchChannels();

    // Cleanup subscriptions
    return () => {
      channelSubscription.unsubscribe();
      membershipSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [user, supabase, fetchChannels]);

  const handleChannelClick = useCallback(async (channelId: string) => {
    if (!user) return;
    
    try {
      // Update last_read for the channel
      const { error } = await supabase
        .rpc('mark_channel_as_read', {
          p_channel_id: channelId,
          p_user_id: user.id
        });

      if (error) throw error;

      // Update local state
      updateUnreadCount(channelId, 0);
      setCurrentChannel(channelId);
    } catch (error) {
      console.error('Error updating last read:', error);
      toast.error('Failed to mark channel as read');
    }

    router.push(`/channels/${channelId}`);
  }, [user, supabase, router, updateUnreadCount, setCurrentChannel]);

  if (loading) {
    return <div className="p-4">Loading channels...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const currentChannelId = router.query.channelId as string;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {channels.map((channel) => (
          <div key={channel.id} className="group">
            <div className="flex items-center">
              <button
                onClick={() => handleChannelClick(channel.id)}
                className={`flex-1 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                  currentChannelId === channel.id
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  {channel.is_private && (
                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {channel.member_role === 'admin' && (
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" aria-label="You're an admin" />
                  )}
                  <span className="text-sm font-medium"># {channel.name}</span>
                  {(channel.unread_count ?? 0) > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {channel.unread_count}
                    </Badge>
                  )}
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}); 