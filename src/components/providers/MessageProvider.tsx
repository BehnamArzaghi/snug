'use client';

import { ReactNode, memo, useEffect, useState, useCallback, useMemo } from 'react';
import createMessageStore from '@/store/messageStore';
import { MessageContext } from '@/hooks/useMessage';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { MessageStore } from '@/store/messageStore';
import { Loader2 } from 'lucide-react';

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider = memo(function MessageProvider({ 
  children 
}: MessageProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [store] = useState(() => {
    console.log('[MessageProvider] Initializing store');
    return createMessageStore();
  });

  useEffect(() => {
    console.log('[MessageProvider] Component mounted');
    setMounted(true);
  }, []);

  // Loading state component
  const renderLoading = useCallback(() => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading messages...</span>
      </div>
    </div>
  ), []);

  // Don't render children until client-side hydration is complete
  if (!mounted) {
    console.log('[MessageProvider] Waiting for hydration');
    return renderLoading();
  }

  console.log('[MessageProvider] Rendering with store:', store ? 'present' : 'null');
  return (
    <MessageContext.Provider value={store}>
      {children}
    </MessageContext.Provider>
  );
}); 