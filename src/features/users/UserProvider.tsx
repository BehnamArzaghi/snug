import React, { useEffect, useState, useMemo, memo, createContext } from 'react';
import { createUserStore } from './users.store';

type UserStoreType = ReturnType<typeof createUserStore>;

export const UserContext = createContext<UserStoreType | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider = memo(function UserProvider({ children }: UserProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const store = useMemo(() => {
    if (!mounted) return null;
    return createUserStore();
  }, [mounted]);

  if (!store) {
    return <div>Loading users...</div>;
  }

  return (
    <UserContext.Provider value={store}>
      {children}
    </UserContext.Provider>
  );
}); 