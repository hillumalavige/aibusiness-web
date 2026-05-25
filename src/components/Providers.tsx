// src/components/Providers.tsx
'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { makeQueryClient } from '@/lib/queryClient';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a single QueryClient per component tree (not per render)
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
