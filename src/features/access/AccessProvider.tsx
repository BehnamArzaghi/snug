import { createContext, useEffect, useState, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { createAccessStore } from './access.store';
import type { AccessState } from './access.types';

export const AccessContext = createContext<ReturnType<typeof createAccessStore> | null>(null);

export function AccessProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const store = useMemo(() => {
    return mounted ? createAccessStore() : null;
  }, [mounted]);

  if (!store) return null;

  return (
    <AccessContext.Provider value={store}>
      {children}
    </AccessContext.Provider>
  );
}
