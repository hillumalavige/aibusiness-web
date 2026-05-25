// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => router.replace('/dashboard') },
    );
  };

  return (
    <Card sx={{ width: 400, p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h1" gutterBottom>
          Sign in to aibusiness
        </Typography>

        {login.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Invalid credentials. Please try again.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="email"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={login.isPending}
            startIcon={login.isPending ? <CircularProgress size={16} /> : null}
          >
            Sign In
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
