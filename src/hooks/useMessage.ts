import { createContext, useContext, useMemo } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { MessageStore } from '@/store/messageStore';
import type { Message } from '@/store/types';

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
      updateMessage,
      deleteMessage,
      setLoading,
      setError,
      clearMessages,
    };
  }, [store]);
}

// Channel messages selector
export function useChannelMessages(channelId: string): Message[] {
  const store = useMessageStore();
  return useMemo(() => {
    const state = store.getState();
    const messageIds = state.channelMessages[channelId] || [];
    return messageIds
      .map(id => state.messages[id])
      .filter((msg): msg is Message => msg != null);
  }, [store, channelId]);
}

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