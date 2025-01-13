import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react';

// Domain providers - import in order of dependency
import { AuthProvider } from '@/features/auth/AuthProvider';
import { UserProvider } from '@/features/users/UserProvider';
import { ChannelProvider } from '@/features/channels/ChannelProvider';
import { MessageProvider } from '@/features/messages/MessageProvider';
import { NotificationProvider } from '@/features/notifications/NotificationProvider';

import type { Database } from '@/lib/database.types';

export default function App({ 
  Component, 
  pageProps 
}: AppProps<{ 
  initialSession: Session 
}>) {
  // Create supabase browser client - this is SSR safe as it's created per-request
  const [supabaseClient] = useState(() => createPagesBrowserClient<Database>());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      {/* Providers are ordered by dependency - auth first, then users, etc. */}
      <AuthProvider>
        <UserProvider>
          <NotificationProvider>
            <ChannelProvider>
              <MessageProvider>
                <Component {...pageProps} />
                <Toaster />
              </MessageProvider>
            </ChannelProvider>
          </NotificationProvider>
        </UserProvider>
      </AuthProvider>
    </SessionContextProvider>
  );
} 