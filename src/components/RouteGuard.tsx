'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

/**
 * Client-side auth guard. Redirects to /login when no token is present.
 * Returns null (no content flash) until auth is confirmed.
 * Works alongside the edge middleware (middleware.ts) which provides
 * the first redirect before React hydrates.
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Prevent rendering protected content before auth is confirmed
  if (!token) return null;

  return <>{children}</>;
}
