import { create } from 'zustand';
import type { ChannelState, Channel } from './channels.types';

interface ChannelStore extends ChannelState {
  // State setters
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  setActiveChannel: (channelId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export function createChannelStore() {
  // SSR safety check
  if (typeof window === 'undefined') {
    return null;
  }

  return create<ChannelStore>()((set) => ({
    // Initial state
    channels: {},
    activeChannelId: null,
    isLoading: true,
    error: null,

    // State setters
    setChannels: (channels) => {
      const channelMap = channels.reduce((acc, channel) => {
        acc[channel.id] = channel;
        return acc;
      }, {} as Record<string, Channel>);
      
      set({ channels: channelMap, error: null });
    },

    addChannel: (channel) => 
      set((state) => ({
        channels: { ...state.channels, [channel.id]: channel },
        error: null,
      })),

    updateChannel: (channelId, updates) =>
      set((state) => ({
        channels: {
          ...state.channels,
          [channelId]: { ...state.channels[channelId], ...updates },
        },
      })),

    setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
  }));
}
