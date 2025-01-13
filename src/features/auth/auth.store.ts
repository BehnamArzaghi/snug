import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthStore extends AuthState {
  // Setters
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth operations
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,

  // Setters
  setUser: (user) => set({ user, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // signIn
  signIn: async (email, password) => {
    if (typeof window === 'undefined') {
      return { error: new Error('Cannot sign in during SSR') };
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ error: error.message });
        return { error };
      }
      if (!data.user) {
        const err = new Error('No user returned');
        set({ error: err.message });
        return { error: err };
      }
      // Build our local user object
      const { id, email: userEmail, created_at } = data.user;
      const name = data.user?.user_metadata?.name || '';
      const avatar_url = data.user?.user_metadata?.avatar_url || null;
      set({
        user: { id, email: userEmail!, name, avatar_url, created_at },
        isLoading: false,
      });
      return { error: null };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Unknown error');
      set({ error: e.message });
      return { error: e };
    } finally {
      set({ isLoading: false });
    }
  },

  // signUp
  signUp: async (email, password, name) => {
    if (typeof window === 'undefined') {
      return { error: new Error('Cannot sign up during SSR') };
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      if (error) {
        set({ error: error.message });
        return { error };
      }
      if (!data.user) {
        set({ user: null, isLoading: false });
        return { error: null };
      }
      const { id, email: userEmail, created_at } = data.user;
      const avatar_url = data.user?.user_metadata?.avatar_url || null;
      set({
        user: { id, email: userEmail!, name, avatar_url, created_at },
        isLoading: false,
      });
      return { error: null };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Unknown error');
      set({ error: e.message });
      return { error: e };
    } finally {
      set({ isLoading: false });
    }
  },

  // signOut
  signOut: async () => {
    if (typeof window === 'undefined') {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Unknown error');
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
