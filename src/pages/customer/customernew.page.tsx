// import { useState, useEffect, useCallback, useRef } from 'react';
// import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tabs, Tab, Modal, Typography, Paper } from '@mui/material';
// import { CustomerForm } from './addCustomerForm';
// import { CustomerList } from './CustomerList';
// import { customerService } from '../../api/customer.service';
// import { productService } from '../../api/product.service';
// import { toast } from 'react-hot-toast';
// import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
// import AddBusinessIcon from '@mui/icons-material/AddBusiness';
// import CategoryIcon from '@mui/icons-material/Category';
// import { CustomerFormData } from '../../validation/customer.types';
// import { SiteManagement } from './SitesFieldArray';
// import { useCustomerColumns } from './hooks/useCustomerColumns';
// import { useCustomerExport } from './hooks/useCustomerExport';
// import { DetailPanelDialog } from './hooks/detailsDialog';

// const initialFormData = {
//   customerName: '',
//   mobileNumber: '',
//   partnerName: '',
//   partnerMobileNumber: '',
//   reference: '',
//   referenceMobileNumber: '',
//   residentAddress: '',
//   aadharNo: '',
//   pancardNo: '',
//   GSTnumber: '',
//   aadharPhoto: null,
//   panCardPhoto: null,
//   customerPhoto: null,
//   sites: [{
//       prizefix: [{
//           size: '',
//           productName: '',
//           rate: 0,
//       }],
//       siteName: '',
//       siteAddress: '',
//       challanNumber: 'S1C0',
//   }],
// };
// const Customer = () => {
//   const [activeTab, setActiveTab] = useState(0);
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [customers, setCustomers] = useState<any[]>([]);
//   const [products, setProducts] = useState<Array<{ name: string; sizes: string[] }>>([]);
//   const [loading, setLoading] = useState(false);
//   const [productPopupOpen, setProductPopupOpen] = useState(false);
//   const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
//   const fetchInProgress = useRef(false);
//   const [isEditMode, setIsEditMode] = useState(false);
// const [formData, setFormData] = useState<any>(initialFormData);

//   // Get columns configuration
//   const columns = useCustomerColumns({
//     onEdit: handleEdit,
//     onDelete: (id) => {
//       setSelectedItem(customers.find(c => c._id === id));
//       setIsDeleteDialogOpen(true);
//     },
//     openModal: (open: boolean) => { setProductPopupOpen(open) },
//     onExpand: (id: string) => { setSelectedProductIndex(Number(id)) }
//   });

//   // Get export functionality
//   const { handleExport } = useCustomerExport(customers, columns);

//   // Existing fetch functions
//   const fetchCustomers = useCallback(async () => {
//     if (fetchInProgress.current || loading) return;
//     try {
//       fetchInProgress.current = true;
//       setLoading(true);
//       const response = await customerService.getAllCustomers({
//         sortBy: 'createdAt',
//         sortOrder: 'desc'
//       });
//       const customersWithNumbers = response.data?.items.map((customer: any, index: number) => ({
//         ...customer,
//         id: customer._id,
//         no: index + 1
//       })) || [];
//       setCustomers(customersWithNumbers);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to fetch customers');
//     } finally {
//       setLoading(false);
//       fetchInProgress.current = false;
//     }
//   }, [loading]);

//   useEffect(() => {
//     fetchCustomers();
//     const fetchProducts = async () => {
//       try {
//         const response = await productService.getAllProducts();
//         const groupedProducts = response.data.products.reduce((acc: any[], product: any) => {
//           const existing = acc.find(p => p.name === product.productName);
//           if (existing) {
//             if (!existing.sizes.includes(product.size)) {
//               existing.sizes.push(product.size);
//             }
//           } else {
//             acc.push({ name: product.productName, sizes: [product.size] });
//           }
//           return acc;
//         }, []);
//         setProducts(groupedProducts);
//       } catch (error) {
//         toast.error('Failed to fetch products');
//       }
//     };
//     fetchProducts();
//   }, [fetchCustomers]);

//   // Existing handlers
//   function handleEdit(item: any) {
//     setSelectedItem(item);
//     setIsFormOpen(true);
//   }

//   const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
//     setActiveTab(newValue);
//   };

