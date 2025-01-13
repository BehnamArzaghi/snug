import { useContext } from 'react';
import { UserContext } from './UserProvider';
// Example: import { postUser } from '@/services/userService';

export function useUserOperations() {
  const store = useContext(UserContext);
  if (!store) {
    throw new Error('useUserOperations must be used within UserProvider');
  }

  const setLoading = store((s) => s.setLoading);
  const setError = store((s) => s.setError);
  const addUser = store((s) => s.addUser);

  async function createUser(email: string, name: string) {
    setLoading(true);
    setError(null);
    try {
      // let newUser = await postUser(email, name);
      let newUser = { id: 'temp123', email, name };
      addUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { createUser };
} 