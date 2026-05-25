// src/app/layout.tsx
import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import Providers from '@/components/Providers';
import SyncTokenCookie from '@/components/SyncTokenCookie';

export const metadata: Metadata = {
  title: 'aibusiness',
  description: 'Multi-Tenant AI Business Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* AppRouterCacheProvider sets up the Emotion cache for MUI in App Router */}
        <AppRouterCacheProvider>
          <Providers>
            {/* SyncTokenCookie is a client component that mirrors token → cookie */}
            <SyncTokenCookie />
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
