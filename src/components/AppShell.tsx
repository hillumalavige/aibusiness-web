// src/components/AppShell.tsx
'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import CompanySwitcher from '@/components/CompanySwitcher';
import NavItem from '@/components/NavItem';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useAuth';

const DRAWER_WIDTH = 240;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const userName = useAuthStore((s) => s.user?.name);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top app bar — sits above the drawer */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            aibusiness
          </Typography>
          {userName && (
            <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
              {userName}
            </Typography>
          )}
          <CompanySwitcher />
          <LogoutButton />
        </Toolbar>
      </AppBar>

      {/* Permanent sidebar — no toggle; always visible */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar /> {/* Spacer so list clears the AppBar */}
        <List>
          <NavItem href="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
          <NavItem href="/employees" icon={<PeopleIcon />}    label="Employees" />
          <NavItem href="/leave"     icon={<EventIcon />}     label="Leave" />
          <NavItem href="/ai-chat"   icon={<ChatIcon />}      label="AI Chat" />
        </List>
      </Drawer>

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Spacer so content clears the AppBar */}
        {children}
      </Box>
    </Box>
  );
}

function LogoutButton() {
  const logout = useLogout();
  return (
    <IconButton
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      sx={{ color: 'white', ml: 1 }}
      aria-label="Logout"
    >
      {logout.isPending ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <LogoutIcon />
      )}
    </IconButton>
  );
}
