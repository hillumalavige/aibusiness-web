'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMe } from '@/hooks/useMe';
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile';

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <ProfileForm user={user} />
      <Divider sx={{ my: 4 }} />
      <PasswordForm />
    </Box>
  );
}

// ── Profile section ──────────────────────────────────────────────────────────

function ProfileForm({ user }: { user?: { name: string; email: string; phone: string | null } }) {
  const [name, setName]   = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [success, setSuccess] = useState(false);

  const updateMutation = useUpdateProfile();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    updateMutation.mutate(
      { name, email, phone: phone || null },
      { onSuccess: () => setSuccess(true) },
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" sx={{ mb: 3 }}>Edit Profile</Typography>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to update profile. Please try again.
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Profile updated.
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          id="name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'Name' } }}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'Email' } }}
        />
        <TextField
          id="phone"
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'Phone' } }}
        />
        <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
          Save Profile
        </Button>
      </Stack>
    </Box>
  );
}

// ── Password section ─────────────────────────────────────────────────────────

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchError,      setMatchError]      = useState('');
  const [success,         setSuccess]         = useState(false);

  const passwordMutation = useChangePassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMatchError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setMatchError('Passwords do not match.');
      return;
    }

    passwordMutation.mutate(
      { current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword },
      {
        onSuccess: () => {
          setSuccess(true);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    );
  }

  const apiError = passwordMutation.isError
    ? ((passwordMutation.error as any)?.response?.data?.message ?? 'Failed to update password. Please try again.')
    : null;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" sx={{ mb: 3 }}>Change Password</Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Password updated.
        </Alert>
      )}
      {matchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {matchError}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          id="current-password"
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'Current password' } }}
        />
        <TextField
          id="new-password"
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'New password' } }}
        />
        <TextField
          id="confirm-password"
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'Confirm new password' } }}
        />
        <Button type="submit" variant="outlined" disabled={passwordMutation.isPending}>
          Update Password
        </Button>
      </Stack>
    </Box>
  );
}
