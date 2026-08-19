import { useEffect, useMemo, useState } from 'react';
import { AppBar, Box, Button, Card, CardContent, Chip, Container, FormControl, Grid, IconButton, InputLabel, MenuItem, Pagination, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../App.jsx';

const statusOptions = ['All', 'New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant'];

export default function CaseListPage() {
  const { user, logout } = useAuth();
  const [agents, setAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    clientName: '',
    subjectName: '',
    caseType: '',
    dueDate: '',
    assignedTo: ''
  });

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (status !== 'All') params.set('status', status);
      if (agentFilter !== 'All') params.set('agent', agentFilter);

      const { data } = await api.get(`/cases?${params.toString()}`);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?.role === 'Manager') {
      api.get('/users/agents')
        .then(({ data }) => setAgents(data || []))
        .catch(() => setAgents([]));
    }
  }, [user]);

  useEffect(() => {
    fetchCases();
  }, [page, search, status, agentFilter]);

  const canCreateCase = user?.role === 'Manager';

  const handleFormChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/cases', form);
      setForm({ clientName: '', subjectName: '', caseType: '', dueDate: '', assignedTo: '' });
      setPage(1);
      fetchCases();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to create case.');
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Cases</Typography>
          <Button color="inherit" component={Link} to="/">Dashboard</Button>
          <IconButton color="inherit" onClick={logout} aria-label="logout"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} fullWidth />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}>
              {statusOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </Select>
          </FormControl>
          {user?.role === 'Manager' && (
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Agent</InputLabel>
              <Select value={agentFilter} label="Agent" onChange={(event) => setAgentFilter(event.target.value)}>
                <MenuItem value="All">All</MenuItem>
                {agents.map((agent) => <MenuItem key={agent._id} value={agent._id}>{agent.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Stack>

        {canCreateCase && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Create case</Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}><TextField label="Client name" name="clientName" value={form.clientName} onChange={handleFormChange} fullWidth required /></Grid>
                  <Grid item xs={12} sm={6} md={3}><TextField label="Subject name" name="subjectName" value={form.subjectName} onChange={handleFormChange} fullWidth required /></Grid>
                  <Grid item xs={12} sm={6} md={3}><TextField label="Case type" name="caseType" value={form.caseType} onChange={handleFormChange} fullWidth required /></Grid>
                  <Grid item xs={12} sm={6} md={3}><TextField label="Due date" name="dueDate" type="date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={handleFormChange} fullWidth required /></Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Assign agent</InputLabel>
                      <Select label="Assign agent" name="assignedTo" value={form.assignedTo} onChange={handleFormChange}>
                        <MenuItem value="">Select agent</MenuItem>
                        {agents.map((agent) => <MenuItem key={agent._id} value={agent._id}>{agent.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button type="submit" variant="contained" sx={{ mt: 1 }}>Create case</Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        )}

        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.clientName}</TableCell>
                  <TableCell>{item.subjectName}</TableCell>
                  <TableCell>{item.caseType}</TableCell>
                  <TableCell>{item.assignedTo?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip label={item.status} color={item.status === 'Cleared' ? 'success' : item.status === 'Discrepant' ? 'error' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell><Button component={Link} to={`/cases/${item._id}`} size="small">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page - 1} onChange={(_, nextPage) => setPage(nextPage + 1)} color="primary" />
        </Box>
      </Container>
    </Box>
  );
}