//   const getAddButtonConfig = () => {
//     switch (activeTab) {
//       case 0: return { icon: <PersonAddAltIcon />, text: 'Add New Customer' };
//       case 1: return { icon: <AddBusinessIcon />, text: 'Add New Site' };
//       case 2: return { icon: <CategoryIcon />, text: 'Add New Product' };
//       default: return { icon: <PersonAddAltIcon />, text: 'Add New' };
//     }
//   };

//   const handleSubmit = async (data: CustomerFormData) => {
//     try {
//       const formData = new FormData();

//       // Handle form data
//       Object.entries(data).forEach(([key, value]) => {
//         if (key !== 'sites' && key !== 'aadharPhoto' && key !== 'panCardPhoto' && key !== 'customerPhoto') {
//           formData.append(key, value as string);
//         }
//       });

//       // Handle file uploads
//       if (data.aadharPhoto instanceof File) formData.append('aadharPhoto', data.aadharPhoto);
//       if (data.panCardPhoto instanceof File) formData.append('panCardPhoto', data.panCardPhoto);
//       if (data.customerPhoto instanceof File) formData.append('customerPhoto', data.customerPhoto);

//       // Handle sites data
//       formData.append('sites', JSON.stringify(data.sites));

//       if (selectedItem?._id) {
//         await customerService.updateCustomer(selectedItem._id, formData);
//         toast.success('Customer updated successfully');
//       } else {
//         await customerService.addCustomer(formData);
//         toast.success('Customer added successfully');
//       }

//       setIsFormOpen(false);
//       setSelectedItem(null);
//       fetchCustomers();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to save customer');
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedItem?._id) return;
//     try {
//       await customerService.deleteCustomer(selectedItem._id);
//       toast.success('Customer deleted successfully');
//       fetchCustomers();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to delete customer');
//     } finally {
//       setIsDeleteDialogOpen(false);
//       setSelectedItem(null);
//     }
//   };

//   // --------------------
//   const handleClose = () => {
//     setOpen(false);
//     setIsEditMode(false);
//     setFormData(initialFormData);
//   };

//   const modalStyle = {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     width: '100%',
//     bgcolor: 'background.paper',
//     boxShadow: 24,
//     p: 4,
//     borderRadius: 2,
//     maxHeight: '95vh',
//     overflowY: 'auto'
//   } as const;

//   return (
//     <Box sx={{ p: 2 }}>
//       <Button
//         fullWidth
//         variant="contained"
//         sx={{
//           bgcolor: 'var(--primary-color)', color: 'white', mb: 2, '&:hover': {
//             bgcolor: 'var(--primary-light)'
//           }
//         }}
//         onClick={() => setIsFormOpen(true)}
//         startIcon={getAddButtonConfig().icon}
//         autoFocus
//       >
//         <PersonAddAltIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
//         {getAddButtonConfig().text}
//       </Button>

//       <Modal
//         open={open}
//         onClose={handleClose}
//         aria-labelledby="modal-title"
//       >
//         <Box sx={modalStyle}>
//           <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
//             {isEditMode ? 'Edit Customer' : 'Add New Customer'}
//           </Typography>

//           <CustomerForm
//             initialData={selectedItem || {}}
//             onSubmit={handleSubmit}
//             onClose={() => {
//               setIsFormOpen(false);
//               setSelectedItem(null);
//             }}
//             products={products}
//           />
//         </Box>
//       </Modal>

