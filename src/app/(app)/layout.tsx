// src/app/(app)/layout.tsx
import RouteGuard from '@/components/RouteGuard';
import AppShell from '@/components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <AppShell>
        {children}
      </AppShell>
    </RouteGuard>
  );
}
