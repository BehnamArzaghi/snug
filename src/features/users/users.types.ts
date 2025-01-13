export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  last_seen?: string;
  created_at?: string;
}

interface UserStoreState {
  users: Record<string, any>;
  isLoading: boolean;
  error: string | null;
}

interface UserStoreActions {
  setLoading: (val: boolean) => void;
  setError: (err: string | null) => void;
  addUser: (user: any) => void;
  setUsers: (users: any[]) => void;
}

export type UserStore = UserStoreState & UserStoreActions; 