// src/hooks/useAdminCompanies.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import api from '@/lib/api';
import {
  useAdminCompanies,
  useAdminCompany,
  useAdminModules,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useActivateCompany,
  useSuspendCompany,
  useAttachModule,
  useDetachModule,
} from './useAdminCompanies';

jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const mockCompany = {
  id: 1, name: 'Acme', slug: 'acme', email: 'a@acme.com',
  phone: null, city: null, country: 'LK', status: 'active' as const,
  users_count: 3, active_modules: [], activated_at: null, created_at: '2024-01-01',
};

const mockModule = { id: 1, key: 'hr', name: 'Human Resources' };

describe('useAdminCompanies', () => {
  it('calls GET /admin/companies and unwraps envelope', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { data: [mockCompany], current_page: 1, last_page: 1, per_page: 20, total: 1 } },
    });
    const { result } = renderHook(() => useAdminCompanies(1), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.get).toHaveBeenCalledWith('/admin/companies', { params: { page: 1 } });
    expect(result.current.data?.data).toEqual([mockCompany]);
    expect(result.current.data?.total).toBe(1);
  });
});

describe('useAdminCompany', () => {
  it('calls GET /admin/companies/:id and unwraps envelope', async () => {
    mockApi.get.mockResolvedValue({ data: { data: mockCompany } });
    const { result } = renderHook(() => useAdminCompany(1), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.get).toHaveBeenCalledWith('/admin/companies/1');
    expect(result.current.data).toEqual(mockCompany);
  });
});

describe('useAdminModules', () => {
  it('calls GET /admin/modules and unwraps envelope', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [mockModule] } });
    const { result } = renderHook(() => useAdminModules(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.get).toHaveBeenCalledWith('/admin/modules');
    expect(result.current.data).toEqual([mockModule]);
  });
});

describe('useCreateCompany', () => {
  it('calls POST /admin/companies', async () => {
    mockApi.post.mockResolvedValue({ data: { data: mockCompany } });
    const { result } = renderHook(() => useCreateCompany(), { wrapper });
    result.current.mutate({ name: 'Acme', country: 'LK' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/admin/companies', { name: 'Acme', country: 'LK' });
  });
});

describe('useUpdateCompany', () => {
  it('calls PUT /admin/companies/:id', async () => {
    mockApi.put.mockResolvedValue({ data: { data: mockCompany } });
    const { result } = renderHook(() => useUpdateCompany(1), { wrapper });
    result.current.mutate({ name: 'Acme Updated', country: 'LK' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.put).toHaveBeenCalledWith('/admin/companies/1', { name: 'Acme Updated', country: 'LK' });
  });
});

describe('useDeleteCompany', () => {
  it('calls DELETE /admin/companies/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: { data: null } });
    const { result } = renderHook(() => useDeleteCompany(), { wrapper });
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.delete).toHaveBeenCalledWith('/admin/companies/1');
  });
});

describe('useActivateCompany', () => {
  it('calls POST /admin/companies/:id/activate', async () => {
    mockApi.post.mockResolvedValue({ data: { data: mockCompany } });
    const { result } = renderHook(() => useActivateCompany(), { wrapper });
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/admin/companies/1/activate');
  });
});

describe('useSuspendCompany', () => {
  it('calls POST /admin/companies/:id/suspend', async () => {
    mockApi.post.mockResolvedValue({ data: { data: mockCompany } });
    const { result } = renderHook(() => useSuspendCompany(), { wrapper });
    result.current.mutate(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/admin/companies/1/suspend');
  });
});

describe('useAttachModule', () => {
  it('calls POST /admin/companies/:id/modules', async () => {
    mockApi.post.mockResolvedValue({ data: { data: mockModule } });
    const { result } = renderHook(() => useAttachModule(1), { wrapper });
    result.current.mutate('hr');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/admin/companies/1/modules', { module_key: 'hr' });
  });
});

describe('useDetachModule', () => {
  it('calls DELETE /admin/companies/:id/modules/:key', async () => {
    mockApi.delete.mockResolvedValue({ data: { data: null } });
    const { result } = renderHook(() => useDetachModule(1), { wrapper });
    result.current.mutate('hr');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.delete).toHaveBeenCalledWith('/admin/companies/1/modules/hr');
  });
});
