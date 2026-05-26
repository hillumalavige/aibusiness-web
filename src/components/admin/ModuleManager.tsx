'use client';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import StatusChip from './StatusChip';
import {
  useAdminCompany,
  useAdminModules,
  useAttachModule,
  useDetachModule,
} from '@/hooks/useAdminCompanies';

interface ModuleManagerProps {
  companyId: number;
}

export default function ModuleManager({ companyId }: ModuleManagerProps) {
  const { data: allModules, isLoading: modulesLoading } = useAdminModules();
  const { data: company, isLoading: companyLoading } = useAdminCompany(companyId);
  const attach = useAttachModule(companyId);
  const detach = useDetachModule(companyId);

  if (modulesLoading || companyLoading) return null;
  if (!allModules || !company) return null;

  const grantedKeys = new Set(company.active_modules.map((m) => m.key));

  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        Modules
      </Typography>
      <List>
        {allModules.map((mod) => {
          const granted = grantedKeys.has(mod.key);
          const isWorking = granted ? detach.isPending : attach.isPending;

          return (
            <ListItem key={mod.key} divider>
              <ListItemText
                primary={mod.name}
                secondary={<StatusChip status={granted ? 'granted' : 'not-granted'} />}
              />
              <ListItemSecondaryAction>
                {granted ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={isWorking}
                    aria-label={`Revoke ${mod.name}`}
                    onClick={() => detach.mutate(mod.key)}
                    startIcon={isWorking ? <CircularProgress size={14} /> : undefined}
                  >
                    Revoke
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="primary"
                    variant="outlined"
                    disabled={isWorking}
                    aria-label={`Grant ${mod.name}`}
                    onClick={() => attach.mutate(mod.key)}
                    startIcon={isWorking ? <CircularProgress size={14} /> : undefined}
                  >
                    Grant
                  </Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </>
  );
}
