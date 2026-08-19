import { useEffect, useMemo, useState } from 'react';
import { AppBar, Box, Button, Card, CardContent, Chip, Container, Grid, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../App.jsx';

const statusColors = {
  New: 'default',
  Assigned: 'info',
  'In Progress': 'warning',
  Submitted: 'secondary',
  Cleared: 'success',
  Discrepant: 'error'
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data } = await api.get('/cases?limit=10&page=1');
        setCases(data.items || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCases();
  }, []);

  const stats = useMemo(() => {
    const counts = { New: 0, Assigned: 0, 'In Progress': 0, Submitted: 0, Cleared: 0, Discrepant: 0 };

    for (const item of cases) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }

    return counts;
  }, [cases]);

  const recent = cases.slice(0, 5);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Mini Case Tracker</Typography>
          <Button color="inherit" component={Link} to="/cases">Cases</Button>
          <IconButton color="inherit" onClick={logout} aria-label="logout"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="overline">Welcome back</Typography>
            <Typography variant="h4">{user?.name}</Typography>
          </Box>
          <Chip label={user?.role} color="secondary" />
        </Stack>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {Object.entries(stats).map(([label, value]) => (
            <Grid item xs={12} sm={6} md={4} key={label}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">{label}</Typography>
                  <Typography variant="h4">{value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent cases</Typography>
            <Stack spacing={2}>
              {recent.length === 0 ? (
                <Typography>No cases found.</Typography>
              ) : recent.map((item) => (
                <Box key={item._id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography fontWeight={600}>{item.clientName} / {item.subjectName}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.caseType} • Assigned to {item.assignedTo?.name || 'Unassigned'}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={item.status} color={statusColors[item.status] || 'default'} size="small" />
                    <Button component={Link} to={`/cases/${item._id}`} size="small" variant="outlined">Open</Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
