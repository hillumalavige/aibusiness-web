// src/hooks/useMe.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMe, useCompanies } from './useMe';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useAuthStore.setState({
      token: 'tok_123',
      user: null,
      activeCompany: {
        id: 10,
        name: 'Acme',
        slug: 'acme',
        status: 'active',
        enabled_modules: [],
        is_default: true,
      },
    });
  });
});

describe('useMe', () => {
  it('fetches current user when token is present', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', is_super_admin: false };
    // GET /v1/me envelope: { success, message, data: { user, companies } }
    mockedApi.get.mockResolvedValue({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: mockUser,
          companies: [{ id: 10, name: 'Acme', slug: 'acme', status: 'active', enabled_modules: [], is_default: true }],
        },
      },
    });

    const { result } = renderHook(() => useMe(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
    expect(mockedApi.get).toHaveBeenCalledWith('/me');
  });

  it('does not fetch when no token', async () => {
    act(() => {
      useAuthStore.setState({ token: null, user: null, activeCompany: null });
    });
    renderHook(() => useMe(), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useCompanies', () => {
  it('fetches companies when token is present', async () => {
    const mockCompanies = [
      { id: 10, name: 'Acme', slug: 'acme', status: 'active', enabled_modules: ['hr'], is_default: true },
    ];
    // GET /v1/me/companies envelope: { success, message, data: Company[] }
    mockedApi.get.mockResolvedValue({
      data: {
        success: true,
        message: 'OK',
        data: mockCompanies,
      },
    });

    const { result } = renderHook(() => useCompanies(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCompanies);
    expect(mockedApi.get).toHaveBeenCalledWith('/me/companies');
  });

  it('does not fetch when no token', async () => {
    act(() => {
      useAuthStore.setState({ token: null, user: null, activeCompany: null });
    });
    renderHook(() => useCompanies(), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
