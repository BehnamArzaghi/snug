import { create, StoreApi, UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Message } from './types';

// Define the store state type
export interface MessageState {
  messages: Record<string, Message>;
  channelMessages: Record<string, string[]>;
  threadMessages: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

// Define the store actions type
export interface MessageActions {
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

// Combine state and actions for the full store type
export type MessageStore = MessageState & MessageActions;

// Define the store type
type StoreType = UseBoundStore<StoreApi<MessageStore>>;

// Define initial state
const initialState: MessageState = {
  messages: {},
  channelMessages: {},
  threadMessages: {},
  loading: false,
  error: null,
};

let store: StoreType | null = null;

const createMessageStore = () => {
  if (typeof window === 'undefined') return null;
  
  if (store) return store;

  store = create<MessageStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        addMessage: (message: Message) =>
          set((state) => {
            const newMessages = { ...state.messages, [message.id]: message };
            const channelId = message.channel_id;
            const parentId = message.parent_message_id;

            const channelMessages = { ...state.channelMessages };
            if (!parentId) {
              channelMessages[channelId] = [...(channelMessages[channelId] || []), message.id];
            }

            const threadMessages = { ...state.threadMessages };
            if (parentId) {
              threadMessages[parentId] = [...(threadMessages[parentId] || []), message.id];
            }

            return {
              messages: newMessages,
              channelMessages,
              threadMessages,
            };
          }),
        updateMessage: (message: Message) =>
          set((state) => ({
            messages: { ...state.messages, [message.id]: message },
          })),
        deleteMessage: (messageId: string) =>
          set((state) => {
            const { [messageId]: deletedMessage, ...remainingMessages } = state.messages;
            
            if (!deletedMessage) return state;

            const channelId = deletedMessage.channel_id;
            const parentId = deletedMessage.parent_message_id;

            const channelMessages = { ...state.channelMessages };
            if (!parentId && channelMessages[channelId]) {
              channelMessages[channelId] = channelMessages[channelId].filter(id => id !== messageId);
            }

            const threadMessages = { ...state.threadMessages };
            if (parentId && threadMessages[parentId]) {
              threadMessages[parentId] = threadMessages[parentId].filter(id => id !== messageId);
            }

            return {
              messages: remainingMessages,
              channelMessages,
              threadMessages,
            };
          }),
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearMessages: () => set({ messages: {}, channelMessages: {}, threadMessages: {} }),
      }),
      {
        name: 'message-storage',
        storage: createJSONStorage(() => {
          if (typeof window !== 'undefined') {
            return sessionStorage;
          }
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }),
        partialize: (state) => ({
          messages: state.messages,
          channelMessages: state.channelMessages,
          threadMessages: state.threadMessages,
        }),
      }
    )
  );

  return store;
};

export default createMessageStore; 