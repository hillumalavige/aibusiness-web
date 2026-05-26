// src/app/(app)/companies/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import CompaniesPage from './page';
import * as hooks from '@/hooks/useAdminCompanies';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/hooks/useAdminCompanies');
jest.mock('@/components/admin/StatusChip', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span data-testid="status-chip">{status}</span>,
}));

const mockHooks = hooks as jest.Mocked<typeof hooks>;
const mockPush = jest.fn();
const mockMutate = jest.fn();

const company1 = {
  id: 1, name: 'Acme Corp', slug: 'acme', email: null, phone: null, city: null,
  country: 'LK', status: 'active' as const, users_count: 5, active_modules: [],
  activated_at: null, created_at: '2024-01-01',
};
const company2 = {
  id: 2, name: 'Beta Ltd', slug: 'beta', email: null, phone: null, city: null,
  country: 'US', status: 'trial' as const, users_count: 2, active_modules: [],
  activated_at: null, created_at: '2024-02-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  mockHooks.useAdminCompanies.mockReturnValue({
    data: { data: [company1, company2], current_page: 1, last_page: 1, per_page: 20, total: 2 },
    isLoading: false,
  } as any);
  mockHooks.useDeleteCompany.mockReturnValue({ mutate: mockMutate, isPending: false } as any);
  mockHooks.useActivateCompany.mockReturnValue({ mutate: mockMutate, isPending: false } as any);
  mockHooks.useSuspendCompany.mockReturnValue({ mutate: mockMutate, isPending: false } as any);
});

describe('CompaniesPage', () => {
  it('renders company names in table rows', () => {
    render(<CompaniesPage />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
  });

  it('renders "Add Company" button', () => {
    render(<CompaniesPage />);
    expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument();
  });

  it('navigates to /companies/new when Add Company is clicked', () => {
    render(<CompaniesPage />);
    fireEvent.click(screen.getByRole('button', { name: /add company/i }));
    expect(mockPush).toHaveBeenCalledWith('/companies/new');
  });

  it('shows loading spinner while fetching', () => {
    mockHooks.useAdminCompanies.mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<CompaniesPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no companies', () => {
    mockHooks.useAdminCompanies.mockReturnValue({
      data: { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 },
      isLoading: false,
    } as any);
    render(<CompaniesPage />);
    expect(screen.getByText(/no companies yet/i)).toBeInTheDocument();
  });

  it('shows Suspend button for active company and calls useSuspendCompany mutate', () => {
    render(<CompaniesPage />);
    const suspendBtn = screen.getAllByRole('button', { name: /suspend/i })[0];
    fireEvent.click(suspendBtn);
    expect(mockMutate).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('shows Activate button for trial company and calls useActivateCompany mutate', () => {
    render(<CompaniesPage />);
    const activateBtn = screen.getAllByRole('button', { name: /activate/i })[0];
    fireEvent.click(activateBtn);
    expect(mockMutate).toHaveBeenCalledWith(2, expect.any(Object));
  });

  it('opens delete confirmation dialog when Delete is clicked', () => {
    render(<CompaniesPage />);
    const deleteBtn = screen.getAllByRole('button', { name: /delete acme corp/i })[0];
    fireEvent.click(deleteBtn);
    expect(screen.getByText(/type the company name to confirm/i)).toBeInTheDocument();
  });

  it('enables confirm button only when company name is typed exactly', async () => {
    render(<CompaniesPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /delete acme corp/i })[0]);

    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    expect(confirmBtn).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: /company name/i }), 'Acme Corp');
    await waitFor(() => expect(confirmBtn).not.toBeDisabled());
  });

  it('calls useDeleteCompany mutate with company id after confirmation', async () => {
    render(<CompaniesPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /delete acme corp/i })[0]);
    await userEvent.type(screen.getByRole('textbox', { name: /company name/i }), 'Acme Corp');
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    expect(mockMutate).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
