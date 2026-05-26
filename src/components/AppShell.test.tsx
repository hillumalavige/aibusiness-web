// src/components/AppShell.test.tsx
import { render, screen } from '@testing-library/react';
import AppShell from './AppShell';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useAuth';

jest.mock('@/components/CompanySwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="company-switcher" />,
}));

jest.mock('@/components/NavItem', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => (
    <div data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}>{label}</div>
  ),
}));

jest.mock('@/store/auth', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useLogout: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseLogout = useLogout as jest.MockedFunction<typeof useLogout>;

beforeEach(() => {
  // AppShell reads s.user?.name — pass the full state so the selector works
  mockUseAuthStore.mockImplementation((selector: any) =>
    selector({
      user: { id: 1, name: 'Alice Smith', email: 'alice@example.com', is_super_admin: false },
      activeCompany: null,
    }),
  );
  mockUseLogout.mockReturnValue({ mutate: jest.fn(), isPending: false } as any);
});

describe('AppShell', () => {
  it('renders the app title', () => {
    render(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText('aibusiness')).toBeInTheDocument();
  });

  it('renders the company switcher', () => {
    render(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByTestId('company-switcher')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-employees')).toBeInTheDocument();
    expect(screen.getByTestId('nav-leave')).toBeInTheDocument();
    expect(screen.getByTestId('nav-ai-chat')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    render(<AppShell><div data-testid="page-content">Hello</div></AppShell>);
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('shows the logged-in user name', () => {
    render(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('renders the logout button', () => {
    render(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
