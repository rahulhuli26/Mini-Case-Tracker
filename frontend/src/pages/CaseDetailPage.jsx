import { useEffect, useMemo, useState } from 'react';
import { AppBar, Box, Button, Card, CardContent, Chip, Container, Divider, FormControl, Grid, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, Select, Stack, TextField, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useParams } from 'react-router-dom';
import api, { apiOrigin } from '../api/client.js';
import { useAuth } from '../App.jsx';

/**
 * @file Case detail page: shows a single case's info, status-transition
 * actions, comments, documents, and audit-log timeline.
 */

/** MUI Chip color for each case status. */
const statusColors = {
  New: 'default',
  Assigned: 'info',
  'In Progress': 'warning',
  Submitted: 'secondary',
  Cleared: 'success',
  Discrepant: 'error'
};

/**
 * Detail view for a single case, identified by the `:id` route param.
 * Renders role-appropriate status actions (Manager: assign/clear/mark
 * discrepant; Agent: start progress/submit), plus comment and document
 * management and a chronological status timeline.
 *
 * @returns {JSX.Element}
 */
export default function CaseDetailPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [caseItem, setCaseItem] = useState(null);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');

  /** Fetches (or refetches) the case identified by the `:id` route param. */
  const fetchCase = async () => {
    try {
      const { data } = await api.get(`/cases/${id}`);
      setCaseItem(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'Manager') return;

    api.get('/users/agents')
      .then(({ data }) => {
        setAgents(data || []);
        if (data?.length && !selectedAgent) {
          setSelectedAgent(data[0]._id);
        }
      })
      .catch(() => setAgents([]));
  }, [user, selectedAgent]);

  /**
   * Requests a status transition for the case, supplying the assigned
   * agent when moving to `Assigned`, then refetches the case.
   *
   * @param {string} nextStatus - Target status to transition to.
   * @returns {Promise<void>}
   */
  const updateStatus = async (nextStatus) => {
    try {
      if (nextStatus === 'Assigned' && !selectedAgent) {
        alert('Assigned agent is required.');
        return;
      }

      await api.patch(`/cases/${id}/status`, {
        status: nextStatus,
        note,
        assignedTo: nextStatus === 'Assigned' ? selectedAgent : undefined
      });
      setNote('');
      fetchCase();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update status.');
    }
  };

  /** Posts the current comment draft to the case, then clears it and refetches. */
  const addComment = async () => {
    try {
      await api.post(`/cases/${id}/comments`, { body: comment });
      setComment('');
      fetchCase();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to add comment.');
    }
  };

  /** Uploads the selected file to the case as a multipart form, then refetches. */
  const uploadDocument = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/cases/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      fetchCase();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to upload document.');
    }
  };

  /** Audit-log entries sorted oldest-first for the status timeline. */
  const timeline = useMemo(() => [...(caseItem?.auditLog || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [caseItem]);

  if (!caseItem) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Case Details</Typography>
          <Button color="inherit" component={Link} to="/cases">Back to cases</Button>
          <IconButton color="inherit" onClick={logout} aria-label="logout"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
              <Box>
                <Typography variant="overline">Case #{caseItem._id.slice(-6)}</Typography>
                <Typography variant="h4">{caseItem.clientName} / {caseItem.subjectName}</Typography>
              </Box>
              <Chip label={caseItem.status} color={statusColors[caseItem.status] || 'default'} />
            </Stack>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Case type</Typography><Typography>{caseItem.caseType}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Assigned to</Typography><Typography>{caseItem.assignedTo?.name || 'Unassigned'}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Due date</Typography><Typography>{new Date(caseItem.dueDate).toLocaleDateString()}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Manager review</Typography><Typography>{caseItem.managerReview || 'Pending'}</Typography></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Status actions</Typography>
                {user?.role === 'Manager' && caseItem.status === 'New' && (
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel>Assign agent</InputLabel>
                      <Select
                        value={selectedAgent}
                        label="Assign agent"
                        onChange={(event) => setSelectedAgent(event.target.value)}
                      >
                        {agents.map((agent) => (
                          <MenuItem key={agent._id} value={agent._id}>{agent.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user?.role === 'Agent' && caseItem.status === 'Assigned' && <Button variant="contained" onClick={() => updateStatus('In Progress')}>Set In Progress</Button>}
                  {user?.role === 'Agent' && caseItem.status === 'In Progress' && <Button variant="contained" onClick={() => updateStatus('Submitted')}>Submit case</Button>}
                  {user?.role === 'Manager' && caseItem.status === 'New' && <Button variant="contained" onClick={() => updateStatus('Assigned')}>Assign case</Button>}
                  {user?.role === 'Manager' && caseItem.status === 'Submitted' && (
                    <>
                      <Button variant="contained" color="success" onClick={() => updateStatus('Cleared')}>Mark Cleared</Button>
                      <Button variant="contained" color="error" onClick={() => updateStatus('Discrepant')}>Mark Discrepant</Button>
                    </>
                  )}
                </Stack>
                {user?.role === 'Manager' && caseItem.status === 'Submitted' && (
                  <TextField label="Review note" value={note} onChange={(event) => setNote(event.target.value)} fullWidth sx={{ mt: 2 }} />
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Comments</Typography>
                <Stack spacing={2}>
                  {caseItem.comments.map((commentItem) => (
                    <Box key={commentItem._id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography fontWeight={600}>{commentItem.author?.name || 'Unknown'}</Typography>
                      <Typography variant="body2">{commentItem.body}</Typography>
                    </Box>
                  ))}
                  <TextField label="Add a comment" value={comment} onChange={(event) => setComment(event.target.value)} multiline minRows={3} fullWidth />
                  <Button variant="contained" onClick={addComment}>Add comment</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
                <List>
                  {caseItem.documents.length === 0 ? (
                    <ListItem><ListItemText primary="No documents uploaded yet." /></ListItem>
                  ) : caseItem.documents.map((document) => (
                    <ListItem key={document._id} divider>
                      <ListItemText primary={document.originalName} secondary={`${document.mimetype} • ${document.size} bytes`} />
                      <Button component="a" href={`${apiOrigin}${document.path}`} target="_blank" rel="noreferrer">Open</Button>
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                  <Button variant="contained" onClick={uploadDocument} disabled={!file}>Upload document</Button>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Status timeline</Typography>
                <Stack spacing={2}>
                  {timeline.map((entry) => (
                    <Box key={entry._id} sx={{ p: 2, borderLeft: '4px solid #1976d2' }}>
                      <Typography variant="body2" color="text.secondary">{new Date(entry.createdAt).toLocaleString()}</Typography>
                      <Typography>{entry.fromStatus || 'Created'} → {entry.toStatus}</Typography>
                      <Typography variant="body2">By {entry.changedBy?.name || 'System'}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
