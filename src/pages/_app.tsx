import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { UIProvider } from '@/components/providers/UIProvider';
import { MessageProvider } from '@/components/providers/MessageProvider';
import { ChannelProvider } from '@/components/providers/ChannelProvider';
import { Toaster } from 'sonner';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { Database } from '@/lib/database.types';

export default function App({ 
  Component, 
  pageProps 
}: AppProps<{ 
  initialSession: Session 
}>) {
  const [supabaseClient] = useState(() => createPagesBrowserClient<Database>());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <UIProvider>
        <AuthProvider>
          <ChannelProvider>
            <MessageProvider>
              <Component {...pageProps} />
              <Toaster />
            </MessageProvider>
          </ChannelProvider>
        </AuthProvider>
      </UIProvider>
    </SessionContextProvider>
  );
} 