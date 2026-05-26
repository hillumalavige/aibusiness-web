'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { AdminCompany, CreateCompanyInput } from '@/hooks/useAdminCompanies';

interface CompanyFormProps {
  initialValues?: Partial<AdminCompany>;
  onSubmit: (values: CreateCompanyInput) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export default function CompanyForm({ initialValues, onSubmit, isLoading, onCancel }: CompanyFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [city, setCity] = useState(initialValues?.city ?? '');
  const [country, setCountry] = useState(initialValues?.country ?? 'LK');
  const [status, setStatus] = useState<'trial' | 'active' | 'suspended'>(
    (initialValues?.status as 'trial' | 'active' | 'suspended') ?? 'trial',
  );
  const [nameError, setNameError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');
    onSubmit({
      name: name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      city: city || undefined,
      country,
      status,
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!nameError}
          helperText={nameError}
          required
          fullWidth
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
        />
        <TextField
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel id="country-label">Country</InputLabel>
          <Select
            labelId="country-label"
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            SelectDisplayProps={{ 'aria-label': 'Country' } as React.HTMLAttributes<HTMLDivElement>}
          >
            <MenuItem value="LK">Sri Lanka</MenuItem>
            <MenuItem value="US">United States</MenuItem>
            <MenuItem value="GB">United Kingdom</MenuItem>
            <MenuItem value="AU">Australia</MenuItem>
            <MenuItem value="IN">India</MenuItem>
            <MenuItem value="SG">Singapore</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'trial' | 'active' | 'suspended')}
            SelectDisplayProps={{ 'aria-label': 'Status' } as React.HTMLAttributes<HTMLDivElement>}
          >
            <MenuItem value="trial">Trial</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Save
          </Button>
          <Button type="button" variant="outlined" onClick={onCancel ?? (() => {})}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
