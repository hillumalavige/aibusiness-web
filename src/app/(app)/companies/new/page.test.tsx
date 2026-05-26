import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NewCompanyPage from './page';
import * as hooks from '@/hooks/useAdminCompanies';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/hooks/useAdminCompanies');
jest.mock('@/components/admin/CompanyForm', () => ({
  __esModule: true,
  default: ({ onSubmit, isLoading, onCancel }: any) => (
    <div>
      <button onClick={() => onSubmit({ name: 'New Co', country: 'LK' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
      {isLoading && <span>Loading...</span>}
    </div>
  ),
}));

const mockHooks = hooks as jest.Mocked<typeof hooks>;
const mockPush = jest.fn();
const mockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  mockHooks.useCreateCompany.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  } as any);
});

describe('NewCompanyPage', () => {
  it('renders page title "New Company"', () => {
    render(<NewCompanyPage />);
    expect(screen.getByText('New Company')).toBeInTheDocument();
  });

  it('renders the CompanyForm', () => {
    render(<NewCompanyPage />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('calls useCreateCompany mutate when form is submitted', async () => {
    render(<NewCompanyPage />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      { name: 'New Co', country: 'LK' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('navigates to /companies on successful create', async () => {
    mockHooks.useCreateCompany.mockReturnValue({
      mutate: (_input: any, opts: any) => opts?.onSuccess?.(),
      isPending: false,
      isError: false,
      error: null,
    } as any);
    render(<NewCompanyPage />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/companies'));
  });

  it('navigates to /companies when Cancel is clicked', () => {
    render(<NewCompanyPage />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/companies');
  });

  it('shows error Alert on API failure', () => {
    mockHooks.useCreateCompany.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Server error'),
    } as any);
    render(<NewCompanyPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/failed to create company/i)).toBeInTheDocument();
  });
});
