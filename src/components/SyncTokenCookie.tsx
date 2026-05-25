// src/components/SyncTokenCookie.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

/**
 * Renders nothing. Mirrors the Zustand token into a SameSite=Strict cookie
 * so the Next.js edge middleware can read it for server-side redirects.
 * Token in Zustand/localStorage is the source of truth; cookie is read-only
 * from the perspective of client code.
 */
export default function SyncTokenCookie() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      document.cookie = `auth-token=${token}; path=/; SameSite=Strict`;
    } else {
      document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict';
    }
  }, [token]);

  return null;
}
