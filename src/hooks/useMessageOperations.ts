import { useEffect, useCallback, useState, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Message } from '@/store/types';
import { useMessageStore, useMessageActions } from '@/hooks/useMessage';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useChannelOperations } from './useChannel';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type for the response from Supabase
type MessageWithUser = {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  file_url: string | null;
  created_at: string;
  attachment_path: string | null;
  edited_at: string | null;
  edited_by: string | null;
  parent_message_id: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
    last_seen: string | null;
  };
};

export const useMessageOperations = (channelId: string) => {
  // 1. First, all required context/client hooks
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const store = useMessageStore();
  const { getChannelAccess } = useChannelOperations();
  
  // 2. All state hooks grouped together
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  
  // 3. All refs after state
  const loadingRef = useRef(false);
  
  // 4. Action hooks
  const { 
    addMessage, 
    updateMessage: updateMessageInStore, 
    deleteMessage: removeMessage, 
    setLoading, 
    setError,
    clearMessages,
  } = useMessageActions();

  // 5. Derived state
  const messages = store.getState().messages;
  const MAX_RETRIES = 3;
  const PAGE_SIZE = 50;

  // Cleanup subscriptions when channel changes
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(null);
      }
    };
  }, [channelId, subscription]);

  // Setup new subscription
  useEffect(() => {
    const access = getChannelAccess(channelId);
    if (!access.canRead) return;

    const newSubscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            addMessage(payload.new as Message);
          } else if (payload.eventType === 'DELETE') {
            removeMessage(payload.old.id);
          } else if (payload.eventType === 'UPDATE') {
            const message = payload.new as Message;
            if (!message.user || typeof message.user !== 'object') {
              console.warn('[subscription] Message missing or invalid user data:', message.id);
              return;
            }
            addMessage(message); // Use addMessage since it handles updates too
          }
        }
      )
      .subscribe();

    setSubscription(newSubscription);

    return () => {
      newSubscription.unsubscribe();
    };
  }, [channelId, getChannelAccess]);

  // Load initial messages with retry mechanism
  const loadMessages = useCallback(async (retry = false) => {
    if (!channelId) {
      console.log('[loadMessages] No channelId provided');
      return;
    }

    console.log('[loadMessages] Starting load for channel:', channelId);
    setIsLoading(true);
    setError(null);
    
    try {
      // Log the query we're about to make
      console.log('[loadMessages] Querying Supabase with:', {
        channelId,
        table: 'messages',
        select: `id, content, channel_id, user_id, file_url, created_at, attachment_path, edited_at, edited_by, parent_message_id, user:users!messages_user_id_fkey`
      });

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          channel_id,
          user_id,
          file_url,
          created_at,
          attachment_path,
          edited_at,
          edited_by,
          parent_message_id,
          user:users!messages_user_id_fkey (
            id,
            name,
            email,
            avatar_url,
            created_at,
            last_seen
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      console.log('[loadMessages] Raw response:', { data, error, channelId });

      if (error) {
        console.error('[loadMessages] Supabase error:', error);
        setError(error.message);
        return;
      }

      if (!Array.isArray(data)) {
        console.error('[loadMessages] Invalid response format:', data);
        setError('Invalid response format from server');
        return;
      }

      // Clear existing messages for this channel first
      const state = store.getState();
      const existingIds = state.channelMessages[channelId] || [];
      console.log('[loadMessages] Clearing existing messages:', existingIds.length);
      existingIds.forEach(id => removeMessage(id));

      console.log('[loadMessages] Processing', data.length, 'messages');
      
      // Add new messages
      let addedCount = 0;
      data.forEach((messageData: any) => {
        if (!messageData.user || typeof messageData.user !== 'object') {
          console.warn('[loadMessages] Skipping message with invalid user data:', messageData.id);
          return;
        }

        const message: Message = {
          id: messageData.id,
          content: messageData.content,
          channel_id: messageData.channel_id,
          user_id: messageData.user_id,
          file_url: messageData.file_url,
          created_at: messageData.created_at,
          attachment_path: messageData.attachment_path,
          edited_at: messageData.edited_at,
          edited_by: messageData.edited_by,
          parent_message_id: messageData.parent_message_id,
          user: messageData.user
        };
        
        console.log('[loadMessages] Adding message:', {
          id: message.id,
          content: message.content,
          channelId: message.channel_id
        });
        addMessage(message);
        addedCount++;
      });

      console.log('[loadMessages] Successfully added', addedCount, 'messages');

    } catch (error) {
      console.error('[loadMessages] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [channelId, supabase, addMessage, removeMessage, setError, store]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingRef.current) {
      loadMessages();
    }
  }, [hasMore, loadMessages]);

  // Load messages when channel changes
  useEffect(() => {
    console.log('[Channel Switch] Starting for channel:', channelId);
    let isMounted = true;
    
    const load = async () => {
      try {
        if (!isMounted) return;
        await loadMessages();
      } catch (error) {
        console.error('[Channel Switch] Error loading messages:', error);
      }
    };
    
    load();
    
    return () => {
      console.log('[Channel Switch] Cleanup for channel:', channelId);
      isMounted = false;
      // Only clear messages for this specific channel
      const state = store.getState();
      const messageIds = state.channelMessages[channelId] || [];
      messageIds.forEach(id => {
        const message = state.messages[id];
        if (message && message.channel_id === channelId) {
          removeMessage(id);
        }
      });
    };
  }, [channelId, loadMessages, removeMessage, store]);

  // Send a new message
  const sendMessage = async (content: string, parentMessageId?: string) => {
    if (!user) {
      const error = 'You must be logged in to send messages';
      toast.error(error);
      return;
    }

    const access = getChannelAccess(channelId);
    if (!access.canWrite) {
      const error = 'You do not have permission to send messages in this channel';
      toast.error(error);
      return;
    }

    try {
      const messageData = {
        content: content.trim(),
        channel_id: channelId,
        user_id: user.id,
        parent_message_id: parentMessageId || null,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          id,
          content,
          channel_id,
          user_id,
          file_url,
          created_at,
          attachment_path,
          edited_at,
          edited_by,
          parent_message_id,
          user:users!messages_user_id_fkey (
            id,
            name,
            email,
            avatar_url,
            created_at,
            last_seen
          )
        `)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');
      if (!data.user || typeof data.user !== 'object') {
        throw new Error('Invalid user data in response');
      }

      // Type guard to ensure user data matches our interface
      const isValidUser = (user: any): user is Message['user'] => {
        return (
          typeof user.id === 'string' &&
          typeof user.name === 'string' &&
          typeof user.email === 'string' &&
          (user.avatar_url === null || typeof user.avatar_url === 'string') &&
          typeof user.created_at === 'string' &&
          (user.last_seen === null || typeof user.last_seen === 'string')
        );
      };

      if (!isValidUser(data.user)) {
        throw new Error('User data does not match expected format');
      }

      // Now TypeScript knows data.user matches our Message['user'] type
      const message: Message = {
        id: data.id,
        content: data.content,
        channel_id: data.channel_id,
        user_id: data.user_id,
        file_url: data.file_url,
        created_at: data.created_at,
        attachment_path: data.attachment_path,
        edited_at: data.edited_at,
        edited_by: data.edited_by,
        parent_message_id: data.parent_message_id,
        user: data.user
      };
      addMessage(message);
      toast.success('Message sent');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Error sending message:', error);
      toast.error(errorMessage);
    }
  };

  // Update an existing message
  const updateMessage = async (messageId: string, content: string) => {
    if (!user) {
      toast.error('You must be logged in to update messages');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: content.trim(),
          edited_at: new Date().toISOString(),
          edited_by: user.id,
        })
        .eq('id', messageId)
        .eq('user_id', user.id) // Ensure user owns the message
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from update');

      updateMessageInStore(messageId, data);
      toast.success('Message updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update message';
      console.error('Error updating message:', error);
      toast.error(errorMessage);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete messages');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id); // Ensure user owns the message

      if (error) throw error;

      removeMessage(messageId);
      toast.success('Message deleted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      console.error('Error deleting message:', error);
      toast.error(errorMessage);
    }
  };

  return {
    loadMessages,
    loadMoreMessages,
    hasMore,
    isLoading,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
}; 