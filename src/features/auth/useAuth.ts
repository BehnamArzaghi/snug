import { useAuthStore } from './auth.store';

export function useAuth() {
  // During SSR, return default values
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    };
  }

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