//       {/* Delete Confirmation Dialog */}
//       <Dialog
//         open={isDeleteDialogOpen}
//         onClose={() => setIsDeleteDialogOpen(false)}
//         PaperProps={{
//           sx: {
//             bgcolor: 'var(--surface-light)',
//             borderRadius: '8px',
//             p: 1
//           }
//         }}
//       >
//         <DialogTitle sx={{ color: 'var(--error-color)', fontWeight: 600 }}>
//           Confirm Delete
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText sx={{ color: 'var(--text-dark)' }}>
//             Are you sure you want to delete this customer? This action cannot be undone.
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ p: 2 }}>
//           <Button
//             onClick={() => setIsDeleteDialogOpen(false)}
//             variant="outlined"
//             sx={{
//               color: 'var(--text-dark)',
//               borderColor: 'var(--border-color)',
//               '&:hover': {
//                 borderColor: 'var(--primary-color)',
//                 bgcolor: 'transparent'
//               }
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleDelete}
//             variant="contained"
//             sx={{
//               bgcolor: 'var(--error-color)',
//               color: 'var(--text-light)',
//               '&:hover': {
//                 bgcolor: 'var(--error-light)',
//               }
//             }}
//             autoFocus
//           >
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Paper sx={{ height: 600, width: '100%' }}>
//           {/* Render the DetailPanelDialog */}
//         <DetailPanelDialog
//         productPopupOpen={productPopupOpen}
//         setProductPopupOpen={setProductPopupOpen}
//         selectedProductIndex={selectedProductIndex}
//         customers={customers}
//       />
//       </Paper>
//     </Box>

//     // <Box sx={{ p: 3, backgroundColor: 'var(--background-light)', minHeight: '100vh' }}>
//     //   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//     //     <Tabs 
//     //       value={activeTab} 
//     //       onChange={handleTabChange}
//     //       sx={{
//     //         '& .MuiTab-root': {
//     //           color: 'var(--text-dark)',
//     //           '&.Mui-selected': {
//     //             color: 'var(--primary-color)',
//     //           },
//     //         },
//     //         '& .MuiTabs-indicator': {
//     //           backgroundColor: 'var(--primary-color)',
//     //         },
//     //       }}
//     //     >
//     //       <Tab label="Customers" />
//     //       <Tab label="Sites" />
//     //       <Tab label="Products" />
//     //     </Tabs>

//     //     <Box sx={{ display: 'flex', gap: 2 }}>
//     //       {activeTab === 0 && (
//     //         <Button
//     //           onClick={handleExport}
//     //           variant="outlined"
//     //           sx={{
//     //             color: 'var(--primary-color)',
//     //             borderColor: 'var(--primary-color)',
//     //             '&:hover': {
//     //               bgcolor: 'var(--primary-bg-light)',
//     //             }
//     //           }}
//     //         >
//     //           Export
//     //         </Button>
//     //       )}
//     //       <Button
//     //         variant="contained"
//     //         onClick={() => setIsFormOpen(true)}
//     //         startIcon={getAddButtonConfig().icon}
//     //         sx={{
//     //           bgcolor: 'var(--primary-color)',
//     //           color: 'var(--text-light)',
//     //           '&:hover': {
//     //             bgcolor: 'var(--primary-light)',
//     //           }
//     //         }}
//     //       >
//     //         {getAddButtonConfig().text}
//     //       </Button>
//     //     </Box>
//     //   </Box>

//     //   {activeTab === 0 && (
//     //     <CustomerList
//     //       customers={customers}
//     //       loading={loading}
//     //       onEdit={handleEdit}
//     //       onDelete={(id) => {
//     //         setSelectedItem(customers.find(c => c._id === id));
//     //         setIsDeleteDialogOpen(true);
//     //       }}
//     //     />
//     //   )}

//     //   {activeTab === 1 && (
//     //     <SiteManagement 
//     //       products={products}
//     //       formContext={false}
//     //     />
//     //   )}

//     //   {/* Customer Form Dialog */}
//     //   <Dialog
//     //     open={isFormOpen}
//     //     fullWidth
//     //     maxWidth="md"
//     //     PaperProps={{
//     //       sx: {
//     //         bgcolor: 'var(--surface-light)',
//     //         borderRadius: '12px',
//     //         boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
//     //       }
//     //     }}
//     //   >
//     //     <CustomerForm
//     //       initialData={selectedItem || {}}
//     //       onSubmit={handleSubmit}
//     //       onClose={() => {
//     //         setIsFormOpen(false);
//     //         setSelectedItem(null);
//     //       }}
//     //       products={products}
//     //     />
//     //   </Dialog>

//     //      {/* Render the DetailPanelDialog */}
//     //      <DetailPanelDialog
//     //     productPopupOpen={productPopupOpen}
//     //     setProductPopupOpen={setProductPopupOpen}
//     //     selectedProductIndex={selectedProductIndex}
//     //     customers={customers}
//     //   />

