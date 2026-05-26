// src/components/CompanySwitcher.test.tsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import CompanySwitcher from './CompanySwitcher';
import { useCompanies } from '@/hooks/useMe';

// Mock the hook so we control the companies list
jest.mock('@/hooks/useMe', () => ({
  useCompanies: jest.fn(),
}));

const mockUseCompanies = useCompanies as jest.Mock;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const companies = [
  { id: 10, name: 'Acme Corp', slug: 'acme', status: 'active', enabled_modules: [], is_default: true },
  { id: 20, name: 'Beta LLC', slug: 'beta', status: 'active', enabled_modules: [], is_default: false },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCompanies.mockReturnValue({ data: companies });
  act(() => {
    useAuthStore.setState({
      token: 'tok_abc',
      user: null,
      activeCompany: companies[0],
    });
  });
});

describe('CompanySwitcher', () => {
  it('renders the active company name', () => {
    render(<CompanySwitcher />, { wrapper });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('calls setActiveCompany when a different company is selected', async () => {
    render(<CompanySwitcher />, { wrapper });
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Beta LLC' }));
    expect(useAuthStore.getState().activeCompany).toEqual({ id: 20, name: 'Beta LLC', slug: 'beta', status: 'active', enabled_modules: [], is_default: false });
  });
});
