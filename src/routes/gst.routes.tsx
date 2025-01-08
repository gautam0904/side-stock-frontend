import React from 'react';
import { Route } from 'react-router-dom';

const CustomerGST = React.lazy(() => import('../pages/customerGST/customerGST.page'));

const gstRoutes = [
  <Route 
    key="customerGST"
    path="/customerGST" 
    element={<CustomerGST />}
  />
];

export default gstRoutes;
