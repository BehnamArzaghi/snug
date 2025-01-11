'use client';

import { ReactNode, memo, useEffect, useState } from 'react';
import createMessageStore from '@/store/messageStore';
import { MessageContext } from '@/hooks/useMessage';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { MessageStore } from '@/store/messageStore';

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider = memo(function MessageProvider({ 
  children 
}: MessageProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server or during hydration
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // Create store only on client side after mounting
  const store = createMessageStore();

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">
          Initializing...
        </div>
      </div>
    );
  }

  return (
    <MessageContext.Provider value={store}>
      {children}
    </MessageContext.Provider>
  );
}); 