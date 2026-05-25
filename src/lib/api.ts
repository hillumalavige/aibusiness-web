import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { Accept: 'application/json' },
});

// Inject auth + tenant headers on every outbound request
api.interceptors.request.use((config) => {
  const { token, activeCompany } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (activeCompany) config.headers['X-Company-Id'] = String(activeCompany.id);
  return config;
});

// On 401: clear auth state — RouteGuard will redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
