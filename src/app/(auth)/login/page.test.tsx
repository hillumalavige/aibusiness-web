// src/app/(auth)/login/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import LoginPage from './page';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

// Mock Next.js router
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReplace.mockReset();
  useAuthStore.setState({ token: null, user: null, activeCompany: null });
});

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('redirects to /dashboard on successful login', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        token: 'tok_123',
        user: { id: 1, name: 'Alice', email: 'alice@example.com', companies: [{ id: 10, name: 'Acme' }] },
      },
    });
    render(<LoginPage />, { wrapper });

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error message on failed login', async () => {
    mockedApi.post.mockRejectedValue(new Error('Unauthorized'));
    render(<LoginPage />, { wrapper });

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
