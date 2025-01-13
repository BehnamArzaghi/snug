import { useContext } from 'react';
import { ChannelContext } from './ChannelProvider';
import type { Channel } from './channels.types';

export function useChannelOperations() {
  const store = useContext(ChannelContext);
  if (!store) {
    throw new Error('useChannelOperations must be used within ChannelProvider');
  }

  // Get operations
  const setChannels = store((s) => s.setChannels);
  const addChannel = store((s) => s.addChannel);
  const updateChannel = store((s) => s.updateChannel);
  const setActiveChannel = store((s) => s.setActiveChannel);
  const setLoading = store((s) => s.setLoading);
  const setError = store((s) => s.setError);

  return {
    setChannels,
    addChannel,
    updateChannel,
    setActiveChannel,
    setLoading,
    setError,
  } as const;
}
