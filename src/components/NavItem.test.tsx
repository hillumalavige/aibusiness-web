// src/components/NavItem.test.tsx
import { render, screen } from '@testing-library/react';
import HomeIcon from '@mui/icons-material/Home';
import NavItem from './NavItem';

// Mock Next.js Link and usePathname
jest.mock('next/link', () => {
  const Link = ({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';
const mockUsePathname = usePathname as jest.Mock;

describe('NavItem', () => {
  it('renders label and icon', () => {
    mockUsePathname.mockReturnValue('/other');
    render(<NavItem href="/dashboard" icon={<HomeIcon />} label="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('is not selected when pathname does not match href', () => {
    mockUsePathname.mockReturnValue('/other');
    render(<NavItem href="/dashboard" icon={<HomeIcon />} label="Dashboard" />);
    const button = screen.getByRole('link');
    expect(button).not.toHaveClass('Mui-selected');
  });

  it('is selected when pathname matches href exactly', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<NavItem href="/dashboard" icon={<HomeIcon />} label="Dashboard" />);
    const button = screen.getByRole('link');
    expect(button).toHaveClass('Mui-selected');
  });

  it('is selected when pathname starts with href (child route)', () => {
    mockUsePathname.mockReturnValue('/dashboard/settings');
    render(<NavItem href="/dashboard" icon={<HomeIcon />} label="Dashboard" />);
    const button = screen.getByRole('link');
    expect(button).toHaveClass('Mui-selected');
  });

  it('is not selected for a prefix-only partial match', () => {
    // /dash should NOT match /dashboard
    mockUsePathname.mockReturnValue('/dash');
    render(<NavItem href="/dashboard" icon={<HomeIcon />} label="Dashboard" />);
    const button = screen.getByRole('link');
    expect(button).not.toHaveClass('Mui-selected');
  });
});
