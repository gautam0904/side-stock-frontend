import React from 'react';
import { Route } from 'react-router-dom';

// GST Pages
const CustomerGST = React.lazy(() => import('../pages/customerGST/customerGST.page'));
const Stocks = React.lazy(() => import('../pages/stocks/stocks.page'));
// const SalesGST = React.lazy(() => import('../pages/sales/sales.page'));
const PurchasesGST = React.lazy(() => import('../pages/purchaseGST/purchaseGST.page'));
// const CustomersGST = React.lazy(() => import('../pages/customers/customers.page'));
const Reports = React.lazy(() => import('../pages/reports/report'));

const gstRoutes = [
  <Route 
    key="customerGST"
    path="/customersGST/new" 
    element={<CustomerGST />}
  />,
  <Route 
    key="stocks"
    path="/stocks" 
    element={<Stocks />}
  />,
  // <Route 
  //   key="sales-new"
  //   path="/sales/new" 
  //   element={<SalesGST />}
  // />,
  <Route 
    key="purchases-new"
    path="/purchasesGST/new" 
    element={<PurchasesGST />}
  />,
  <Route 
    key="reports"
    path="/reports" 
    element={<Reports />}
  />,
  // <Route 
  //   key="customers-new"
  //   path="/customers/new" 
  //   element={<CustomersGST />}
  // />
];

export default gstRoutes;
