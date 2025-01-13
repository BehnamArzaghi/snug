import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { createNotificationStore } from './notifications.store';
import type { NotificationStore } from './notifications.types';

const NotificationContext = createContext<NotificationStore | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const store = useMemo(() => (mounted ? createNotificationStore() : null), [mounted]);

  if (!store) return null;

  return (
    <NotificationContext.Provider value={store}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
