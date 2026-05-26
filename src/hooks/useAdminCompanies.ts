// src/hooks/useAdminCompanies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminModule {
  id: number;
  key: string;
  name: string;
  pivot?: { status: string };
}

export interface AdminCompany {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  users_count: number;
  active_modules: AdminModule[];
  activated_at: string | null;
  created_at: string;
}

export interface PaginatedCompanies {
  data: AdminCompany[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreateCompanyInput {
  name: string;
  country: string;
  email?: string;
  phone?: string;
  city?: string;
  status?: 'trial' | 'active' | 'suspended';
}

export type UpdateCompanyInput = CreateCompanyInput;

// ─── Query keys ──────────────────────────────────────────────────────────────

const keys = {
  list: (page: number) => ['admin', 'companies', 'list', page] as const,
  detail: (id: number) => ['admin', 'companies', 'detail', id] as const,
  modules: ['admin', 'modules'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useAdminCompanies(page: number) {
  return useQuery<PaginatedCompanies>({
    queryKey: keys.list(page),
    queryFn: () =>
      api
        .get<{ data: { data: AdminCompany[]; current_page: number; last_page: number; per_page: number; total: number } }>(
          '/admin/companies',
          { params: { page } },
        )
        .then((r) => r.data.data),
  });
}

export function useAdminCompany(id: number) {
  return useQuery<AdminCompany>({
    queryKey: keys.detail(id),
    queryFn: () =>
      api
        .get<{ data: AdminCompany }>(`/admin/companies/${id}`)
        .then((r) => r.data.data),
  });
}

export function useAdminModules() {
  return useQuery<AdminModule[]>({
    queryKey: keys.modules,
    queryFn: () =>
      api
        .get<{ data: AdminModule[] }>('/admin/modules')
        .then((r) => r.data.data),
  });
}

// ─── Company mutations ───────────────────────────────────────────────────────

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation<AdminCompany, Error, CreateCompanyInput>({
    mutationFn: (input) =>
      api
        .post<{ data: AdminCompany }>('/admin/companies', input)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'companies', 'list'] }),
  });
}

export function useUpdateCompany(id: number) {
  const qc = useQueryClient();
  return useMutation<AdminCompany, Error, UpdateCompanyInput>({
    mutationFn: (input) =>
      api
        .put<{ data: AdminCompany }>(`/admin/companies/${id}`, input)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: ['admin', 'companies', 'list'] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) =>
      api.delete(`/admin/companies/${id}`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'companies', 'list'] }),
  });
}

export function useActivateCompany() {
  const qc = useQueryClient();
  return useMutation<AdminCompany, Error, number>({
    mutationFn: (id) =>
      api
        .post<{ data: AdminCompany }>(`/admin/companies/${id}/activate`)
        .then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: ['admin', 'companies', 'list'] });
    },
  });
}

export function useSuspendCompany() {
  const qc = useQueryClient();
  return useMutation<AdminCompany, Error, number>({
    mutationFn: (id) =>
      api
        .post<{ data: AdminCompany }>(`/admin/companies/${id}/suspend`)
        .then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: ['admin', 'companies', 'list'] });
    },
  });
}

// ─── Module mutations ────────────────────────────────────────────────────────

export function useAttachModule(companyId: number) {
  const qc = useQueryClient();
  return useMutation<AdminModule, Error, string>({
    mutationFn: (moduleKey) =>
      api
        .post<{ data: AdminModule }>(`/admin/companies/${companyId}/modules`, { module_key: moduleKey })
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(companyId) }),
  });
}

export function useDetachModule(companyId: number) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (moduleKey) =>
      api
        .delete(`/admin/companies/${companyId}/modules/${moduleKey}`)
        .then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(companyId) }),
  });
}
