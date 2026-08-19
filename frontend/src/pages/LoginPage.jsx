import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CardHeader, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../App.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: 'manager@caseflow.test', password: 'Manager123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3}>
        <CardHeader title="Mini Case Tracker" subheader="Sign in to continue" />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
              <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Signing in...' : 'Log in'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Seeded accounts: manager@caseflow.test / Manager123! and agent@caseflow.test / Agent123!
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
