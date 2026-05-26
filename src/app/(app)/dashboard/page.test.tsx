import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/store/auth';
import DashboardPage from './page';

jest.mock('@/store/auth', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockUser = { id: 1, name: 'Alice Smith', email: 'alice@example.com', is_super_admin: false };
const mockCompany = {
  id: 10,
  name: 'Acme Corp',
  slug: 'acme',
  status: 'active',
  enabled_modules: ['hr'],
  is_default: true,
};

beforeEach(() => {
  // DashboardPage calls useAuthStore twice: once for user, once for activeCompany
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({ user: mockUser, activeCompany: mockCompany }),
  );
});

describe('DashboardPage', () => {
  it('shows a welcome message with the user name', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Welcome back, Alice Smith')).toBeInTheDocument();
  });

  it('shows the active company name', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Active company: Acme Corp')).toBeInTheDocument();
  });

  it('renders nothing when user or company is not loaded', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null, activeCompany: null }),
    );
    const { container } = render(<DashboardPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
