// src/components/admin/ModuleManager.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ModuleManager from './ModuleManager';
import * as hooks from '@/hooks/useAdminCompanies';

jest.mock('@/hooks/useAdminCompanies');
const mockHooks = hooks as jest.Mocked<typeof hooks>;

const allModules = [
  { id: 1, key: 'hr', name: 'Human Resources' },
  { id: 2, key: 'crm', name: 'Customer Relationship Management' },
  { id: 3, key: 'inventory', name: 'Inventory & Warehouse' },
  { id: 4, key: 'accounting', name: 'Accounting & Finance' },
];

const company = {
  id: 1, name: 'Acme', slug: 'acme', email: null, phone: null, city: null,
  country: 'LK', status: 'active' as const, users_count: 2,
  active_modules: [{ id: 1, key: 'hr', name: 'Human Resources' }],
  activated_at: null, created_at: '2024-01-01',
};

const mockAttachMutate = jest.fn();
const mockDetachMutate = jest.fn();

let queryClient: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  queryClient = new QueryClient();
  jest.clearAllMocks();
  mockHooks.useAdminModules.mockReturnValue({ data: allModules, isLoading: false } as any);
  mockHooks.useAdminCompany.mockReturnValue({ data: company, isLoading: false } as any);
  mockHooks.useAttachModule.mockReturnValue({ mutate: mockAttachMutate, isPending: false } as any);
  mockHooks.useDetachModule.mockReturnValue({ mutate: mockDetachMutate, isPending: false } as any);
});

describe('ModuleManager', () => {
  it('renders all 4 modules', () => {
    render(<ModuleManager companyId={1} />, { wrapper });
    expect(screen.getByText('Human Resources')).toBeInTheDocument();
    expect(screen.getByText('Customer Relationship Management')).toBeInTheDocument();
    expect(screen.getByText('Inventory & Warehouse')).toBeInTheDocument();
    expect(screen.getByText('Accounting & Finance')).toBeInTheDocument();
  });

  it('shows Revoke button for granted module (hr)', () => {
    render(<ModuleManager companyId={1} />, { wrapper });
    expect(screen.getByRole('button', { name: /revoke human resources/i })).toBeInTheDocument();
  });

  it('shows Grant button for non-granted module (crm)', () => {
    render(<ModuleManager companyId={1} />, { wrapper });
    expect(screen.getByRole('button', { name: /grant customer relationship management/i })).toBeInTheDocument();
  });

  it('calls useAttachModule mutate when Grant is clicked', () => {
    render(<ModuleManager companyId={1} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /grant customer relationship management/i }));
    expect(mockAttachMutate).toHaveBeenCalledWith('crm');
  });

  it('calls useDetachModule mutate when Revoke is clicked', () => {
    render(<ModuleManager companyId={1} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /revoke human resources/i }));
    expect(mockDetachMutate).toHaveBeenCalledWith('hr');
  });
});
