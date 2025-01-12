import { createContext, useContext, useMemo } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { MessageStore } from '@/store/messageStore';
import type { Message } from '@/store/types';
import { useChannelOperations } from './useChannel';

type MessageContextType = UseBoundStore<StoreApi<MessageStore>> | null;

export const MessageContext = createContext<MessageContextType>(null);

// Base store hook
export function useMessageStore() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}

// Selector hook for a single message
export function useMessage(messageId: string): Message | null {
  const store = useMessageStore();
  return useMemo(() => {
    const state = store.getState();
    return state.messages[messageId] || null;
  }, [store, messageId]);
}

// State hooks
export function useMessageLoading(): boolean {
  const store = useMessageStore();
  return useMemo(() => store.getState().loading, [store]);
}

export function useMessageError(): string | null {
  const store = useMessageStore();
  return useMemo(() => store.getState().error, [store]);
}

// Actions hook
export function useMessageActions() {
  const store = useMessageStore();
  return useMemo(() => {
    const { addMessage, updateMessage, deleteMessage, setLoading, setError, clearMessages } = store.getState();
    return {
      addMessage,
      updateMessage: async (messageId: string, content: string) => {
        const message = store.getState().messages[messageId];
        if (!message) throw new Error('Message not found');
        await updateMessage({ ...message, content });
      },
      deleteMessage,
      setLoading,
      setError,
      clearMessages,
    };
  }, [store]);
}

// Channel messages selector
export const useChannelMessages = (channelId: string): Message[] => {
  console.log('[useChannelMessages] Starting for channel:', channelId);
  
  const store = useMessageStore();
  const { getChannelAccess } = useChannelOperations();
  
  return useMemo(() => {
    console.log('[useChannelMessages] Running memo for channel:', channelId);
    
    const access = getChannelAccess(channelId);
    console.log('[useChannelMessages] Access state:', access);
    
    const state = store.getState();
    console.log('[useChannelMessages] Store state:', {
      totalMessages: Object.keys(state.messages).length,
      allChannels: Object.keys(state.channelMessages),
      currentChannel: channelId,
    });
    
    const messageIds = state.channelMessages[channelId] || [];
    console.log('[useChannelMessages] Found message IDs:', {
      channelId,
      count: messageIds.length,
      ids: messageIds,
    });
    
    const messages = messageIds
      .map(id => {
        const msg = state.messages[id];
        if (!msg) {
          console.warn('[useChannelMessages] Message not found in store:', { id, channelId });
        }
        return msg;
      })
      .filter((msg): msg is Message => {
        if (!msg) {
          return false;
        }
        return true;
      });
    
    console.log('[useChannelMessages] Returning messages:', {
      channelId,
      count: messages.length,
      messageIds: messages.map(m => m.id),
    });
    
    return messages;
  }, [channelId, store, getChannelAccess]);
};

// Thread messages selector
export function useThreadMessages(parentId: string): Message[] {
  const store = useMessageStore();
  return useMemo(() => {
    const state = store.getState();
    const messageIds = state.threadMessages[parentId] || [];
    return messageIds
      .map(id => state.messages[id])
      .filter((msg): msg is Message => msg != null);
  }, [store, parentId]);
} 