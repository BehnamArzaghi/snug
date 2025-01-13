import { createContext, useContext } from 'react';
import { useAuthStore } from './auth.store';

// This context can just be a no-op or hold a reference to the store
type AuthContextValue = Record<string, never>;
const AuthContext = createContext<AuthContextValue>({});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Optional: we can just always rely on the store hooking
  // We might do side effects or auto-fetch user here if needed
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

// If you do useAuthContext, you'd wrap your app, but it's optional since Zustand doesn't need a Provider
export function useAuthContext() {
  return useContext(AuthContext);
}
