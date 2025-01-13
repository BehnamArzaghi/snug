import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthOperations } from '@/features/auth/useAuthOperations';
import { ClientOnly } from '@/components/ClientOnly';

export default function SignInPage() {
  return (
    <ClientOnly>
      <SignIn />
    </ClientOnly>
  );
}

function SignIn() {
  const router = useRouter();

  // Zustand states
  const { isLoading: storeLoading, error: storeError } = useAuth();
  const { signIn } = useAuthOperations();

  // Local states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine local + store loading states
  const isLoading = storeLoading || isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error; // throw to catch block
      // Success → go home
      router.push('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Merge store and local errors
  const displayError = localError || storeError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6">
        <h2 className="text-center text-2xl font-bold mb-4">Sign In</h2>

        {displayError && (
          <div className="mb-2 bg-red-100 text-red-600 p-2 rounded">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Need an account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
} 