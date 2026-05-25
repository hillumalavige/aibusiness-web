// src/app/page.tsx
import { redirect } from 'next/navigation';

// The root URL redirects to /dashboard.
// Unauthenticated users will be caught by middleware and sent to /login.
export default function RootPage() {
  redirect('/dashboard');
}
