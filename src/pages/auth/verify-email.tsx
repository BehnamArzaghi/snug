import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We've sent you a verification link. Please check your email and click the link to verify your account.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Once verified, you can sign in to your account.
          </p>
          <div className="flex justify-center">
            <Link href="/auth/signin">
              <Button variant="outline">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 