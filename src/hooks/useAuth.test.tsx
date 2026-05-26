// src/hooks/useAuth.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useLogin, useLogout } from './useAuth';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useAuthStore.setState({ token: null, user: null, activeCompany: null });
  });
});

// Backend wraps all responses in { success, message, data: <payload> }
// Axios wraps the HTTP body in r.data, so the hook receives r.data.data = <payload>
const mockCompany = {
  id: 10,
  name: 'Acme',
  slug: 'acme',
  status: 'active',
  enabled_modules: [],
  is_default: true,
};

const mockLoginResponse = {
  data: {
    data: {
      token: 'tok_123',
      user: {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        is_super_admin: false,
      },
      companies: [mockCompany],
    },
  },
};

describe('useLogin', () => {
  it('sets token and user in store on success', async () => {
    mockedApi.post.mockResolvedValue(mockLoginResponse);
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: 'alice@example.com', password: 'secret' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().token).toBe('tok_123');
    expect(useAuthStore.getState().user?.email).toBe('alice@example.com');
  });

  it('auto-selects the default company on success', async () => {
    mockedApi.post.mockResolvedValue(mockLoginResponse);
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: 'alice@example.com', password: 'secret' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().activeCompany).toEqual(mockCompany);
  });

  it('marks as error on failure', async () => {
    mockedApi.post.mockRejectedValue(new Error('Unauthorized'));
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: 'bad@example.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useAuthStore.getState().token).toBeNull();
  });
});

describe('useLogout', () => {
  it('clears store on success', async () => {
    mockedApi.post.mockResolvedValue({});
    act(() => {
      useAuthStore.setState({
        token: 'tok_123',
        user: { id: 1, name: 'Alice', email: 'a@b.com', is_super_admin: false },
        activeCompany: mockCompany,
      });
    });
    const { result } = renderHook(() => useLogout(), { wrapper });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('clears store even if API call fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('Network error'));
    act(() => {
      useAuthStore.setState({
        token: 'tok_123',
        user: null,
        activeCompany: null,
      });
    });
    const { result } = renderHook(() => useLogout(), { wrapper });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useAuthStore.getState().token).toBeNull();
  });
});
