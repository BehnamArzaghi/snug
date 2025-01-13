import { createContext, useEffect, useState, useMemo, memo } from 'react';
import { createChannelStore } from './channels.store';

type ChannelStoreType = ReturnType<typeof createChannelStore>;

export const ChannelContext = createContext<ChannelStoreType | null>(null);

interface ChannelProviderProps {
  children: React.ReactNode;
}

export const ChannelProvider = memo(function ChannelProvider({ children }: ChannelProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const store = useMemo(() => {
    if (!mounted) return null;
    return createChannelStore();
  }, [mounted]);

  // SSR or not mounted yet
  if (!store) {
    return <div>Loading channels...</div>;
  }

  return (
    <ChannelContext.Provider value={store}>
      {children}
    </ChannelContext.Provider>
  );
});
