import React, { useState, useEffect, useCallback, useRef } from 'react';
import { customerService } from '../../api/customer.service';
import { productService } from '../../api/product.service';
import { toast } from 'react-hot-toast';
import {
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Grid,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridFilterModel,
  GridLogicOperator,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarColumnsButton
} from '@mui/x-data-grid';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import Form from '../../components/form/form.component';
import { FormInput } from '../../components/formInput/formInput.component';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { IProducts } from 'src/interfaces/common.interface';
import { useLocation } from 'react-router-dom';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { debounce } from 'lodash';
import { userPreferencesService } from '../../api/userPreferences.service';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// ------------------- Interfaces -------------------
interface Iprizefix {
  _id?: string;
  productName?: string;
  size?: string;
  rate?: number;
}

interface ISite {
  siteName: string;
  siteAddress: string;
  supervisorNumber: string;
  supervisorName: string;
  challanNumber: string;
  prizefix: Iprizefix[];
}

interface ICutomer {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  partnerName?: string;
  partnerMobileNumber?: string;
  reference?: string;
  referenceMobileNumber?: string;
  residentAddress?: string;
  aadharNo?: string;
  pancardNo?: string;
  GSTnumber?: string;
  aadharPhoto?: File | string | null;
  panCardPhoto?: File | string | null;
  customerPhoto?: File | string | null;
  sites?: ISite[];
  [key: string]: any;
}

// ------------------- Initial Data -------------------
const initialSite: ISite = {
  siteName: '',
  siteAddress: '',
  challanNumber: 'S1C1',
  supervisorName: '',
  supervisorNumber: '',
  prizefix: [
    {
      size: '',
      productName: '',
      rate: 0
    }
  ]
};

const initialFormData: ICutomer = {
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
  sites: [
    {
      prizefix: [
        {
          size: '',
          productName: '',
          rate: 0
        }
      ],
      supervisorName: '',
      supervisorNumber: '',
      siteName: '',
      siteAddress: '',
      challanNumber: 'S1C0'
    }
  ]
};

