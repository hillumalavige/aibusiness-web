'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !user.is_super_admin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Return null until user is confirmed super-admin — prevents flash of protected content
  if (!user || !user.is_super_admin) return null;

  return <>{children}</>;
}
