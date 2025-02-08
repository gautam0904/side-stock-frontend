import Dashboard from '../pages/dashboard/dashboard.page';
import React from 'react';
import { Route } from 'react-router-dom';

// common Pages
const Products = React.lazy(() => import('../pages/product/product.page'));
// const StocksGST = React.lazy(() => import('../pages/stocks/stocks.page'));

const commonRoutes = [
  <Route
    key="product"
    path='/products'
    element={<Products />}
  />,
  <Route
    key="dashboard"
    path="/dashboard"
    element={<Dashboard />}
  />,
  // <Route 
  //   key="stocks"
  //   path="/stocks" 
  //   element={<StocksGST />}
  // />,
  // <Route 
  //   key="sales-new"
  //   path="/sales/new" 
  //   element={<SalesGST />}
  // />,
  // <Route 
  //   key="customers-new"
  //   path="/customers/new" 
  //   element={<CustomersGST />}
  // />
];

export default commonRoutes;