// ------------------- Styles -------------------
const modalStyle = {
  position: 'absolute' as const,
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

const Customer = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [customer, setCustomer] = useState<ICutomer[]>([]);
  const [formData, setFormData] = useState<ICutomer>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const fetchInProgress = useRef(false);

  const [productPopupOpen, setProductPopupOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);

  const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: 'and' as GridLogicOperator
  });
  const gridRef = useRef<any>(null);
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Add this state for tracking selected option index
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(-1);

  // Add these states for product selection
  const [selectedProductOptionIndex, setSelectedProductOptionIndex] = useState<number>(-1);
  const [selectedSizeOptionIndex, setSelectedSizeOptionIndex] = useState<number>(-1);

  // Add a ref for the products container
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const [lastAddedProductIndex, setLastAddedProductIndex] = useState<number>(-1);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        setIsLoadingPreferences(true);
        const preferences = await userPreferencesService.getPreferenceByKey('customer');
        
        if (preferences?.data?.columnVisibility) {
          // If we have preferences from backend, use them
          setColumnVisibility(preferences.data.columnVisibility);
        } else {
          // Only set default values if no preferences exist
          const defaultVisibility = {
            GSTnumber: true,
            aadharNo: true,
            actions: true,
            customerName: true,
            expandButton: true,
            mobileNumber: true,
            no: true,
            pancardNo: true,
            partnerMobileNumber: true,
            partnerName: true,
            reference: true,
            referenceMobileNumber: true,
            residentAddress: true
          };
          
          // Save default preferences to backend
          await userPreferencesService.savePreferenceByKey('customer', defaultVisibility);
          setColumnVisibility(defaultVisibility);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Fallback to localStorage if backend fails
        try {
          const savedVisibility = localStorage.getItem('customerColumnVisibility');
          if (savedVisibility) {
            setColumnVisibility(JSON.parse(savedVisibility));
          } else {
            // Set default visibility if nothing in localStorage
            setColumnVisibility({
              GSTnumber: true,
              aadharNo: true,
              actions: true,
              customerName: true,
              expandButton: true,
              mobileNumber: true,
              no: true,
              pancardNo: true,
              partnerMobileNumber: true,
              partnerName: true,
              reference: true,
              referenceMobileNumber: true,
              residentAddress: true
            });
          }
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
        }
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadUserPreferences();
  }, []);

  const saveColumnVisibility = async (newVisibility: { [key: string]: boolean }) => {
    try {
      // Save to backend
      await userPreferencesService.savePreferenceByKey('customer', newVisibility);
      // Update local state
      setColumnVisibility(newVisibility);
      // Backup to localStorage
      localStorage.setItem('customerColumnVisibility', JSON.stringify(newVisibility));
    } catch (error) {
      console.error('Error saving user preferences:', error);
      toast.error('Failed to save to server, using localStorage instead');
      // Fallback to localStorage
      try {
        localStorage.setItem('customerColumnVisibility', JSON.stringify(newVisibility));
        setColumnVisibility(newVisibility);
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
        toast.error('Failed to save column preferences');
      }
    }
  };

  // ---------- For searching Customer Name (autocomplete) -----------
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<ICutomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICutomer | null>(null);

  // ---------- Product info -----------
  const [products, setProducts] = useState<IProducts[] | null>(null);

  // For site selection
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(0);

  // For adding new site in dialog or inline
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editingSiteIndex, setEditingSiteIndex] = useState<number | null>(null);
  const [tempSite, setTempSite] = useState<ISite>(initialSite);

  // ---------- "Open" states for custom dropdowns (productName, size) -----------
  // We'll track the open/close per site+product row
  const [openProductNameDropdown, setOpenProductNameDropdown] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [openSizeDropdown, setOpenSizeDropdown] = useState<{ [key: string]: boolean }>({});

  // --------------- Columns for DataGrid ---------------
  const columns: GridColDef[] = [
    {
      field: 'expandButton',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProductIndex(params.row._id);
            setProductPopupOpen(true);
          }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )
    },
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'customerName', headerName: 'Customer Name', width: 130 },
    { field: 'mobileNumber', headerName: 'Mobile Number', width: 130 },
    { field: 'partnerName', headerName: 'Partner Name', width: 130 },
    { field: 'partnerMobileNumber', headerName: 'Partner MobileNumber', width: 130 },
    { field: 'reference', headerName: 'Reference', width: 130 },
    { field: 'referenceMobileNumber', headerName: 'Reference MobileNumber', width: 130 },
    { field: 'residentAddress', headerName: 'Resident Address', width: 130 },
    { field: 'aadharNo', headerName: 'Aadhar No', width: 150 },
    { field: 'pancardNo', headerName: 'Pancard No', width: 150 },
    { field: 'GSTnumber', headerName: 'GST Number', width: 130 },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className={'action-div'} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, paddingRight: 1 }}>
          <EditIcon
            fontSize="small"
            sx={{ color: 'var(--primary-color)' }}
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(params.row);
            }}
          />
          <DeleteIcon
            fontSize="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row._id);
            }}
          />
        </Box>
      )
    }
  ];

  // --------------- Fetch customers ---------------
  const fetchCustomers = useCallback(async () => {
    if (fetchInProgress.current || loading) return;

    try {
      fetchInProgress.current = true;
      setLoading(true);

      const response = await customerService.getAllCustomers({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newCustomers = response.data?.items || [];
      const customersWithNumbers = newCustomers.map((purchase: any, index: number) => ({
        ...purchase,
        id: purchase._id,
        no: index + 1
      }));

      setCustomer(customersWithNumbers);
      setShouldFetch(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (shouldFetch) {
      fetchCustomers();
    }
  }, [shouldFetch, fetchCustomers]);

  // --------------- Open / Close Add/Edit Modal ---------------
  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  // --------------- Autocomplete for "Customer Name" ---------------
  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedOptionIndex(-1); // Reset selected index when search changes
    debounceFetchCustomers(query);
  };

  const debounceFetchCustomers = useRef(
    debounce(async (query: string) => {
      if (query) {
        try {
          const response = await customerService.getCustomerByName(query);
          const data = await response.data.customers;
          if (data.length === 0) {
            // If no matches in DB, fill form's name with typed text
            handleCustomerSelect({
              customerName: query.toString(),
              mobileNumber: ''
            } as ICutomer);
          }
          setCustomers(data);
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      } else {
        setCustomers([]);
      }
    }, 500)
  ).current;

  const handleCustomerSelect = (cust: Partial<ICutomer>) => {
    setSelectedCustomer(cust as ICutomer);
    setSearchQuery(cust.customerName || '');
    setCustomers([]);
    setSelectedOptionIndex(-1); // Reset selected index after selection

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        customerName: cust.customerName || '',
        customerId: cust._id || '',
        mobileNumber: cust.mobileNumber || ''
      };
      if (cust.sites?.length && updatedForm.sites) {
        updatedForm.sites[0].siteName = cust.sites[0].siteName || '';
        updatedForm.sites[0].siteAddress = cust.sites[0].siteAddress || '';
        updatedForm.sites[0].challanNumber = cust.sites[0].challanNumber || 'S0C1';
      }
      return updatedForm;
    });
  };

  // --------------- Fetch GST details ---------------
  // We'll parse out some mock fields from 'gstDetails' to fill name, address, pan if empty
  const fetchGSTDetails = async (gstNumber: string) => {
    try {
      const response = await fetch(`/api/gst-proxy?gstNumber=${gstNumber}`);
      const contentType = response.headers.get('Content-Type');
      if (!response.ok || (contentType && !contentType.includes('application/json'))) {
        throw new Error('Expected JSON response, but got something else');
      }
      const data = await response.json();

      if (data?.success) {
        return {
          legalName: data.data.lgnm || '',
          tradeName: data.data.tradeNam || '',
          status: data.data.sts || '',
          pan: data.data.pan || '', // Example field
          address: data.data.addr || '' // Example field
        };
      }
      throw new Error(data.message || 'Failed to fetch GST details');
    } catch (error) {
      console.error('Error fetching GST details:', error);
      return null;
    }
  };

  // --------------- Input handlers ---------------
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'GSTnumber' ? value.toUpperCase() : value;

    // If user typed a 15-char GST, let's validate & fetch details
    if (name === 'GSTnumber' && processedValue.length === 15) {
      try {
        setLoading(true);
        const gstDetails = await fetchGSTDetails(processedValue);

        if (gstDetails) {
          if (gstDetails.status.toLowerCase() !== 'active') {
            toast.error('GST number is not active');
          } else {
            toast.success('GST details fetched successfully');
          }

          // Now auto-populate the form if fields are empty
          setFormData((prev) => {
            const updated = { ...prev, [name]: processedValue };

            // If not entered yet, set the name from legalName/tradeName
            if (!updated.customerName) {
              updated.customerName = gstDetails.tradeName || gstDetails.legalName || '';
            }
            // If no pancardNo, let's put the pan from GST if it exists
            if (!updated.pancardNo && gstDetails.pan) {
              updated.pancardNo = gstDetails.pan;
            }
            // If no address, set from the GST address if it exists
            if (!updated.residentAddress && gstDetails.address) {
              updated.residentAddress = gstDetails.address;
            }

            return updated;
          });
        } else {
          toast.error('Could not fetch GST details');
          setFormData((prev) => ({ ...prev, [name]: processedValue }));
        }
      } catch (error: any) {
        toast.error(error.message || 'Error fetching GST details');
        console.error('GST fetch error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Normal text
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  // Basic validations
  const validateGST = (field: string, value: string) => {
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!value) return `${field} is required`;
    if (!gstPattern.test(value)) return 'Invalid GST Number format';
    return undefined;
  };

  const validateMobile = (field: string, value: string) => {
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!value) return `${field} is required`;
    if (!mobilePattern.test(value)) return 'Invalid Mobile Number';
    return undefined;
  };

  // --------------- Add / Update Customer ---------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      // Append images if they are File objects
      if (formData.aadharPhoto instanceof File) {
        formDataToSend.append('aadharPhoto', formData.aadharPhoto);
      }
      if (formData.panCardPhoto instanceof File) {
        formDataToSend.append('panCardPhoto', formData.panCardPhoto);
      }
      if (formData.customerPhoto instanceof File) {
        formDataToSend.append('customerPhoto', formData.customerPhoto);
      }

      // Append other fields
      Object.keys(formData).forEach((key) => {
        if (key === 'aadharPhoto' || key === 'panCardPhoto' || key === 'customerPhoto') {
          return;
        }
        const val = formData[key as keyof ICutomer];
        if (key === 'prizefix' || key === 'sites') {
          formDataToSend.append(key, JSON.stringify(val || []));
        } else {
          formDataToSend.append(key, String(val ?? '')); // ensure it's string
        }
      });

      // Create or update
      if (isEditMode && formData._id) {
        await customerService.updateCustomer(formData._id, formDataToSend);
        toast.success('Customer updated successfully');
      } else {
        await customerService.addCustomer(formDataToSend);
        toast.success('Customer added successfully');
      }
      handleClose();
      setShouldFetch(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        `Failed to ${isEditMode ? 'update' : 'add'} customer`
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------- Delete Customer ---------------
  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      await customerService.deleteCustomer(customerToDelete);
      toast.success('Customer deleted successfully');

      setCustomer((prevData) => {
        const filteredData = prevData.filter((item: ICutomer) => item._id !== customerToDelete);
        return filteredData.map((purchase: ICutomer, index: number) => ({
          ...purchase,
          no: index + 1
        }));
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  // --------------- Edit Customer ---------------
  const handleEditClick = (cust: any) => {
    // Make sure we don't pass undefined to inputs
    setFormData({
      ...cust,
      customerName: cust.customerName ?? '',
      mobileNumber: cust.mobileNumber ?? '',
      partnerName: cust.partnerName ?? '',
      partnerMobileNumber: cust.partnerMobileNumber ?? '',
      reference: cust.reference ?? '',
      referenceMobileNumber: cust.referenceMobileNumber ?? '',
      residentAddress: cust.residentAddress ?? '',
      aadharNo: cust.aadharNo ?? '',
      pancardNo: cust.pancardNo ?? '',
      GSTnumber: cust.GSTnumber ?? '',
      sites: cust.sites ?? []
    });
    setSearchQuery(cust.customerName || '');
    setIsEditMode(true);
    setOpen(true);
  };

  // --------------- Grid Toolbar & Export PDF ---------------
  const CustomToolbar = () => {
    const handleExport = (type: string) => {
      if (type === 'pdf') {
        const visibleCols = columns.filter(
          (col) => columnVisibility[col.field] !== false && col.field !== 'actions'
        );
        downloadPDF(visibleCols);
      }
    };

    return (
      <GridToolbarContainer
        sx={{
          p: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <Button
            onClick={() => handleExport('pdf')}
            startIcon={<FileDownloadIcon />}
            size="small"
            sx={{
              ml: 1,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'var(--primary-color)'
              }
            }}
          >
            Export PDF
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  };

  const downloadPDF = (visibleColumns: any[]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(123, 78, 255);
    doc.text('Purchase List', 14, 15);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = visibleColumns.map((col: any) => col.headerName);
    const keys = visibleColumns.map((col: any) => col.field);

    const tableData = customer.map((purchase: any) =>
      keys.map((key: string) => {
        switch (key) {
          case 'amount':
          case 'totalAmount':
          case 'sgst':
          case 'cgst':
          case 'igst':
            const val = purchase[key] || 0;
            return { content: Number(val).toFixed(2), styles: { halign: 'right' } };
          case 'date':
            return new Date(purchase[key]).toLocaleDateString('en-GB');
          default:
            return purchase[key]?.toString() || '';
        }
      })
    );

    // chunk rows per page
    const testTable = doc.autoTable({
      head: [headers],
      body: [tableData[0] || []],
      startY: 25,
      styles: { fontSize: 9 }
    });

    const pageHeight = doc.internal.pageSize.height;
    const usedHeight = (testTable as any).lastAutoTable.finalY - 25;
    const availableHeight = pageHeight - 30;
    const rowsPerPage = Math.max(1, Math.floor(availableHeight / usedHeight));

    let currentIndex = 0;
    while (currentIndex < tableData.length) {
      if (currentIndex > 0) doc.addPage();
      const slice = tableData.slice(currentIndex, currentIndex + rowsPerPage);
      doc.autoTable({
        head: [headers],
        body: slice,
        startY: 25,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [123, 78, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        }
      });
      currentIndex += rowsPerPage;
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 15,
        { align: 'center' }
      );
    }

    doc.save('purchases-list.pdf');
  };

  // --------------- Fetch Products ---------------
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const response = await productService.getAllProducts();
        setProducts(response.data.products);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };
    fetchProductsData();
  }, []);

  // --------------- Detail Panel Popup ---------------
  const DetailPanelDialog = () => {
    const selectedCustomerData = customer.find((p) => p._id === selectedProductIndex?.toString());
    if (!selectedCustomerData) return null;

    return (
      <Dialog
        open={productPopupOpen}
        onClose={() => setProductPopupOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  GST Number:
                </Typography>
                <Typography>{selectedCustomerData.GSTnumber}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Customer Name:
                </Typography>
                <Typography>{selectedCustomerData.customerName}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Mobile Number:
                </Typography>
                <Typography>{selectedCustomerData.mobileNumber}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Resident Address:
                </Typography>
                <Typography>{selectedCustomerData.residentAddress}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Pan Card Number:
                </Typography>
                <Typography>{selectedCustomerData.pancardNo}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Aadhar Card Number:
                </Typography>
                <Typography>{selectedCustomerData.aadharNo}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Partner Name:
                </Typography>
                <Typography>{selectedCustomerData.partnerName}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Partner Number:
                </Typography>
                <Typography>{selectedCustomerData.partnerMobileNumber}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Reference:
                </Typography>
                <Typography>{selectedCustomerData.reference}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex' }}>
                <Typography variant="body2" color="var(--primary-color)" sx={{ mr: 1 }}>
                  Reference Number:
                </Typography>
                <Typography>{selectedCustomerData.referenceMobileNumber}</Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Products Table */}
          <Typography variant="subtitle1" color="var(--primary-color)" gutterBottom>
            Products
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedCustomerData.prizefix?.map((product: any, index: any) => (
                  <TableRow key={index}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Sites Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" color="var(--primary-color)" gutterBottom>
              Sites
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Site Name</TableCell>
                    <TableCell>Site Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCustomerData?.sites?.map((site: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{site.siteName}</TableCell>
                      <TableCell>{site.siteAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Documents & Photos */}
          <Box sx={{ mb: 3, mt: 3 }}>
            <Typography variant="subtitle1" color="var(--primary-color)" gutterBottom>
              Documents & Photos
            </Typography>
            <Grid container spacing={2}>
              {selectedCustomerData.aadharPhoto && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="var(--primary-color)">
                    Aadhar Card:
                  </Typography>
                  <Box
                    component="img"
                    src={
                      typeof selectedCustomerData.aadharPhoto === 'string'
                        ? selectedCustomerData.aadharPhoto
                        : ''
                    }
                    alt="Aadhar"
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                </Grid>
              )}
              {selectedCustomerData.panCardPhoto && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="var(--primary-color)">
                    Pan Card:
                  </Typography>
                  <Box
                    component="img"
                    src={
                      typeof selectedCustomerData.panCardPhoto === 'string'
                        ? selectedCustomerData.panCardPhoto
                        : ''
                    }
                    alt="Pancard"
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                </Grid>
              )}
              {selectedCustomerData.customerPhoto && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="var(--primary-color)">
                    Customer Photo:
                  </Typography>
                  <Box
                    component="img"
                    src={
                      typeof selectedCustomerData.customerPhoto === 'string'
                        ? selectedCustomerData.customerPhoto
                        : ''
                    }
                    alt="CustomerPhoto"
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setProductPopupOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // --------------- Photo Upload ---------------
  const handlePhotoUpload = async (
    field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto',
    file: File
  ) => {
    try {
      setFormData((prev) => ({
        ...prev,
        [field]: file
      }));
      toast.success(`${field} selected successfully`);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(`Failed to process ${field}`);
    }
  };

  // Add these keyboard navigation handlers
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        nextField.focus();
      }
    }
  };

  // --------------- Product & Site Management ---------------
  const handleProductChange = (
    siteIndex: number,
    productIndex: number,
    field: keyof Iprizefix,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      sites: (prev.sites || []).map((site, i) =>
        i === siteIndex
          ? {
            ...site,
            prizefix: site.prizefix.map((product, j) =>
              j === productIndex ? { ...product, [field]: value } : product
            )
          }
          : site
      )
    }));
  };

  const addProduct = (siteIndex: number) => {
    setFormData((prev) => {
      const newSites = [...(prev.sites || [])];
      const currentSite = newSites[siteIndex];
      if (currentSite) {
        const newIndex = (currentSite.prizefix?.length || 0);
        currentSite.prizefix = [
          ...(currentSite.prizefix || []),
          { productName: '', size: '', rate: 0 }
        ];
        setLastAddedProductIndex(newIndex);
      }
      return { ...prev, sites: newSites };
    });
  };

  const removeProduct = (siteIndex: number, productIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      sites: (prev.sites || []).map((site, i) =>
        i === siteIndex
          ? {
            ...site,
            prizefix: site.prizefix.filter((_, j) => j !== productIndex)
          }
          : site
      )
    }));
  };

  // --------------- Manage multiple Sites ---------------
  const removeSite = (index: number) => {
    if ((formData.sites || []).length === 1) return;
    setFormData((prev) => ({
      ...prev,
      sites: (prev.sites || []).filter((_, i) => i !== index)
    }));
    setSelectedSiteIndex(Math.max(0, index - 1));
  };

  const handleAddSiteFormOpen = () => {
    setEditingSiteIndex(null);
    setTempSite(initialSite);
    setShowSiteForm(true);
  };

  const handleEditSite = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSiteIndex(index);
    setTempSite({ ...(formData.sites || [])[index] });
    setShowSiteForm(true);
  };

  const handleSiteFormCancel = () => {
    setEditingSiteIndex(null);
    setTempSite(initialSite);
    setShowSiteForm(false);
  };

  const handleSiteFormSave = () => {
    if (editingSiteIndex === null) {
      // Add new site
      const siteCount = (formData.sites || []).length;
      setFormData((prev) => ({
        ...prev,
        sites: [
          ...(prev.sites || []),
          {
            ...tempSite,
            challanNumber: `S${siteCount + 1}C${Math.floor(Math.random() * 1000)}`
          }
        ]
      }));
      setSelectedSiteIndex(siteCount);
    } else {
      // Edit existing site
      setFormData((prev) => {
        const updatedSites = [...(prev.sites || [])];
        updatedSites[editingSiteIndex] = { ...tempSite };
        return { ...prev, sites: updatedSites };
      });
      setSelectedSiteIndex(editingSiteIndex);
    }
    setEditingSiteIndex(null);
    setTempSite(initialSite);
    setShowSiteForm(false);
  };

  // ---------- ProductName custom dropdown ----------
  const handleProductNameFocus = (key: string) => {
    setOpenProductNameDropdown((prev) => ({ ...prev, [key]: true }));
  };
  const handleProductNameBlur = (key: string) => {
    setTimeout(() => {
      setOpenProductNameDropdown((prev) => ({ ...prev, [key]: false }));
    }, 100);
  };

  // ---------- Size custom dropdown ----------
  const handleSizeFocus = (key: string) => {
    setOpenSizeDropdown((prev) => ({ ...prev, [key]: true }));
  };
  const handleSizeBlur = (key: string) => {
    setTimeout(() => {
      setOpenSizeDropdown((prev) => ({ ...prev, [key]: false }));
    }, 100);
  };

  // --------------- Render the product list for the currently selected site ---------------
  const renderProductsForSite = () => {
    const currentSite = formData.sites?.[selectedSiteIndex];
    if (!currentSite) return null;

    // Collect unique product names:
    const productNames = Array.from(new Set(products?.map((p) => p.productName) || []));
    // Helper for sizes:
    const getSizesForProduct = (name: string | undefined) => {
      if (!name) return [];
      return products
        ?.filter((p) => p.productName === name)
        .map((p) => p.size) || [];
    };

    return (
      <Box
        ref={productsContainerRef}
        sx={{
          position: 'relative',
          '&:focus-within': {
            outline: 'none'
          }
        }}
        onKeyDown={(e) => {
          // Prevent tab from moving outside the container
          if (e.key === 'Tab' && !e.shiftKey) {
            const focusableElements = productsContainerRef.current?.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const lastElement = focusableElements?.[focusableElements.length - 1];
            if (e.target === lastElement) {
              e.preventDefault();
              const firstElement = focusableElements?.[0];
              if (firstElement instanceof HTMLElement) {
                firstElement.focus();
              }
            }
          }
        }}
      >
        <Stack spacing={3}>
          {currentSite.prizefix?.map((prod, productIndex) => {
            const productKey = `${selectedSiteIndex}-${productIndex}`;
            const sizes = getSizesForProduct(prod.productName);

            return (
              <Paper
                key={productKey}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  background: '#f8f9fa',
                  position: 'relative'
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  {/* PRODUCT NAME SELECT */}
                  <Box flex={2}>
                    <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>Product Name</label>
                    <div
                      data-product-key={productKey}
                      style={{
                        position: 'relative',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        marginTop: '4px',
                        backgroundColor: 'white'
                      }}
                      tabIndex={0}
                      onFocus={() => {
                        handleProductNameFocus(productKey);
                        setSelectedProductOptionIndex(-1);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          handleProductNameBlur(productKey);
                          setSelectedProductOptionIndex(-1);
                        }, 200);
                      }}
                      onKeyDown={(e) => {
                        if (openProductNameDropdown[productKey]) {
                          switch (e.key) {
                            case 'ArrowDown':
                              e.preventDefault();
                              setSelectedProductOptionIndex((prev) => 
                                prev < productNames.length - 1 ? prev + 1 : prev
                              );
                              break;
                            case 'ArrowUp':
                              e.preventDefault();
                              setSelectedProductOptionIndex((prev) => 
                                prev > 0 ? prev - 1 : prev
                              );
                              break;
                            case 'Enter':
                              e.preventDefault();
                              if (selectedProductOptionIndex >= 0) {
                                const selectedProduct = productNames[selectedProductOptionIndex];
                                handleProductChange(selectedSiteIndex, productIndex, 'productName', selectedProduct);
                                handleProductChange(selectedSiteIndex, productIndex, 'size', '');
                                setOpenProductNameDropdown((prev) => ({ ...prev, [productKey]: false }));
                                // Focus size input
                                setTimeout(() => {
                                  const sizeField = document.getElementById(`size-input-${productKey}`);
                                  sizeField?.focus();
                                }, 50);
                              }
                              break;
                            case 'Escape':
                              e.preventDefault();
                              setOpenProductNameDropdown((prev) => ({ ...prev, [productKey]: false }));
                              break;
                          }
                        }
                      }}
                    >
                      {prod.productName || 'Select Product'}
                      {openProductNameDropdown[productKey] && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            background: '#fff',
                            border: '1px solid #ddd',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            marginTop: 4,
                            zIndex: 999,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}
                        >
                          {productNames.map((name, index) => (
                            <div
                              key={name}
                              id={`product-option-${index}`}
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #eee',
                                backgroundColor: selectedProductOptionIndex === index ? 'lightgray' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleProductChange(selectedSiteIndex, productIndex, 'productName', name);
                                handleProductChange(selectedSiteIndex, productIndex, 'size', '');
                                setOpenProductNameDropdown((prev) => ({ ...prev, [productKey]: false }));
                                // Focus size input
                                setTimeout(() => {
                                  const sizeField = document.getElementById(`size-input-${productKey}`);
                                  sizeField?.focus();
                                }, 50);
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Box>

                  {/* SIZE SELECT */}
                  <Box flex={1}>
                    <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>Size</label>
                    <div
                      id={`size-input-${productKey}`}
                      style={{
                        position: 'relative',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        padding: '6px 8px',
                        cursor: prod.productName ? 'pointer' : 'not-allowed',
                        marginTop: '4px',
                        backgroundColor: 'white'
                      }}
                      tabIndex={prod.productName ? 0 : -1}
                      onFocus={() => {
                        if (prod.productName) {
                          handleSizeFocus(productKey);
                          setSelectedSizeOptionIndex(-1);
                        }
                      }}
                      onBlur={() => {
                        if (prod.productName) {
                          setTimeout(() => {
                            handleSizeBlur(productKey);
                            setSelectedSizeOptionIndex(-1);
                          }, 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (openSizeDropdown[productKey] && prod.productName) {
                          switch (e.key) {
                            case 'ArrowDown':
                              e.preventDefault();
                              setSelectedSizeOptionIndex((prev) => 
                                prev < sizes.length - 1 ? prev + 1 : prev
                              );
                              break;
                            case 'ArrowUp':
                              e.preventDefault();
                              setSelectedSizeOptionIndex((prev) => 
                                prev > 0 ? prev - 1 : prev
                              );
                              break;
                            case 'Enter':
                              e.preventDefault();
                              if (selectedSizeOptionIndex >= 0) {
                                const selectedSize = sizes[selectedSizeOptionIndex];
                                handleProductChange(selectedSiteIndex, productIndex, 'size', selectedSize);
                                const matchedProduct = products?.find(
                                  (p) => p.productName === prod.productName && p.size === selectedSize
                                );
                                if (matchedProduct?.rate) {
                                  handleProductChange(selectedSiteIndex, productIndex, 'rate', matchedProduct.rate);
                                }
                                setOpenSizeDropdown((prev) => ({ ...prev, [productKey]: false }));
                                // Focus rate input
                                setTimeout(() => {
                                  const rateField = document.getElementById(`rate-${productKey}`);
                                  rateField?.focus();
                                }, 50);
                              }
                              break;
                            case 'Escape':
                              e.preventDefault();
                              setOpenSizeDropdown((prev) => ({ ...prev, [productKey]: false }));
                              break;
                          }
                        }
                      }}
                    >
                      {prod.size || (prod.productName ? 'Select Size' : 'Please select Product first')}
                      {openSizeDropdown[productKey] && prod.productName && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            background: '#fff',
                            border: '1px solid #ddd',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            marginTop: 4,
                            zIndex: 999,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}
                        >
                          {sizes.map((sz, index) => (
                            <div
                              key={sz}
                              id={`size-option-${index}`}
                              style={{
                                padding: '6px',
                                borderBottom: '1px solid #eee',
                                backgroundColor: selectedSizeOptionIndex === index ? 'lightgray' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleProductChange(selectedSiteIndex, productIndex, 'size', sz);
                                const matchedProduct = products?.find(
                                  (p) => p.productName === prod.productName && p.size === sz
                                );
                                if (matchedProduct?.rate) {
                                  handleProductChange(selectedSiteIndex, productIndex, 'rate', matchedProduct.rate);
                                }
                                setOpenSizeDropdown((prev) => ({ ...prev, [productKey]: false }));
                                // Focus rate input
                                setTimeout(() => {
                                  const rateField = document.getElementById(`rate-${productKey}`);
                                  rateField?.focus();
                                }, 50);
                              }}
                            >
                              {sz}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Box>

                  {/* RATE INPUT */}
                  <Box flex={1}>
                    <FormInput
                      label="Rate"
                      name="rate"
                      type="number"
                      value={prod.rate?.toString() || '0'}
                      id={`rate-${productKey}`}
                      onChange={(e) =>
                        handleProductChange(
                          selectedSiteIndex,
                          productIndex,
                          'rate',
                          Number(e.target.value)
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // If this is the last product, add a new one
                          if (productIndex === currentSite.prizefix.length - 1) {
                            addProduct(selectedSiteIndex);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Prevent focus from moving outside the product section
                        if (!e.relatedTarget?.closest('[data-product-section]')) {
                          e.preventDefault();
                          const nextProductInput = document.querySelector(`[data-product-key="${productKey}"]`);
                          if (nextProductInput instanceof HTMLElement) {
                            nextProductInput.focus();
                          }
                        }
                      }}
                      sx={{
                        '& .MuiInputBase-input': { textAlign: 'right', pr: 2 },
                        mt: { xs: 2, md: 0 }
                      }}
                    />
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      id={`delete-${productKey}`}
                      onClick={() => removeProduct(selectedSiteIndex, productIndex)}
                      sx={{
                        color: 'error.main'
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          removeProduct(selectedSiteIndex, productIndex);
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    {productIndex === currentSite.prizefix.length - 1 && (
                      <IconButton
                        onClick={() => addProduct(selectedSiteIndex)}
                        sx={{
                          color: 'success.main'
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            addProduct(selectedSiteIndex);
                          }
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    )}
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    );
  };

  // Add back the PhotoUploadButton component
  const PhotoUploadButton = ({
    field,
    icon,
    label,
    id
  }: {
    field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto';
    icon: React.ReactNode;
    label: string;
    id: string;
  }) => (
    <Box flex={1}>
      <input
        type="file"
        accept="image/*"
        id={`${field}-upload`}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handlePhotoUpload(field, file);
          }
        }}
      />
      <label htmlFor={`${field}-upload`}>
        <Button
          component="span"
          id={id}
          startIcon={icon}
          sx={{
            mt: 2,
            bgcolor: '#7b4eff',
            color: 'white',
            '&:hover': {
              bgcolor: '#6a3dd9'
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById(`${field}-upload`)?.click();
            }
          }}
        >
          {label}
        </Button>
      </label>
    </Box>
  );

  // Add back the renderSiteSelection function
  const renderSiteSelection = () => (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mt: 3,
        backgroundColor: '#f8f9fa',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 0.5 }}>
            Customer's Sites
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSiteFormOpen}
          sx={{
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' },
            borderRadius: '8px',
            px: 3
          }}
        >
          Add Site
        </Button>
      </Box>

      {/* Existing sites as "cards" */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 2,
          mb: 2
        }}
      >
        {(formData.sites || []).map((site, index) => (
          <Card
            key={index}
            onClick={() => setSelectedSiteIndex(index)}
            sx={{
              cursor: 'pointer',
              border: '1px solid',
              borderColor: index === selectedSiteIndex ? 'var(--primary-color)' : 'divider',
              backgroundColor: index === selectedSiteIndex ? '#7b4eff38' : 'white',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                borderColor: 'var(--primary-color)'
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1
                }}
              >
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: index === selectedSiteIndex ? 'var(--primary-color)' : 'var(--primary-light)',
                      mb: 0.5
                    }}
                  >
                    {site.siteName || `Site ${index + 1}`}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="var(--primary-light)"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '40px'
                    }}
                  >
                    {site.siteAddress || 'No address provided'}
                  </Typography>
                </Box>

                {/* Edit & Delete Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={(e) => handleEditSite(index, e)}
                    size="small"
                    sx={{
                      color: 'info.main',
                      bgcolor: 'info.lighter',
                      '&:hover': {
                        bgcolor: 'info.light'
                      },
                      width: 32,
                      height: 32
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSite(index);
                    }}
                    size="small"
                    sx={{
                      color: 'error.main',
                      bgcolor: 'error.lighter',
                      '&:hover': {
                        bgcolor: 'error.light'
                      },
                      width: 32,
                      height: 32
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Inline Add/Edit Site Form */}
      {showSiteForm && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'white'
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {editingSiteIndex === null ? 'Add a New Site' : 'Edit Site'}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} marginTop={2} spacing={2}>
            <Box flex={1}>
              <FormInput
                name="siteName"
                label="Site Name"
                value={tempSite.siteName}
                onChange={(e) => setTempSite((prev) => ({ ...prev, siteName: e.target.value }))}
                size="small"
              />
            </Box>
            <Box flex={1}>
              <FormInput
                name="siteAddress"
                label="Site Address"
                value={tempSite.siteAddress}
                onChange={(e) => setTempSite((prev) => ({ ...prev, siteAddress: e.target.value }))}
                size="small"
              />
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} marginTop={2} spacing={2}>
            <Box flex={1}>
              <FormInput
                name="supervisorName"
                label="Supervisor Name"
                value={tempSite.supervisorName}
                onChange={(e) => setTempSite((prev) => ({ ...prev, supervisorName: e.target.value }))}
                type="tel"
                required
                size="small"
              />
            </Box>
            <Box flex={1}>
              <FormInput
                name="mobileNumber"
                label="Supervisor Number"
                value={tempSite.supervisorNumber}
                onChange={(e) => setTempSite((prev) => ({ ...prev, supervisorNumber: e.target.value }))}
                validate={validateMobile}
                type="tel"
                required
                size="small"
              />
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" marginTop={2} spacing={2}>
            <Button variant="outlined" onClick={handleSiteFormCancel} sx={{ bgcolor: 'var(--error-color)', color: 'white' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSiteFormSave} sx={{ bgcolor: 'var(--primary-color)', color: 'white' }} >
              Save Site
            </Button>
          </Stack>
        </Paper>
      )}

      {/* If no sites exist */}
      {(formData.sites || []).length === 0 && !showSiteForm && (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Sites Added Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add your first project site to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingSiteIndex(null);
              setTempSite(initialSite);
              setShowSiteForm(true);
            }}
          >
            Add First Site
          </Button>
        </Box>
      )}
    </Paper>
  );

  // Add effect to handle focus and scroll after adding product
  useEffect(() => {
    if (lastAddedProductIndex >= 0) {
      const newProductKey = `${selectedSiteIndex}-${lastAddedProductIndex}`;
      const newProductInput = document.querySelector(`[data-product-key="${newProductKey}"]`);
      
      if (newProductInput instanceof HTMLElement) {
        // Scroll the new product into view
        newProductInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus after a short delay to ensure DOM is updated
        setTimeout(() => {
          newProductInput.focus();
          setLastAddedProductIndex(-1); // Reset the index
        }, 100);
      }
    }
  }, [lastAddedProductIndex, selectedSiteIndex]);

  return (
    <Box sx={{ p: 2 }}>
      <Button
        fullWidth
        variant="contained"
        sx={{ bgcolor: '#7b4eff', color: 'white', mb: 2 }}
        onClick={() => {
          setIsEditMode(false);
          setFormData(initialFormData);
          setOpen(true);
        }}
      >
        <PersonAddAltIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        Add new Customer
      </Button>

      {/* ADD/EDIT MODAL */}
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
        <Box sx={modalStyle}>
          <IconButton
            onClick={handleClose}
            sx={{
              fontSize: 'xx-large',
              position: 'sticky',
              top: 10,
              left: '99%',
              color: 'var(--error-color)',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}>x</IconButton>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Typography>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* First Row: Name, Mobile, GST */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {/* Customer Name + Autocomplete */}
                <Box flex={1} sx={{ position: 'relative' }}>
                  <TextField
                    autoFocus
                    id="customer-name"
                    label="Customer Name"
                    value={searchQuery}
                    className="customer-name-input"
                    onChange={handleCustomerSearchChange}
                    onKeyDown={(e) => {
                      if (customers.length > 0) {
                        switch (e.key) {
                          case 'ArrowDown':
                            e.preventDefault();
                            setSelectedOptionIndex((prev) => 
                              prev < customers.length - 1 ? prev + 1 : prev
                            );
                            break;
                          case 'ArrowUp':
                            e.preventDefault();
                            setSelectedOptionIndex((prev) => (prev > 0 ? prev - 1 : prev));
                            break;
                          case 'Enter':
                            e.preventDefault();
                            if (selectedOptionIndex >= 0) {
                              handleCustomerSelect(customers[selectedOptionIndex]);
                            } else {
                              handleKeyDown(e, 'mobile-number');
                            }
                            break;
                          case 'Escape':
                            e.preventDefault();
                            setCustomers([]);
                            setSelectedOptionIndex(-1);
                            break;
                          default:
                            handleKeyDown(e, 'mobile-number');
                        }
                      } else {
                        handleKeyDown(e, 'mobile-number');
                      }
                    }}
                    fullWidth
                    required
                    autoComplete="on"
                    variant="outlined"
                    size="small"
                    inputProps={{
                      'aria-label': 'Customer Name',
                      role: 'combobox',
                      'aria-expanded': customers.length > 0,
                      'aria-controls': 'customer-suggestions',
                      'aria-activedescendant': selectedOptionIndex >= 0 ? `option-${selectedOptionIndex}` : undefined
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7b4eff'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7b4eff'
                        }
                      }
                    }}
                  />
                  {/* Autocomplete Suggestions */}
                  {customers.length > 0 && (
                    <Paper
                      id="customer-suggestions"
                      role="listbox"
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        mt: 1,
                        maxHeight: 200,
                        border: '2px solid var(--primary-color)',
                        overflowY: 'auto',
                        backgroundColor: 'var(--surface-light)'
                      }}
                    >
                      {customers.map((cust, index) => (
                        <Box
                          key={cust._id}
                          id={`option-${index}`}
                          role="option"
                          tabIndex={0}
                          aria-selected={selectedOptionIndex === index}
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            backgroundColor: selectedOptionIndex === index ? 'lightgray' : 'transparent',
                            '&:hover': { backgroundColor: 'lightgray' },
                            '&:focus': {
                              backgroundColor: 'lightgray',
                              outline: 'none'
                            }
                          }}
                          onClick={() => handleCustomerSelect(cust)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleCustomerSelect(cust);
                            }
                          }}
                        >
                          {cust.customerName}
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Box>

                <Box flex={1}>
                  <FormInput
                    id="mobile-number"
                    name="mobileNumber"
                    label="Mobile Number"
                    value={formData.mobileNumber ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'gst-number')}
                    validate={validateMobile}
                    type="tel"
                    required
                    size="small"
                    inputProps={{
                      'aria-label': 'Mobile Number',
                      pattern: '[6-9]\\d{9}'
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    id="gst-number"
                    name="GSTnumber"
                    label="GST Number"
                    value={formData.GSTnumber ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'partner-name')}
                    validate={validateGST}
                    size="small"
                    inputProps={{
                      'aria-label': 'GST Number',
                      pattern: '[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}'
                    }}
                  />
                </Box>
              </Stack>

              {/* Second Row: Partner Name, Partner Mobile, Resident Address */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    id="partner-name"
                    name="partnerName"
                    label="Partner Name"
                    value={formData.partnerName ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'partner-mobile')}
                    size="small"
                    inputProps={{
                      'aria-label': 'Partner Name'
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    id="partner-mobile"
                    name="partnerMobileNumber"
                    label="Partner Mobile Number"
                    value={formData.partnerMobileNumber ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'resident-address')}
                    validate={validateMobile}
                    type="tel"
                    size="small"
                    inputProps={{
                      'aria-label': 'Partner Mobile Number',
                      pattern: '[6-9]\\d{9}'
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    id="resident-address"
                    name="residentAddress"
                    label="Resident Address"
                    value={formData.residentAddress ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'reference')}
                    size="small"
                    inputProps={{
                      'aria-label': 'Resident Address'
                    }}
                  />
                </Box>
              </Stack>

              {/* Third Row: Reference, Ref Mobile, Aadhar, Pan */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    id="reference"
                    name="reference"
                    label="Reference"
                    value={formData.reference ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'reference-mobile')}
                    size="small"
                    inputProps={{
                      'aria-label': 'Reference'
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    id="reference-mobile"
                    name="referenceMobileNumber"
                    label="Reference Mobile Number"
                    value={formData.referenceMobileNumber ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'aadhar-no')}
                    validate={validateMobile}
                    type="tel"
                    size="small"
                    inputProps={{
                      'aria-label': 'Reference Mobile Number',
                      pattern: '[6-9]\\d{9}'
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    id="aadhar-no"
                    name="aadharNo"
                    label="Aadhar No"
                    value={formData.aadharNo ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'pancard-no')}
                    size="small"
                    inputProps={{
                      'aria-label': 'Aadhar Number',
                      pattern: '\\d{12}'
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    id="pancard-no"
                    name="pancardNo"
                    label="Pan Card No"
                    value={formData.pancardNo ?? ''}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'aadhar-photo')}
                    size="small"
                    inputProps={{
                      'aria-label': 'Pan Card Number',
                      pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}'
                    }}
                  />
                </Box>
              </Stack>

              {/* Photo Upload Buttons */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <PhotoUploadButton
                  field="aadharPhoto"
                  icon={<AddAPhotoIcon />}
                  label="Aadhar Photo"
                  id="aadhar-photo"
                />
                <PhotoUploadButton
                  field="panCardPhoto"
                  icon={<CreditCardIcon />}
                  label="Pan Card Photo"
                  id="pancard-photo"
                />
                <PhotoUploadButton
                  field="customerPhoto"
                  icon={<PersonIcon />}
                  label="Customer Photo"
                  id="customer-photo"
                />
              </Stack>

              {/* Sites */}
              {renderSiteSelection()}

              {/* Products for selected site */}
              <Box data-product-section>
                {renderProductsForSite()}
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                  {isEditMode ? 'Update Customer' : 'Save Customer'}
                </Button>
              </Stack>
            </Stack>
          </Form>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this customer? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Panel Dialog */}
      <DetailPanelDialog />

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          ref={gridRef}
          rows={customer}
          columns={columns}
          loading={loading || isLoadingPreferences}
          disableRowSelectionOnClick
          getRowId={(row: any) => row._id}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5'
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            }
          }}
          slots={{
            toolbar: CustomToolbar,
            loadingOverlay: () => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress color="primary" />
              </Box>
            )
          }}
          filterModel={gridFilterModel}
          onFilterModelChange={(model) => setGridFilterModel(model)}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={(newModel) => {
            setColumnVisibility(newModel);
            saveColumnVisibility(newModel);
          }}
          disableColumnFilter={false}
          disableDensitySelector
          disableColumnSelector={false}
          initialState={{
            columns: {
              columnVisibilityModel: columnVisibility
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default Customer;
