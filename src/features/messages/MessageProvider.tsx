import { createContext, useEffect, useState, useMemo, memo } from 'react';
import { createMessageStore } from './messages.store';

type MessageStoreType = ReturnType<typeof createMessageStore>;

export const MessageContext = createContext<MessageStoreType | null>(null);

interface MessageProviderProps {
  children: React.ReactNode;
}

export const MessageProvider = memo(function MessageProvider({ children }: MessageProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const store = useMemo(() => {
    if (!mounted) return null;
    return createMessageStore();
  }, [mounted]);

  // SSR or not mounted yet
  if (!store) {
    return <div>Loading messages...</div>;
  }

  return (
    <MessageContext.Provider value={store}>
      {children}
    </MessageContext.Provider>
  );
});
