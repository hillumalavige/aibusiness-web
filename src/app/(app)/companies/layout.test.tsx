import { render, screen, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CompaniesLayout from './layout';
import { useAuthStore } from '@/store/auth';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/store/auth', () => ({ useAuthStore: jest.fn() }));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
});

describe('CompaniesLayout', () => {
  it('renders children when user is super-admin', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 1, name: 'Admin', email: 'a@a.com', is_super_admin: true } }),
    );
    render(
      <CompaniesLayout>
        <div data-testid="protected-content">Secret</div>
      </CompaniesLayout>,
    );
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders nothing when user is not super-admin', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 2, name: 'Regular', email: 'r@r.com', is_super_admin: false } }),
    );
    render(
      <CompaniesLayout>
        <div data-testid="protected-content">Secret</div>
      </CompaniesLayout>,
    );
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /dashboard when user is not super-admin', async () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 2, name: 'Regular', email: 'r@r.com', is_super_admin: false } }),
    );
    await act(async () => {
      render(
        <CompaniesLayout>
          <div>Secret</div>
        </CompaniesLayout>,
      );
    });
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('renders nothing when user is null (loading)', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null }),
    );
    render(
      <CompaniesLayout>
        <div data-testid="protected-content">Secret</div>
      </CompaniesLayout>,
    );
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
