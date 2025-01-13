import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { createReactionStore } from './reactions.store';
import type { ReactionStore } from './reactions.types';

const ReactionContext = createContext<ReactionStore | null>(null);

interface ReactionProviderProps {
  children: ReactNode;
}

export function ReactionProvider({ children }: ReactionProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const store = useMemo(() => (mounted ? createReactionStore() : null), [mounted]);

  if (!store) return null;

  return (
    <ReactionContext.Provider value={store}>
      {children}
    </ReactionContext.Provider>
  );
}

export const useReactionContext = () => {
  const context = useContext(ReactionContext);
  if (!context) {
    throw new Error('useReactionContext must be used within a ReactionProvider');
  }
  return context;
};
