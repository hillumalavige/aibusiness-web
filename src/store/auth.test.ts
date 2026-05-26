import { act } from '@testing-library/react';
import { useAuthStore } from './auth';

const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  phone: null,
  is_super_admin: false,
};

const mockCompany = {
  id: 10,
  name: 'Acme',
  slug: 'acme',
  status: 'active',
  enabled_modules: ['hr', 'payroll'],
  is_default: true,
};

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ token: null, user: null, activeCompany: null });
  });
});

describe('useAuthStore', () => {
  it('starts with null state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.activeCompany).toBeNull();
  });

  it('setAuth stores token and user', () => {
    act(() => {
      useAuthStore.getState().setAuth('tok_123', mockUser);
    });
    const { token, user } = useAuthStore.getState();
    expect(token).toBe('tok_123');
    expect(user).toEqual(mockUser);
  });

  it('setActiveCompany stores the company', () => {
    act(() => {
      useAuthStore.getState().setActiveCompany(mockCompany);
    });
    expect(useAuthStore.getState().activeCompany).toEqual(mockCompany);
  });

  it('logout clears all state', () => {
    act(() => {
      useAuthStore.getState().setAuth('tok_123', mockUser);
      useAuthStore.getState().setActiveCompany(mockCompany);
    });
    act(() => {
      useAuthStore.getState().logout();
    });
    const { token, user, activeCompany } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
    expect(activeCompany).toBeNull();
  });
});
