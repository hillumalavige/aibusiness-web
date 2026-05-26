// src/app/(app)/companies/[id]/edit/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import EditCompanyPage from './page';
import * as hooks from '@/hooks/useAdminCompanies';

jest.mock('next/navigation', () => ({ useRouter: jest.fn(), useParams: jest.fn() }));
jest.mock('@/hooks/useAdminCompanies');
jest.mock('@/components/admin/CompanyForm', () => ({
  __esModule: true,
  default: ({ onSubmit, onCancel, initialValues, isLoading }: any) => (
    <div>
      <span data-testid="initial-name">{initialValues?.name}</span>
      <button onClick={() => onSubmit({ name: initialValues?.name, country: 'LK' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
      {isLoading && <span>Loading...</span>}
    </div>
  ),
}));
jest.mock('@/components/admin/ModuleManager', () => ({
  __esModule: true,
  default: ({ companyId }: { companyId: number }) => (
    <div data-testid={`module-manager-${companyId}`} />
  ),
}));

const mockHooks = hooks as jest.Mocked<typeof hooks>;
const mockPush = jest.fn();
const mockMutate = jest.fn();

const company = {
  id: 5, name: 'Edit Corp', slug: 'edit-corp', email: 'e@edit.com', phone: null, city: null,
  country: 'LK', status: 'active' as const, users_count: 1, active_modules: [],
  activated_at: null, created_at: '2024-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useParams as jest.Mock).mockReturnValue({ id: '5' });
  mockHooks.useAdminCompany.mockReturnValue({ data: company, isLoading: false } as any);
  mockHooks.useUpdateCompany.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  } as any);
});

describe('EditCompanyPage', () => {
  it('shows loading spinner while company is fetching', () => {
    mockHooks.useAdminCompany.mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<EditCompanyPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('pre-fills form with company name', () => {
    render(<EditCompanyPage />);
    expect(screen.getByTestId('initial-name').textContent).toBe('Edit Corp');
  });

  it('calls useUpdateCompany mutate on form submit', () => {
    render(<EditCompanyPage />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      { name: 'Edit Corp', country: 'LK' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('shows success alert after save', async () => {
    mockHooks.useUpdateCompany.mockReturnValue({
      mutate: (_input: any, opts: any) => opts?.onSuccess?.(),
      isPending: false,
      isError: false,
      isSuccess: false,
    } as any);
    render(<EditCompanyPage />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/company saved/i)).toBeInTheDocument();
  });

  it('renders the ModuleManager with the company id', () => {
    render(<EditCompanyPage />);
    expect(screen.getByTestId('module-manager-5')).toBeInTheDocument();
  });

  it('navigates to /companies when Cancel is clicked', () => {
    render(<EditCompanyPage />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/companies');
  });

  it('shows error Alert on API failure', () => {
    mockHooks.useUpdateCompany.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      isSuccess: false,
    } as any);
    render(<EditCompanyPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/failed to update company/i)).toBeInTheDocument();
  });
});
