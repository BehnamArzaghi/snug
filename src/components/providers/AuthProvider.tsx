'use client';

import { createContext, useContext, ReactNode, memo, useCallback, useMemo } from 'react';
import { useAuth as useSupabaseAuth } from '@/lib/hooks/useAuth';
import { User } from '@supabase/auth-helpers-nextjs';
import { AuthError } from '@supabase/supabase-js';

interface AuthResponse<T = unknown> {
  data: T | null;
  error: AuthError | unknown | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = memo(function AuthProvider({ 
  children 
}: { 
  children: ReactNode;
}) {
  const { user, loading, signIn: baseSignIn, signOut: baseSignOut, signUp: baseSignUp } = useSupabaseAuth();

  // Memoize auth methods to prevent unnecessary re-renders
  const signIn = useCallback(async (email: string, password: string) => {
    return baseSignIn(email, password);
  }, [baseSignIn]);

  const signOut = useCallback(async () => {
    await baseSignOut();
  }, [baseSignOut]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    return baseSignUp(email, password, name);
  }, [baseSignUp]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    signUp,
  }), [user, loading, signIn, signOut, signUp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
});

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Typed selector hooks for better performance
export const useAuthUser = () => useAuth().user;
export const useAuthLoading = () => useAuth().loading;
export const useAuthMethods = () => {
  const { signIn, signOut, signUp } = useAuth();
  return useMemo(() => ({
    signIn,
    signOut,
    signUp,
  }), [signIn, signOut, signUp]);
}; 