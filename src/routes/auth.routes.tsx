import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const Login = React.lazy(() => import('../pages/auth/login/login.page.tsx'));
// const ForgotPassword = React.lazy(() => import('../pages/auth/forgot-password/forgotPassword.tsx'));
const Signup = React.lazy(() => import('../pages/auth/signup/signup.page.tsx'));

const authRoutes = [
  <Route key="auth-redirect" path="/auth" element={<Navigate to="/auth/login" />} />,
  <Route key="auth-login" path="/auth/login" element={<Login />} />,
  <Route key="auth-signup" path="/auth/signup" element={<Signup />} />,
  // <Route key="auth-forgot" path="/auth/forgotpassword" element={<ForgotPassword />} />
];

export default authRoutes;
