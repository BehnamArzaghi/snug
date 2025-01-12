import { useEffect, useCallback, useState, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Message } from '@/store/types';
import { useMessageStore, useMessageActions } from '@/hooks/useMessage';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useChannelOperations } from './useChannel';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { validateMessage, MessageValidationError } from '@/utils/messageErrors';

type MessagePayload = RealtimePostgresChangesPayload<{
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
}>;

export const useMessageOperations = (channelId: string) => {
  // 1. First, all required context/client hooks
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const store = useMessageStore();
  const { getChannelAccess } = useChannelOperations();
  
  // 2. All state hooks grouped together
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 3. All refs after state
  const loadingRef = useRef(false);
  
  // 4. Action hooks
  const { 
    addMessage, 
    updateMessage: updateMessageInStore, 
    deleteMessage: removeMessage, 
    setError,
  } = useMessageActions();

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
        (payload: MessagePayload) => {
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              validateMessage(payload.new);
              addMessage(payload.new);
            } else if (payload.eventType === 'DELETE' && payload.old?.id) {
              removeMessage(payload.old.id);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              validateMessage(payload.new);
              addMessage(payload.new);
            }
          } catch (error) {
            if (error instanceof MessageValidationError) {
              console.error(`[Subscription] Invalid message data: ${error.message}`, {
                field: error.field,
                value: error.value
              });
            } else {
              console.error('[Subscription] Error processing message:', error);
            }
          }
        }
      )
      .subscribe();

    setSubscription(newSubscription);

    return () => {
      newSubscription.unsubscribe();
    };
  }, [channelId, getChannelAccess, addMessage, removeMessage, supabase]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!channelId) {
      console.log('[loadMessages] No channelId provided');
      return;
    }

    console.log('[loadMessages] Starting load for channel:', channelId);
    setIsLoading(true);
    setError(null);
    
    try {
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

      // Add new messages
      let addedCount = 0;
      let errorCount = 0;

      for (const messageData of data) {
        try {
          validateMessage(messageData);
          addMessage(messageData);
          addedCount++;
        } catch (error) {
          errorCount++;
          if (error instanceof MessageValidationError) {
            console.warn('[loadMessages] Invalid message data:', {
              messageId: messageData.id,
              field: error.field,
              value: error.value,
              error: error.message
            });
          } else {
            console.error('[loadMessages] Error processing message:', error);
          }
        }
      }

      console.log('[loadMessages] Results:', {
        total: data.length,
        added: addedCount,
        errors: errorCount
      });

    } catch (error) {
      console.error('[loadMessages] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [channelId, supabase, addMessage, removeMessage, setError, store]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, parentMessageId?: string) => {
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

      try {
        validateMessage(data);
        addMessage(data);
        toast.success('Message sent');
      } catch (error) {
        if (error instanceof MessageValidationError) {
          throw new Error(`Invalid message data: ${error.message}`);
        }
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Error sending message:', error);
      toast.error(errorMessage);
    }
  }, [user, channelId, getChannelAccess, supabase, addMessage]);

  // Update an existing message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
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

      try {
        validateMessage(data);
        await updateMessageInStore(messageId, data.content);
        toast.success('Message updated');
      } catch (error) {
        if (error instanceof MessageValidationError) {
          throw new Error(`Invalid message data: ${error.message}`);
        }
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update message';
      console.error('Error updating message:', error);
      toast.error(errorMessage);
    }
  }, [user, supabase, updateMessageInStore]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
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
  }, [user, supabase, removeMessage]);

  return {
    loadMessages,
    isLoading,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
}; 