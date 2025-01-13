import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthOperations } from '@/features/auth/useAuthOperations';

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuthOperations();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (err) {
      console.error('Failed to sign out:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </button>
  );
} 