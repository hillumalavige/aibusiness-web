// src/components/AppShell.test.tsx
import { render, screen } from '@testing-library/react';
import AppShell from './AppShell';

// Mock child components to keep this test focused on AppShell structure
jest.mock('@/components/CompanySwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="company-switcher" />,
}));

jest.mock('@/components/NavItem', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}>{label}</div>,
}));

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
});
