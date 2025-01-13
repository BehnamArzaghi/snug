import { useAuth } from './useAuth';
import { useAuthOperations } from './useAuthOperations';

export function UserProfile() {
  const { user, isLoading, error } = useAuth();
  const { signOut } = useAuthOperations();

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-gray-500">
        Not signed in
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.name || user.email} 
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold">
              {(user.name || user.email)[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{user.name || 'Unnamed User'}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="w-full px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
} 