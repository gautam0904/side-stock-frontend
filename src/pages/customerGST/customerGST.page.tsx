import React, { useState, useEffect, useCallback } from 'react';
import { customerService } from '../../api/customer.service';
import { toast } from 'react-hot-toast';

import { DataGrid, GridColDef,  } from '@mui/x-data-grid';
import { 
  Paper, 
  Button, 
  Box, 
  Modal, 
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress
} from '@mui/material';
import Form from '../../components/form/form.component';
import { FormInput } from '../../components/formInput/formInput.component';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Customer {
  _id: string;
  GSTnumber: string;
  panCardNumber: string;
  billTo: string;
  customerName: string;
  mobileNumber: string;
  siteName: string;
  siteAddress: string;
  billingAddress: string;
  date: string;
}

const isScrollNearBottom = (element: HTMLElement, threshold: number = 0.8): boolean => {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const scrolledDistance = scrollTop + clientHeight;
  const totalScrollableDistance = scrollHeight;
  const scrollPercentage = scrolledDistance / totalScrollableDistance;
  return scrollPercentage >= threshold;
};

const Dashboard = () => {
  const [open, setOpen] = useState(false);;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<Customer>({
    _id:'',
    GSTnumber: '',
    panCardNumber: '',
    billTo: '',
    customerName: '',
    mobileNumber: '',
    siteName: '',
    siteAddress: '',
    billingAddress: '',
    date: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const SCROLL_THRESHOLD = 0.8;

  const columns: GridColDef[] = [
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'GSTnumber', headerName: 'GST number' },
    { field: 'panCardNumber', headerName: 'PAN Card number', width: 130 },
    { field: 'billTo', headerName: 'Bill To', width: 130 },
    { field: 'customerName', headerName: 'Customer Name', width: 130 },
    { field: 'mobileNumber', headerName: 'Mobile Number', width: 130 },
    { field: 'siteName', headerName: 'Site Name', width: 130 },
    { field: 'siteAddress', headerName: 'Site Address', width: 130 },
    { field: 'billingAddress', headerName: 'Billing Address', width: 130 },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 130,
      valueFormatter: (params: any) => {
        try {
          if (!params?.value) return '';
          const date = new Date(params.value);
          return date.toLocaleDateString('en-GB');
        } catch (error) {
          console.error('Date parsing error:', error);
          return params?.value || '';
        }
      }
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(params.row);
              }}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(params.row._id);
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const paginationModel = { page: 0, pageSize: 5 };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '95vh',
    overflowY: 'auto'
  };

  const fetchCustomers = useCallback(async (pageNum: number) => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const response = await customerService.getAllCustomers({
        page: pageNum,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newCustomers = response.data?.customers || [];
      
      const customersWithNumbers = newCustomers.map((customer: any, index: number) => ({
        ...customer,
        id: customer._id,
        no: ((pageNum - 1) * ITEMS_PER_PAGE) + index + 1
      }));

      setCustomers(prev => {
        const updatedList = [...prev, ...customersWithNumbers];
      
        const uniqueCustomers = updatedList.filter((value, index, self) => 
          index === self.findIndex((t) => t._id === value._id)
        );
      
        if (uniqueCustomers.length > ITEMS_PER_PAGE * 2) {
          return uniqueCustomers.slice(-ITEMS_PER_PAGE * 2);  // keep only the latest data
        }
      
        return uniqueCustomers;
      });
      

      setHasMore(newCustomers.length === ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading]);

  // Initial load
  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData({
      _id: '',
      GSTnumber: '',
      panCardNumber: '',
      billTo: '',
      customerName: '',
      mobileNumber: '',
      siteName: '',
      siteAddress: '',
      billingAddress: '',
      date: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateGST = (field: string, value: string) => {
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!value) return `${field} is required`;
    if (!gstPattern.test(value)) return 'Invalid GST Number format';
    return undefined;
  };

  const validatePAN = (field: string, value: string) => {
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!value) return `${field} is required`;
    if (!panPattern.test(value)) return 'Invalid PAN Number format';
    return undefined;
  };

  const validateMobile = (field: string, value: string) => {
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!value) return `${field} is required`;
    if (!mobilePattern.test(value)) return 'Invalid Mobile Number';
    return undefined;
  };

  const validateRequired = (field: string, value: string) => {
    if (!value) return `${field} is required`;
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const response = await customerService.updateCustomer(formData._id, formData);
        setCustomers(prevData =>
          prevData.map((item: Customer) => (item._id === formData._id ? response.data : item))
        );
        toast.success('Customer updated successfully');
      } else {
        const response = await customerService.addCustomer(formData);
        setCustomers(prevData => [...prevData, response.data]);
        toast.success('Customer added successfully');
      }
      handleClose();
      fetchCustomers(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} customer`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      await customerService.deleteCustomer(customerToDelete);
      toast.success('Customer deleted successfully');
      setCustomers(prevData => prevData.filter((item: Customer) => item._id !== customerToDelete));
      fetchCustomers(1); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleEditClick = (customer: any) => {
    setFormData({
      ...customer,
      date: customer.date ? new Date(customer.date).toISOString().split('T')[0] : ''
    });
    setIsEditMode(true);
    setOpen(true);
  };

  // Helper function to check scroll position
  const isNearBottom = (element: HTMLElement): boolean => {
    const visibleRows = element.querySelectorAll('.MuiDataGrid-row');
    if (visibleRows.length === 0) return false;

    const lastVisibleRowIndex = visibleRows.length - 2; // Second to last row
    if (lastVisibleRowIndex < 0) return false;

    const lastVisibleRow = visibleRows[lastVisibleRowIndex] as HTMLElement;
    const rect = lastVisibleRow.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    return rect.bottom <= elementRect.bottom;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button
        fullWidth
        variant="contained"
        sx={{ bgcolor: '#7b4eff', color: 'white', mt: 3, mb: 2 }}
        onClick={handleOpen}
      >
        <PersonAddAltIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        Add new Customer
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
          
          <Form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <FormInput
                name="panCardNumber"
                label="Pan Card No"
                value={formData.panCardNumber}
                onChange={handleChange}
                validate={validatePAN}
                required
                placeholder='AFZPK7190K'
                autoComplete="off"
                sx={{
                  '& input': { textTransform: 'uppercase' }
                }}
              />
              <FormInput
                name="GSTnumber"
                label="GST No"
                value={formData.GSTnumber}
                onChange={handleChange}
                validate={validateGST}
                required
                placeholder='29AFZPK7190K'
                autoComplete="off"
                sx={{
                  '& input': { textTransform: 'uppercase' }
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1.5fr', gap: 2, mb: 2 }}>
              <FormInput
                name="date"
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                validate={validateRequired}
                required
                sx={{
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    cursor: 'pointer',
                    padding: '8px',
                    filter: 'invert(0.5)',
                    '&:hover': {
                      opacity: 0.7
                    }
                  },
                  '& input[type="date"]': {
                    colorScheme: 'light'
                  }
                }}
              />
              <FormInput
                name="billTo"
                label="Bill To"
                value={formData.billTo}
                onChange={handleChange}
                validate={validateRequired}
                required
              />
              <FormInput
                name="customerName"
                label="Customer Name"
                value={formData.customerName}
                onChange={handleChange}
                validate={validateRequired}
                required
              />
              <FormInput
                name="mobileNumber"
                label="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleChange}
                validate={validateMobile}
                required
                type="tel"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
              <FormInput
                name="siteName"
                label="Site Name"
                value={formData.siteName}
                onChange={handleChange}
                validate={validateRequired}
                required
              />
              <FormInput
                name="siteAddress"
                label="Site Address"
                value={formData.siteAddress}
                onChange={handleChange}
                validate={validateRequired}
                required
              />
              <FormInput
                name="billingAddress"
                label="Billing Address"
                value={formData.billingAddress}
                onChange={handleChange}
                validate={validateRequired}
                required
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleClose} 
                variant="contained"
                sx={{ 
                  bgcolor: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  },
                  color: 'white'
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                {isEditMode ? 'Update Customer' : 'Save Customer'}
              </Button>
            </Box>
          </Form>
        </Box>
      </Modal>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this customer? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Paper 
        sx={{ height: 400, width: '100%', overflow: 'auto' }} 
        onScroll={(e) => {
          const target = e.currentTarget;
          
          if (isNearBottom(target)) {
            if (!hasMore && !loading) {
              toast.error('No more customers to load', {
                position: 'bottom-center',
              });
              return;
            }
            
            if (!loading) {
              fetchCustomers(page + 1);
            }
          }
        }}
      >
        <DataGrid
          rows={customers}
          columns={columns}
          hideFooterPagination
          hideFooter
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row._id }
          sx={{ 
            border: 0,
            '& .MuiDataGrid-virtualScroller': {
              role: 'region',
              ariaLabel: 'Customer data grid scrollable area'
            }
          }}
          slots={{
            loadingOverlay: () => (
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', p: 1 }}>
                {loading && <CircularProgress size={24} />}
              </Box>
            ),
          }}
          aria-label="Customer data grid"
        />
      </Paper>
    </Box>
  );
};

export default Dashboard;