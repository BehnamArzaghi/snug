import { useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Message } from '@/store/types';
import { useMessageStore, useMessageActions } from '@/hooks/useMessage';

export const useMessageOperations = (channelId: string) => {
  const supabase = useSupabaseClient();
  const store = useMessageStore();
  const { 
    addMessage, 
    updateMessage: updateMessageInStore, 
    deleteMessage: removeMessage, 
    setLoading, 
    setError,
  } = useMessageActions();

  const messages = store.getState().messages;

  // Load initial messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      data.forEach((message: Message) => addMessage(message));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (content: string, parentMessageId?: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            channel_id: channelId,
            parent_message_id: parentMessageId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      addMessage(data);
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      return null;
    }
  };

  // Update a message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const currentMessage = messages[messageId];
      if (!currentMessage) throw new Error('Message not found');

      const optimisticMessage = {
        ...currentMessage,
        content,
        updated_at: new Date().toISOString(),
      };
      updateMessageInStore(optimisticMessage);

      // Make the API call
      const { data, error } = await supabase
        .from('messages')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        // Revert optimistic update on error
        updateMessageInStore(currentMessage);
        throw error;
      }

      // Update with actual server data
      updateMessageInStore(data);
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update message');
      throw error;
    }
  }, [messages, updateMessageInStore, supabase, setError]);

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      removeMessage(messageId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete message');
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addMessage(payload.new as Message);
          } else if (payload.eventType === 'UPDATE') {
            updateMessageInStore(payload.new as Message);
          } else if (payload.eventType === 'DELETE') {
            removeMessage(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, addMessage, updateMessageInStore, removeMessage]);

  return {
    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
}; 