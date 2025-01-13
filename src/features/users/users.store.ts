import create from 'zustand';
import type { UserStore } from './users.types';

export function createUserStore() {
  if (typeof window === 'undefined') {
    return null;
  }

  return create<UserStore>()((set) => ({
    users: {},
    isLoading: false,
    error: null,

    setLoading: (val) => set({ isLoading: val }),
    setError: (err) => set({ error: err }),

    addUser: (user) => {
      set((state) => ({
        users: { ...state.users, [user.id]: user },
      }));
    },
    setUsers: (users) => {
      const newMap = users.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as Record<string, any>);
      set({ users: newMap });
    },
  }));
} 