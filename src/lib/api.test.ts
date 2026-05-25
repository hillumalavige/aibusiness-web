import MockAdapter from 'axios-mock-adapter';
import api from './api';
import { useAuthStore } from '@/store/auth';
import { act } from '@testing-library/react';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(api);
  act(() => {
    useAuthStore.setState({ token: null, user: null, activeCompany: null });
  });
});

afterEach(() => {
  mock.restore();
});

describe('api request interceptor', () => {
  it('does not set Authorization header when no token', async () => {
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });
    await api.get('/test');
  });

  it('sets Authorization Bearer header when token is set', async () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_abc', user: null, activeCompany: null });
    });
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer tok_abc');
      return [200, {}];
    });
    await api.get('/test');
  });

  it('sets X-Company-Id header when activeCompany is set', async () => {
    act(() => {
      useAuthStore.setState({
        token: 'tok_abc',
        user: null,
        activeCompany: { id: 42, name: 'Acme', slug: 'acme', status: 'active', enabled_modules: [], is_default: true },
      });
    });
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.['X-Company-Id']).toBe('42');
      return [200, {}];
    });
    await api.get('/test');
  });
});

describe('api response interceptor', () => {
  it('calls logout when response is 401', async () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_abc', user: null, activeCompany: null });
    });
    mock.onGet('/test').reply(401);
    await expect(api.get('/test')).rejects.toThrow();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('does not call logout on other errors', async () => {
    act(() => {
      useAuthStore.setState({ token: 'tok_abc', user: null, activeCompany: null });
    });
    mock.onGet('/test').reply(500);
    await expect(api.get('/test')).rejects.toThrow();
    expect(useAuthStore.getState().token).toBe('tok_abc');
  });
});
