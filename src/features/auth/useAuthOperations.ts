import { useAuthStore } from './auth.store';

export function useAuthOperations() {
  // During SSR, return no-op functions
  if (typeof window === 'undefined') {
    return {
      signIn: async () => ({ error: new Error('Cannot sign in during SSR') }),
      signUp: async () => ({ error: new Error('Cannot sign up during SSR') }),
      signOut: async () => {},
      setUser: () => {},
      setLoading: () => {},
      setError: () => {},
    };
  }

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setError = useAuthStore((s) => s.setError);

  return {
    signIn,
    signUp,
    signOut,
    setUser,
    setLoading,
    setError,
  };
}
