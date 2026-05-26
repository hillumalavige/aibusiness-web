// src/hooks/useProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { useAuthStore, User } from '@/store/auth';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<User, Error, UpdateProfileInput>({
    mutationFn: (input) =>
      api
        .put<{ data: User }>('/me', input)
        .then((r) => r.data.data),
    onSuccess: (updatedUser) => {
      // Sync AppBar name immediately — no page reload needed
      const { token, setAuth } = useAuthStore.getState();
      if (token) setAuth(token, updatedUser);
      // Invalidate useMe() so any other consumers refresh
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation<void, AxiosError<{ message: string }>, ChangePasswordInput>({
    mutationFn: (input) =>
      api
        .post('/me/password', input)
        .then(() => undefined),
  });
}
