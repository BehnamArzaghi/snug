'use client';

import React, { memo } from 'react';
import { ThemeProvider } from 'next-themes';

interface UIProviderProps {
  children: React.ReactNode;
}

export const UIProvider = memo(function UIProvider({ children }: UIProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="snug-theme"
      // Force theme changes to be client-side only
      enableColorScheme={false}
    >
      {children}
    </ThemeProvider>
  );
}); 