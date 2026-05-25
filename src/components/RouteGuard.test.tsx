import { render, screen, act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth';
import RouteGuard from './RouteGuard';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  mockReplace.mockReset();
  act(() => {
    useAuthStore.setState({ token: null, user: null, activeCompany: null });
  });
});

describe('RouteGuard', () => {
  it('renders null and redirects to /login when no token', () => {
    const { container } = render(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('renders children when token is present', () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_abc', user: null, activeCompany: null });
    });
    render(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects when token is cleared after initial render', () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_abc', user: null, activeCompany: null });
    });
    render(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();

    act(() => {
      useAuthStore.getState().logout();
    });
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