//     //   {/* Delete Confirmation Dialog */}
//     //   <Dialog
//     //     open={isDeleteDialogOpen}
//     //     onClose={() => setIsDeleteDialogOpen(false)}
//     //     PaperProps={{
//     //       sx: {
//     //         bgcolor: 'var(--surface-light)',
//     //         borderRadius: '8px',
//     //         p: 1
//     //       }
//     //     }}
//     //   >
//     //     <DialogTitle sx={{ color: 'var(--error-color)', fontWeight: 600 }}>
//     //       Confirm Delete
//     //     </DialogTitle>
//     //     <DialogContent>
//     //       <DialogContentText sx={{ color: 'var(--text-dark)' }}>
//     //         Are you sure you want to delete this customer? This action cannot be undone.
//     //       </DialogContentText>
//     //     </DialogContent>
//     //     <DialogActions sx={{ p: 2 }}>
//     //       <Button
//     //         onClick={() => setIsDeleteDialogOpen(false)}
//     //         variant="outlined"
//     //         sx={{
//     //           color: 'var(--text-dark)',
//     //           borderColor: 'var(--border-color)',
//     //           '&:hover': {
//     //             borderColor: 'var(--primary-color)',
//     //             bgcolor: 'transparent'
//     //           }
//     //         }}
//     //       >
//     //         Cancel
//     //       </Button>
//     //       <Button
//     //         onClick={handleDelete}
//     //         variant="contained"
//     //         sx={{
//     //           bgcolor: 'var(--error-color)',
//     //           color: 'var(--text-light)',
//     //           '&:hover': {
//     //             bgcolor: 'var(--error-light)',
//     //           }
//     //         }}
//     //         autoFocus
//     //       >
//     //         Delete
//     //       </Button>
//     //     </DialogActions>
//     //   </Dialog>
//     // </Box>
//   );
// };

// export default Customer;
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Button, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle, Modal, Typography, Paper 
} from '@mui/material';
import { CustomerForm } from './addCustomerForm';
import { CustomerList } from './CustomerList';
import { customerService } from '../../api/customer.service';
import { productService } from '../../api/product.service';
import { toast } from 'react-hot-toast';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { CustomerFormData } from '../../validation/customer.types';
import { useCustomerColumns } from './hooks/useCustomerColumns';
import { useCustomerExport } from './hooks/useCustomerExport';
import { DetailPanelDialog } from './hooks/detailsDialog';
import { ICustomer } from 'src/DTO/customer.dto';

// Type definitions
interface Product {
  name: string;
  sizes: string[];
}

interface Customer {
  _id: string;
  [key: string]: any;
}

// Constants
const initialFormData: CustomerFormData = {
  customerName: '',
  mobileNumber: '',
  partnerName: '',
  partnerMobileNumber: '',
  reference: '',
  referenceMobileNumber: '',
  residentAddress: '',
  aadharNo: '',
  pancardNo: '',
  GSTnumber: '',
  aadharPhoto: null,
  panCardPhoto: null,
  customerPhoto: null,
  sites: [{
    prizefix: [{
      size: '',
      productName: '',
      rate: 0,
    }],
    siteName: '',
    siteAddress: '',
    challanNumber: 'S1C0',
  }],
};

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
  overflowY: 'auto' as const
};

