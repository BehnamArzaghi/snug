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
  console.log('[Store] Creating message store');
  
  if (typeof window === 'undefined') {
    console.log('[Store] Server-side, returning null');
    return null;
  }
  
  if (store) {
    console.log('[Store] Returning existing store instance');
    return store;
  }

  store = create<MessageStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        addMessage: (message: Message) =>
          set((state) => {
            const storeState = get();
            console.log('[Store] Current state:', {
              totalMessages: Object.keys(storeState.messages).length,
              channelCounts: Object.entries(storeState.channelMessages).map(([id, msgs]) => 
                `${id}: ${msgs.length}`
              ),
            });
            
            console.log('[Store] Adding message:', {
              id: message.id,
              channelId: message.channel_id,
              existingMessages: Object.keys(state.messages).length,
              existingChannelMessages: state.channelMessages[message.channel_id]?.length || 0
            });
            
            // Don't add if message already exists
            if (state.messages[message.id]) {
              console.log('[Store] Message already exists:', message.id);
              return state;
            }
            
            const newMessages = { ...state.messages, [message.id]: message };
            const channelId = message.channel_id;
            
            const channelMessages = { ...state.channelMessages };
            const currentIds = channelMessages[channelId] || [];
            
            // Only add if not already present
            if (!currentIds.includes(message.id)) {
              channelMessages[channelId] = [...currentIds, message.id];
              console.log('[Store] Updated channelMessages:', {
                channelId,
                messageCount: channelMessages[channelId].length,
                messageIds: channelMessages[channelId]
              });
            }

            const newState = {
              ...state,
              messages: newMessages,
              channelMessages,
            };

            console.log('[Store] New state after update:', {
              totalMessages: Object.keys(newMessages).length,
              channelCounts: Object.entries(channelMessages).map(([id, msgs]) => 
                `${id}: ${msgs.length}`
              ),
            });

            return newState;
          }),
        updateMessage: (message: Message) =>
          set((state) => ({
            ...state,
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
              ...state,
              messages: remainingMessages,
              channelMessages,
              threadMessages,
            };
          }),
        setLoading: (loading: boolean) =>
          set((state) => ({ ...state, loading })),
        setError: (error: string | null) =>
          set((state) => ({ ...state, error })),
        clearMessages: () => set({ messages: {}, channelMessages: {}, threadMessages: {} }),
      }),
      {
        name: 'message-storage',
        storage: createJSONStorage(() => {
          if (typeof window !== 'undefined') {
            console.log('[Store] Using session storage for persistence');
            return sessionStorage;
          }
          console.log('[Store] Using no-op storage for SSR');
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }),
        partialize: (state) => {
          const persistedState = {
            messages: state.messages,
            channelMessages: state.channelMessages,
            threadMessages: state.threadMessages,
          };
          console.log('[Store] Persisting state:', {
            totalMessages: Object.keys(persistedState.messages).length,
            channels: Object.keys(persistedState.channelMessages).length,
          });
          return persistedState;
        },
      }
    )
  );

  return store;
};

export default createMessageStore; 