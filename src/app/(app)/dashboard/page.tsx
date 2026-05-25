// src/app/(app)/dashboard/page.tsx
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary">
        Welcome to aibusiness. Select a module from the sidebar.
      </Typography>
    </Box>
  );
}
