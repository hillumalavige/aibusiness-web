// src/components/SyncTokenCookie.test.tsx
import { render, act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth';
import SyncTokenCookie from './SyncTokenCookie';

beforeEach(() => {
  // Clear document.cookie before each test
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
  act(() => {
    useAuthStore.setState({ token: null, user: null, activeCompany: null });
  });
});

function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(name + '='))
    ?.split('=')[1];
}

describe('SyncTokenCookie', () => {
  it('sets auth-token cookie when token is in store', () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_abc', user: null, activeCompany: null });
    });
    render(<SyncTokenCookie />);
    expect(getCookie('auth-token')).toBe('tok_abc');
  });

  it('clears auth-token cookie when token is null', () => {
    // First set a cookie
    document.cookie = 'auth-token=tok_old; path=/';
    act(() => {
      useAuthStore.setState({ token: null, user: null, activeCompany: null });
    });
    render(<SyncTokenCookie />);
    expect(getCookie('auth-token')).toBeUndefined();
  });

  it('updates cookie when token changes', () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_v1', user: null, activeCompany: null });
    });
    render(<SyncTokenCookie />);
    expect(getCookie('auth-token')).toBe('tok_v1');

    act(() => {
      useAuthStore.setState({ token: 'tok_v2', user: null, activeCompany: null });
    });
    expect(getCookie('auth-token')).toBe('tok_v2');
  });

  it('renders nothing (null)', () => {
    const { container } = render(<SyncTokenCookie />);
    expect(container).toBeEmptyDOMElement();
  });
});
