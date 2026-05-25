// src/components/CompanySwitcher.tsx
'use client';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useCompanies } from '@/hooks/useMe';
import { useAuthStore, Company } from '@/store/auth';

export default function CompanySwitcher() {
  const { data: companies } = useCompanies();
  const { activeCompany, setActiveCompany } = useAuthStore();

  const handleChange = (event: SelectChangeEvent<number | string>) => {
    const selectedId = Number(event.target.value);
    const selected = companies?.find((c: Company) => c.id === selectedId);
    if (selected) setActiveCompany(selected);
  };

  return (
    <Select
      value={activeCompany?.id ?? ''}
      onChange={handleChange}
      size="small"
      variant="outlined"
      sx={{
        color: 'white',
        minWidth: 160,
        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
        '.MuiSvgIcon-root': { color: 'white' },
      }}
      inputProps={{ 'aria-label': 'Select company' }}
    >
      {companies?.map((c: Company) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </Select>
  );
}
