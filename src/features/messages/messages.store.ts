import { create } from 'zustand';
import type { MessageState, Message } from './messages.types';

interface MessageStore extends MessageState {
  // State setters
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export function createMessageStore() {
  // SSR safety check
  if (typeof window === 'undefined') {
    return null;
  }

  return create<MessageStore>()((set) => ({
    // Initial state
    messages: {},
    isLoading: true,
    error: null,

    // State setters
    setMessages: (messages) => {
      const messageMap = messages.reduce((acc, message) => {
        acc[message.id] = message;
        return acc;
      }, {} as Record<string, Message>);
      
      set({ messages: messageMap, error: null });
    },

    addMessage: (message) => 
      set((state) => ({
        messages: { ...state.messages, [message.id]: message },
        error: null,
      })),

    updateMessage: (messageId, updates) =>
      set((state) => ({
        messages: {
          ...state.messages,
          [messageId]: { ...state.messages[messageId], ...updates },
        },
      })),

    deleteMessage: (messageId) =>
      set((state) => {
        const { [messageId]: _, ...rest } = state.messages;
        return { messages: rest };
      }),

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
  }));
}
