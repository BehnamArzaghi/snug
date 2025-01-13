import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/features/auth/useAuth';
import { useChannels } from '@/features/channels/useChannels';

export default function Home() {
  const router = useRouter();
  const { user, isLoading, error } = useAuth();
  const { isLoading: channelsLoading, channelList } = useChannels();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin').catch(console.error);
    }
  }, [isLoading, user, router]);

  // Show loading state while checking auth or loading channels
  if (isLoading || channelsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
      </div>
    );
  }

  // Show error state if auth failed
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  // Show redirect message if not authenticated
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Redirecting to login...</div>
      </div>
    );
  }

  // Main app layout with welcome message and channel count
  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold">
          Welcome to Snug, {user.name || user.email}!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Select a channel to start chatting. Currently {channelList.length} channels available.
        </p>
      </div>
    </AppLayout>
  );
} 