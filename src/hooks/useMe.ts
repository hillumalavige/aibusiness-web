// src/hooks/useMe.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore, User, Company } from '@/store/auth';

export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: () =>
      api
        .get<{ data: { user: User; companies: Company[] } }>('/me')
        // companies from /me is ignored here; use useCompanies() for the list
        .then((r) => r.data.data.user),
    enabled: !!token,
  });
}

export function useCompanies() {
  const token = useAuthStore((s) => s.token);
  return useQuery<Company[]>({
    queryKey: ['me', 'companies'],
    queryFn: () =>
      api
        .get<{ data: Company[] }>('/me/companies')
        .then((r) => r.data.data),
    enabled: !!token,
  });
}
