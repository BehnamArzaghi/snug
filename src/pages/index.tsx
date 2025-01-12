import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        if (!loading && !user) {
          await router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    };

    handleAuth();
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    );
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