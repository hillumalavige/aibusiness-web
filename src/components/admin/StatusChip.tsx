'use client';

import Chip from '@mui/material/Chip';

type Status = 'active' | 'trial' | 'suspended' | 'cancelled' | 'granted' | 'not-granted';

const CONFIG: Record<Status, { label: string; color: 'success' | 'info' | 'error' | 'default' }> = {
  active:        { label: 'Active',     color: 'success' },
  trial:         { label: 'Trial',      color: 'info'    },
  suspended:     { label: 'Suspended',  color: 'error'   },
  cancelled:     { label: 'Cancelled',  color: 'default' },
  granted:       { label: 'Granted',    color: 'success' },
  'not-granted': { label: 'Not Granted', color: 'default' },
};

interface StatusChipProps {
  status: Status;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const { label, color } = CONFIG[status] ?? { label: status, color: 'default' as const };
  return <Chip label={label} color={color} size={size} />;
}
