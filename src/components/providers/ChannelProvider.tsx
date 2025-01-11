'use client';

import { ReactNode, memo, useEffect, useState, useMemo } from 'react';
import createChannelStore from '@/store/channelStore';
import { ChannelContext } from '@/hooks/useChannel';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { ChannelStore } from '@/store/channelStore';

interface ChannelProviderProps {
  children: ReactNode;
}

export const ChannelProvider = memo(function ChannelProvider({ 
  children 
}: ChannelProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create store only once after mounting
  const store = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createChannelStore();
  }, []);

  // Don't render anything on the server or during hydration
  if (!mounted || !store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <ChannelContext.Provider value={store}>
      {children}
    </ChannelContext.Provider>
  );
}); 