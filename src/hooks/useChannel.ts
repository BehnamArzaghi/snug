import { createContext, useContext, useMemo } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { ChannelStore } from '@/store/channelStore';

type ChannelContextType = UseBoundStore<StoreApi<ChannelStore>> | null;

export const ChannelContext = createContext<ChannelContextType>(null);

// Base store hook
export function useChannelStore() {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}

// State hooks
export function useChannels() {
  const store = useChannelStore();
  return useMemo(() => {
    const state = store.getState();
    return {
      channels: state.channels,
      loading: state.loading,
      error: state.error,
    };
  }, [store]);
}

export function useChannel(channelId: string | null) {
  const store = useChannelStore();
  return useMemo(() => {
    if (!channelId) return null;
    const state = store.getState();
    return state.channels.find(channel => channel.id === channelId) || null;
  }, [store, channelId]);
}

export function useCurrentChannel() {
  const store = useChannelStore();
  return useMemo(() => {
    const state = store.getState();
    if (!state.currentChannelId) return null;
    return state.channels.find(channel => channel.id === state.currentChannelId) || null;
  }, [store]);
}

// Actions hook
export function useChannelActions() {
  const store = useChannelStore();
  return useMemo(() => {
    const state = store.getState();
    return {
      setChannels: state.setChannels,
      updateChannel: state.updateChannel,
      deleteChannel: state.deleteChannel,
      setLoading: state.setLoading,
      setError: state.setError,
      setCurrentChannel: state.setCurrentChannel,
      updateUnreadCount: state.updateUnreadCount,
    };
  }, [store]);
}

// Composite hook
export function useChannelOperations() {
  const { channels, loading, error } = useChannels();
  const actions = useChannelActions();
  
  return useMemo(() => ({
    channels,
    loading,
    error,
    ...actions,
  }), [channels, loading, error, actions]);
} 