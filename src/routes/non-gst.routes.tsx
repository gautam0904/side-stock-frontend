import CommonDataTable from '../components/dataTable/dataTable.component';
import React from 'react';
import { Route } from 'react-router-dom';

// Non-GST Pages
const Challan = React.lazy(() => import('../pages/challan/challan.page'));
// const Payment = React.lazy(() => import('../pages/payment/payment.page'));
const DirectBill = React.lazy(() => import('../pages/bill/bill.page'));
const Customer = React.lazy(() => import('../pages/customer/customer.page'));

const nonGstRoutes = [

  <Route 
    key="challan"
    path="/challan" 
    element={<Challan />}
  />,
  <Route 
    key="payment"
    path="/payment" 
    element={<CommonDataTable
      rows={ [
            {
                "id":"uuid-1",
                "productName": "Product A",
                "quantity": 5,
                "rate": 100,
                "amount": 15999.999994212963,
                "month": 1,
                "year": 2024,
                "previousRestBill": 15999.999994212963,
                "startingDate": "2024-01-01T00:00:00.000Z",
                "endingDate": "2024-01-30T18:30:00.000Z",
                "dayCount": '5'
            }
        ]
    }
loading={false}
      />}
  />,
  <Route 
    key="bill-new"
    path="/bill/new" 
    element={<DirectBill />}
  />,
  <Route 
    key="customer-new"
    path="/customerNonGST/new" 
    element={<Customer />}
  />
];

export default nonGstRoutes; 