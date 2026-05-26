'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CompanyForm from '@/components/admin/CompanyForm';
import ModuleManager from '@/components/admin/ModuleManager';
import { useAdminCompany, useUpdateCompany, type UpdateCompanyInput } from '@/hooks/useAdminCompanies';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const { data: company, isLoading } = useAdminCompany(id);
  const updateMutation = useUpdateCompany(id);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleSubmit(values: UpdateCompanyInput) {
    setSaveSuccess(false);
    updateMutation.mutate(values, {
      onSuccess: () => setSaveSuccess(true),
    });
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Edit Company
      </Typography>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to update company. Please try again.
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          Company saved successfully.
        </Alert>
      )}

      <CompanyForm
        initialValues={company}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        onCancel={() => router.push('/companies')}
      />

      <Divider sx={{ my: 4 }} />

      <ModuleManager companyId={id} />
    </Box>
  );
}
