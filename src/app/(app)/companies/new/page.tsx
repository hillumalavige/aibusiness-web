'use client';

import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CompanyForm from '@/components/admin/CompanyForm';
import { useCreateCompany, type CreateCompanyInput } from '@/hooks/useAdminCompanies';

export default function NewCompanyPage() {
  const router = useRouter();
  const createMutation = useCreateCompany();

  function handleSubmit(values: CreateCompanyInput) {
    createMutation.mutate(values, {
      onSuccess: () => router.push('/companies'),
    });
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        New Company
      </Typography>

      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to create company. Please try again.
        </Alert>
      )}

      <CompanyForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onCancel={() => router.push('/companies')}
      />
    </Box>
  );
}
