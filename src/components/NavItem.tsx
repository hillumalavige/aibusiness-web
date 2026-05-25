// src/components/NavItem.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  // Match exact path OR child paths (e.g. /dashboard/settings matches /dashboard)
  // Avoids false positives like /dash matching /dashboard
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={href}
        selected={isActive}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );
}
