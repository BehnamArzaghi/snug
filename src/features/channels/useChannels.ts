import { useContext } from 'react';
import { ChannelContext } from './ChannelProvider';
import type { Channel } from './channels.types';

export function useChannels() {
  const store = useContext(ChannelContext);
  if (!store) {
    throw new Error('useChannels must be used within ChannelProvider');
  }

  // Get state slices
  const channels = store((s) => s.channels);
  const activeChannelId = store((s) => s.activeChannelId);
  const isLoading = store((s) => s.isLoading);
  const error = store((s) => s.error);

  // Derive active channel
  const activeChannel = activeChannelId ? channels[activeChannelId] : null;
  
  // Convert channels map to sorted array
  const channelList = Object.values(channels).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return {
    channels,
    channelList,
    activeChannelId,
    activeChannel,
    isLoading,
    error,
  } as const;
}
