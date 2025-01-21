import React from 'react';
import { Route } from 'react-router-dom';

// Non-GST Pages
const Challan = React.lazy(() => import('../pages/challan/challan.page'));
// const Payment = React.lazy(() => import('../pages/payment/payment.page'));
// const DirectBill = React.lazy(() => import('../pages/bill/bill.page'));
const Customer = React.lazy(() => import('../pages/customer/customer.page'));

const nonGstRoutes = [

  <Route 
    key="challan"
    path="/challan" 
    element={<Challan />}
  />,
//   <Route 
//     key="payment"
//     path="/payment" 
//     element={<Payment />}
//   />,
//   <Route 
//     key="bill-new"
//     path="/bill/new" 
//     element={<DirectBill />}
//   />
  <Route 
    key="customer-new"
    path="/customerNonGST/new" 
    element={<Customer />}
  />
];

export default nonGstRoutes; 