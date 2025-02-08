import React, { useState } from 'react';
import { useAuth } from '../../../contexts/auth.contexts';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { login as userLogin } from '../../../api/auth.service';
import { toast } from 'react-hot-toast';
import Form from '../../../components/form/form.component';
import FormInput from '../../../components/formInput/formInput.component';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await userLogin(username, password);
      login(response.token, response.user);
      toast.success(response.message || 'Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.message || 'An error occurred');
    }
  };

  const validateRequiredFields = (field: string, value: string) => {
    if (!value) {
      return `${field} is required`;
    }
    return undefined;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LockOutlinedIcon sx={{ m: 1, bgcolor: 'primary.main', p: 1, width: '2em', height: '2em', borderRadius: '50%', color: 'white' }} />
            <Typography component="h1" variant="h5">
              Login
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Form onSubmit={handleLogin}>
              <FormInput
                name='username'
                label='Username'
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                validate={validateRequiredFields}
                required
                autoComplete="username"
                autoFocus
                className='mb-4'
                fullWidth
              />
              <FormInput
                name='password'
                label='Password'
                type='password'
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                validate={validateRequiredFields}
                required
                className='mb-4'
                autoComplete="current-password"
                fullWidth
              />
              <Link to="/auth/signup" className='mb-4'>create account</Link>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
            </Form>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