const Customer = () => {
  // State management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productPopupOpen, setProductPopupOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const fetchInProgress = useRef(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Data fetching
  const fetchCustomers = useCallback(async () => {
    if (fetchInProgress.current || loading) return;
    
    try {
      fetchInProgress.current = true;
      setLoading(true);
      
      const response = await customerService.getAllCustomers({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const customersWithNumbers = response.data?.items.map((customer: Customer, index: number) => ({
        ...customer,
        id: customer._id,
        no: index + 1
      })) || [];

      setCustomers(customersWithNumbers);
    } catch (error: any) {
      handleFetchError(error, 'customers');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [loading]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productService.getAllProducts();
      const groupedProducts = response.data.products.reduce((acc: Product[], product: any) => {
        const existing = acc.find(p => p.name === product.productName);
        existing ? existing.sizes.push(product.size) : acc.push({ 
          name: product.productName, 
          sizes: [product.size] 
        });
        return acc;
      }, []);
      setProducts(groupedProducts);
    } catch (error) {
      handleFetchError(error, 'products');
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [fetchCustomers, fetchProducts]);

  // Handlers
  const handleEdit = useCallback((item: Customer) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    const customer = customers.find(c => c._id === id);
    if (customer) {
      setSelectedItem(customer);
      setIsDeleteDialogOpen(true);
    }
  }, [customers]);

  const handleExpand = useCallback((id: string) => {
    setSelectedProductIndex(Number(id));
  }, []);

  // Custom hooks
  const columns = useCustomerColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    openModal: setProductPopupOpen,
    onExpand: handleExpand
  });

  const { handleExport } = useCustomerExport(customers, columns);
  const handleSubmit = useCallback(async (data: CustomerFormData) => {
    try {
      const formData = createFormData(data);

      if (selectedItem?._id) {
        await customerService.updateCustomer(selectedItem._id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerService.addCustomer(formData);
        toast.success('Customer added successfully');
      }

      resetFormState();
      fetchCustomers();
    } catch (error: any) {
      handleSubmissionError(error);
    }
  }, [selectedItem, fetchCustomers]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem?._id) return;
    
    try {
      await customerService.deleteCustomer(selectedItem._id);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error: any) {
      handleSubmissionError(error);
    } finally {
      resetDialogState();
    }
  }, [selectedItem, fetchCustomers]);

  // Helper functions
  const createFormData = (data: CustomerFormData) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (!['sites', 'aadharPhoto', 'panCardPhoto', 'customerPhoto'].includes(key)) {
        formData.append(key, value as string);
      }
    });
  
    (['aadharPhoto', 'panCardPhoto', 'customerPhoto'] as (keyof CustomerFormData)[]).forEach((field) => {
      if (data[field] instanceof File) {
        formData.append(field, data[field] as File);
      }
    });

    formData.append('sites', JSON.stringify(data.sites));
    return formData;
  };

  const resetFormState = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
    setIsEditMode(false);
  };

  const resetDialogState = () => {
    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleFetchError = (error: any, resource: string) => {
    toast.error(error.response?.data?.message || `Failed to fetch ${resource}`);
  };

  const handleSubmissionError = (error: any) => {
    toast.error(error.response?.data?.message || 'Operation failed');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button
        fullWidth
        variant="contained"
        sx={{
          bgcolor: 'var(--primary-color)', 
          color: 'white', 
          mb: 2, 
          '&:hover': { bgcolor: 'var(--primary-light)' }
        }}
        onClick={() => setIsFormOpen(true)}
        startIcon={<PersonAddAltIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />}
        autoFocus
      >
        Add New Customer
      </Button>

      <Modal open={isFormOpen} onClose={resetFormState}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
          <CustomerForm
            initialData={selectedItem || initialFormData}
            onSubmit={handleSubmit}
            onClose={resetFormState}
            products={products}
          />
        </Box>
      </Modal>

      <ConfirmationDialog 
        open={isDeleteDialogOpen}
        onClose={resetDialogState}
        onConfirm={handleDelete}
      />

      <Paper sx={{ height: 600, width: '100%' }}>
        <DetailPanelDialog
          productPopupOpen={productPopupOpen}
          setProductPopupOpen={setProductPopupOpen}
          selectedProductIndex={selectedProductIndex}
          customers={customers}
        />
        <CustomerList
          customers={customers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </Paper>
    </Box>
  );
};

// Extracted Dialog component
const ConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm 
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        sx: {
          bgcolor: 'var(--surface-light)',
          borderRadius: '8px',
          p: 1,
        },
      },
    }}
  >
    <DialogTitle sx={{ color: 'var(--error-color)', fontWeight: 600 }}>
      Confirm Delete
    </DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ color: 'var(--text-dark)' }}>
        Are you sure you want to delete this customer? This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          color: 'var(--text-dark)',
          borderColor: 'var(--border-color)',
          '&:hover': { borderColor: 'var(--primary-color)', bgcolor: 'transparent' }
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        sx={{
          bgcolor: 'var(--error-color)',
          color: 'var(--text-light)',
          '&:hover': { bgcolor: 'var(--error-light)' }
        }}
        autoFocus
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default Customer;