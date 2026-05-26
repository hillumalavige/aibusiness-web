// src/hooks/useProfile.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useUpdateProfile, useChangePassword } from './useProfile';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), post: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useAuthStore.setState({
      token: 'tok_abc',
      user: { id: 1, name: 'Alice', email: 'alice@example.com', phone: null, is_super_admin: false },
      activeCompany: null,
    });
  });
});

describe('useUpdateProfile', () => {
  it('calls PUT /me and updates auth store on success', async () => {
    const updatedUser = { id: 1, name: 'Alice Updated', email: 'alice@new.com', phone: '+1 555 0000', is_super_admin: false };
    // Backend envelope: { success, message, data: User }
    // Axios wraps in r.data, so mock returns { data: { data: updatedUser } }
    mockedApi.put.mockResolvedValue({ data: { data: updatedUser } });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    act(() => {
      result.current.mutate({ name: 'Alice Updated', email: 'alice@new.com', phone: '+1 555 0000' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/me', {
      name: 'Alice Updated',
      email: 'alice@new.com',
      phone: '+1 555 0000',
    });

    // Auth store should be updated with new user data
    const { user } = useAuthStore.getState();
    expect(user?.name).toBe('Alice Updated');
    expect(user?.email).toBe('alice@new.com');
  });

  it('does not update auth store on failure', async () => {
    mockedApi.put.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    act(() => {
      result.current.mutate({ name: 'Alice Updated', email: 'alice@new.com', phone: null });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Auth store user name should be unchanged
    expect(useAuthStore.getState().user?.name).toBe('Alice');
  });
});

describe('useChangePassword', () => {
  it('calls POST /me/password with correct payload', async () => {
    mockedApi.post.mockResolvedValue({ data: { success: true, message: 'Password updated.', data: null } });

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    act(() => {
      result.current.mutate({
        current_password: 'oldpass',
        password: 'newpass123',
        password_confirmation: 'newpass123',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/me/password', {
      current_password: 'oldpass',
      password: 'newpass123',
      password_confirmation: 'newpass123',
    });
  });

  it('surfaces error on wrong current password', async () => {
    mockedApi.post.mockRejectedValue({ response: { status: 422, data: { message: 'Current password is incorrect.' } } });

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    act(() => {
      result.current.mutate({
        current_password: 'wrongpass',
        password: 'newpass123',
        password_confirmation: 'newpass123',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
