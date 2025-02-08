import React, { useState } from 'react'

import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { signup as userSignup } from '../../../api/auth.service';
import Form from '../../../components/form/form.component';
import FormInput from '../../../components/formInput/formInput.component';

function signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('user');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await userSignup(username, password, type);
            toast.success(response.message || 'Signup successful');
            navigate('/auth/login');
        } catch (error: any) {
            console.error('Signup error:', error);
            toast.error(error.response?.data?.message || 'Signup failed');
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
                        <PersonAddAltIcon sx={{ m: 1, bgcolor: 'primary.main', p: 1, width: '2em', height: '2em', borderRadius: '50%', color: 'white' }} />
                        <Typography component="h1" variant="h5">
                            Sign up
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                        <Form onSubmit={handleSubmit}>
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
                                className='mb-4'
                                label='Password'
                                type='password'
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                validate={validateRequiredFields}
                                required
                                autoComplete="current-password"
                                fullWidth
                            />
                            <Link to="/auth/login">Log in account</Link>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 4 }}
                            >
                                Sign up
                            </Button>
                        </Form>
                    </Box>
                </Paper>
            </Box>
        </Container>
    )
}

export default signup
