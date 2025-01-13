import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';
import { useAuthOperations } from './useAuthOperations';
import { Button } from '@/components/ui/button';

export function UserProfile(): React.ReactElement {
  const router = useRouter();
  const { user, isLoading, error } = useAuth();
  const { signOut } = useAuthOperations();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (err) {
      console.error('Failed to sign out:', err);
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Not signed in</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.name || user.email}
            className="h-10 w-10 rounded-full"
          />
        )}
        <div>
          <p className="font-medium">{user.name || 'User'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <Button
        onClick={handleSignOut}
        disabled={isSigningOut}
        variant="outline"
        className="w-full"
      >
        {isSigningOut ? 'Signing out...' : 'Sign out'}
      </Button>
    </div>
  );
} 