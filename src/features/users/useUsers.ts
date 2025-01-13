import { useContext } from 'react';
import { UserContext } from './UserProvider';

export function useUsers() {
  const store = useContext(UserContext);
  if (!store) {
    throw new Error('useUsers must be used within UserProvider');
  }

  const isLoading = store((s) => s.isLoading);
  const error = store((s) => s.error);
  const users = store((s) => s.users);

  return { isLoading, error, users };
} 