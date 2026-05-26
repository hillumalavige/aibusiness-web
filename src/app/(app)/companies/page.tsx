'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusChip from '@/components/admin/StatusChip';
import {
  useAdminCompanies,
  useDeleteCompany,
  useActivateCompany,
  useSuspendCompany,
  type AdminCompany,
} from '@/hooks/useAdminCompanies';

export default function CompaniesPage() {
  const router = useRouter();
  const [page, setPage] = useState(0); // MUI TablePagination is 0-indexed
  const { data, isLoading } = useAdminCompanies(page + 1); // API is 1-indexed

  const deleteMutation = useDeleteCompany();
  const activateMutation = useActivateCompany();
  const suspendMutation = useSuspendCompany();

  const [deleteTarget, setDeleteTarget] = useState<AdminCompany | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  function openDeleteDialog(company: AdminCompany) {
    setDeleteTarget(company);
    setDeleteConfirmText('');
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
    setDeleteConfirmText('');
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: closeDeleteDialog,
      onError: () => setMutationError('Failed to delete company. Please try again.'),
    });
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const companies = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Box>
      <Toolbar disableGutters sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Companies
        </Typography>
        <Button variant="contained" onClick={() => router.push('/companies/new')}>
          Add Company
        </Button>
      </Toolbar>

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMutationError(null)}>
          {mutationError}
        </Alert>
      )}

      {companies.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ mt: 8 }}>
          No companies yet.
        </Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Modules</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>
                    <StatusChip status={company.status} />
                  </TableCell>
                  <TableCell>{company.users_count}</TableCell>
                  <TableCell>{company.active_modules.map((m) => m.name).join(', ') || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label={`Edit ${company.name}`}
                      onClick={() => router.push(`/companies/${company.id}/edit`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {company.status === 'active' && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() =>
                          suspendMutation.mutate(company.id, {
                            onError: () => setMutationError('Failed to suspend company.'),
                          })
                        }
                      >
                        Suspend
                      </Button>
                    )}
                    {(company.status === 'trial' || company.status === 'suspended') && (
                      <Button
                        size="small"
                        color="success"
                        onClick={() =>
                          activateMutation.mutate(company.id, {
                            onError: () => setMutationError('Failed to activate company.'),
                          })
                        }
                      >
                        Activate
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={`Delete ${company.name}`}
                      onClick={() => openDeleteDialog(company)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            onPageChange={(_, newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Type the company name to confirm deletion of{' '}
            <strong>{deleteTarget?.name}</strong>.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Company name"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== deleteTarget?.name}
            onClick={confirmDelete}
            aria-label="Confirm Delete"
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
