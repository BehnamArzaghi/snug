import { createContext, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
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
  const accessCache = useRef(new Map<string, { canRead: boolean; canWrite: boolean; timestamp: number }>());
  const CACHE_TTL = 30000; // 30 seconds
  
  const getChannelAccess = useCallback((channelId: string) => {
    const now = Date.now();
    const cached = accessCache.current.get(channelId);
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log('[Channel Access] Using cached access:', cached);
      return { canRead: cached.canRead, canWrite: cached.canWrite };
    }

    const channel = channels.find(c => c.id === channelId);
    console.log('[Channel Access Check]', { 
      channelId, 
      channelFound: !!channel,
      channelDetails: channel ? {
        is_private: channel.is_private,
        is_member: channel.is_member,
        member_role: channel.member_role
      } : null
    });

    if (!channel) {
      console.log('[Channel Access] No channel found, denying access');
      return { canRead: false, canWrite: false };
    }
    
    // Public channels: anyone can read, members can write
    if (!channel.is_private) {
      const access = {
        canRead: true,
        canWrite: Boolean(channel.is_member)
      };
      console.log('[Channel Access] Public channel access:', access);
      accessCache.current.set(channelId, { ...access, timestamp: now });
      return access;
    }
    
    // Private channels: only members can read and write
    const isMember = Boolean(channel.is_member);
    const access = {
      canRead: isMember,
      canWrite: isMember
    };
    console.log('[Channel Access] Private channel access:', access);
    accessCache.current.set(channelId, { ...access, timestamp: now });
    return access;
  }, [channels]);

  // Clear cache when channels update
  useEffect(() => {
    accessCache.current.clear();
  }, [channels]);

  return useMemo(() => ({
    channels,
    loading,
    error,
    ...actions,
    getChannelAccess
  }), [channels, loading, error, actions, getChannelAccess]);
} 