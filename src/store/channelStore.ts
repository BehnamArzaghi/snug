import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Database } from '@/lib/database.types';
import type { StoreApi, UseBoundStore } from 'zustand';

type ChannelMember = Database['public']['Tables']['channel_members']['Row'];
type Channel = Database['public']['Tables']['channels']['Row'] & {
  is_admin?: boolean;
  is_member?: boolean;
  unread_count?: number;
  member_role?: 'admin' | 'member';
  channel_members?: ChannelMember[];
};

export interface ChannelState {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  currentChannelId: string | null;
}

export interface ChannelActions {
  setChannels: (channels: Channel[]) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  deleteChannel: (channelId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentChannel: (channelId: string | null) => void;
  updateUnreadCount: (channelId: string, count: number) => void;
}

export type ChannelStore = ChannelState & ChannelActions;

const initialState: ChannelState = {
  channels: [],
  loading: false,
  error: null,
  currentChannelId: null,
};

let store: UseBoundStore<StoreApi<ChannelStore>> | null = null;

const createChannelStore = () => {
  if (store) return store;
  
  if (typeof window === 'undefined') return null;

  store = create<ChannelStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        setChannels: (channels) => set({ channels }),
        
        updateChannel: (channelId, updates) => 
          set((state) => ({
            channels: state.channels.map((channel) =>
              channel.id === channelId ? { ...channel, ...updates } : channel
            ),
          })),

        deleteChannel: (channelId) =>
          set((state) => ({
            channels: state.channels.filter((channel) => channel.id !== channelId),
            currentChannelId: state.currentChannelId === channelId ? null : state.currentChannelId,
          })),

        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),
        
        setCurrentChannel: (channelId) => set({ currentChannelId: channelId }),
        
        updateUnreadCount: (channelId, count) =>
          set((state) => ({
            channels: state.channels.map((channel) =>
              channel.id === channelId ? { ...channel, unread_count: count } : channel
            ),
          })),
      }),
      {
        name: 'channel-storage',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          channels: state.channels,
          currentChannelId: state.currentChannelId,
        }),
      }
    )
  );

  return store;
};

export default createChannelStore; 