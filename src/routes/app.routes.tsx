import React from 'react';
import authRoutes from './auth.routes';
import gstRoutes from './gst.routes';
import commonRoutes from './common.routes'
import nonGstRoutes from './non-gst.routes'
import Dashboard from '../pages/dashboard/dashboard.page.tsx';
import { Route } from 'react-router-dom';

const AppRoutes = [
  <Route key="dashboard" path="/dashboard" element={<Dashboard />} />,
  ...authRoutes,
  ...gstRoutes,
  ...commonRoutes,
  ...nonGstRoutes
];

export default AppRoutes;
