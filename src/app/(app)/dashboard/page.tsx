'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useAuthStore } from '@/store/auth';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const activeCompany = useAuthStore((s) => s.activeCompany);

  // Store not yet hydrated (first render before persist rehydrates)
  if (!user || !activeCompany) return null;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Welcome back, {user.name}
          </Typography>
          <Typography color="text.secondary">
            Active company: {activeCompany.name}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
