import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Welcome to Snug</h2>
        <p className="mt-2 text-muted-foreground">
          Select a channel to start chatting
        </p>
      </div>
    </AppLayout>
  );
} 