// src/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore, User } from '@/store/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export function useLogin() {
  const { setAuth, setActiveCompany } = useAuthStore();
  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: (creds) =>
      api.post<LoginResponse>('/auth/login', creds).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      // Auto-select first company so the user lands in a working state
      if (data.user.companies?.[0]) {
        setActiveCompany(data.user.companies[0]);
      }
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
