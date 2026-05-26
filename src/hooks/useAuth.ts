// src/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore, User, Company } from '@/store/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginApiResponse {
  token: string;
  user: User;
  companies: Company[];
}

export function useLogin() {
  const { setAuth, setActiveCompany } = useAuthStore();
  return useMutation<LoginApiResponse, Error, LoginCredentials>({
    mutationFn: (creds) =>
      api.post<{ data: LoginApiResponse }>('/auth/login', creds).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      // Prefer the company flagged as default; fall back to the first in the list
      const defaultCompany = data.companies.find((c) => c.is_default) ?? data.companies[0];
      if (defaultCompany) setActiveCompany(defaultCompany);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    // Clear store even if the backend call fails (e.g., expired token)
    onSettled: () => logout(),
  });
}
