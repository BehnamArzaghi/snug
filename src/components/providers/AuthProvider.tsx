import { createContext, useContext, ReactNode } from 'react';
import { useAuth as useSupabaseAuth } from '@/lib/hooks/useAuth';

type AuthContextType = ReturnType<typeof useSupabaseAuth>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 