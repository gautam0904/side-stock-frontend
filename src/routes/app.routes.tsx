import React from 'react';
import authRoutes from './auth.routes';
import gstRoutes from './gst.routes';

const AppRoutes = [
  ...authRoutes,
  ...gstRoutes
];

export default AppRoutes;
