import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
  CardContent,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridFilterModel,
  GridLogicOperator,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
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
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PhoneIcon from '@mui/icons-material/Phone';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { debounce } from 'lodash';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface IProducts {
  _id: string;
  productName: string;
  size: string;
  rate: number;
}

interface Iprizefix {
  _id?: string;
  productName?: string;
  size?: string;
  rate?: number;
}

interface ISite {
  siteName: string;
  siteAddress: string;
  supervisorName?: string;
  supervisorNumber?: string;
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

const initialSite: ISite = {
  siteName: '',
  siteAddress: '',
  supervisorName: '',
  supervisorNumber: '',
  challanNumber: 'S1C1',
  prizefix: [
    {
      productName: '',
      size: '',
      rate: 0,
    },
  ],
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
  sites: [initialSite],
};

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
  overflowY: 'auto',
};

const Customer = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [customer, setCustomer] = useState<ICutomer[]>([]);
  const [formData, setFormData] = useState<ICutomer>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const fetchInProgress = useRef(false);

  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const formFirstInputRef = useRef<HTMLInputElement>(null);

  // For detail panel
  const [productPopupOpen, setProductPopupOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);

  // DataGrid states
  const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: 'and' as GridLogicOperator,
  });
  const gridRef = useRef<any>(null);
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});

  // Product list
  const [products, setProducts] = useState<IProducts[] | null>(null);
  const [productOptions, setProductOptions] = useState<string[]>([]);

  // For auto-complete on "customerName"
  const [searchQuery, setSearchQuery] = useState('');
  const [customersFound, setCustomersFound] = useState<ICutomer[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(0);

  const location = useLocation();

  // ============== SITE FORM STATE (Add/Edit) ==============
  const [showSiteForm, setShowSiteForm] = useState(false); // if true, shows inline site form
  const [editingSiteIndex, setEditingSiteIndex] = useState<number | null>(null); // which site we are editing
  const [tempSite, setTempSite] = useState<ISite>(initialSite);

  // --------------------------------------------------
  //                DATA FETCHING
  // --------------------------------------------------
  const fetchCustomers = useCallback(async () => {
    if (fetchInProgress.current || loading) return;
    try {
      fetchInProgress.current = true;
      setLoading(true);
      const response = await customerService.getAllCustomers({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const newCustomers = response.data?.items || [];
      const customersWithNumbers = newCustomers.map((cust: any, index: number) => ({
        ...cust,
        id: cust._id,
        no: index + 1,
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

  // fetch products
  useEffect(() => {
    const fetchProds = async () => {
      try {
        const response = await productService.getAllProducts();
        const allProds: IProducts[] = response.data.products;
        setProducts(allProds);

        // create an array of unique product names
        const uniqueNames = Array.from(new Set(allProds.map((p) => p.productName)));
        setProductOptions(uniqueNames);
      } catch (err) {
        toast.error('Failed to fetch products');
      }
    };

    fetchProds();
  }, []);

  // --------------------------------------------------
  //    MOUNT FOCUS LOGIC (Focus "Add Customer" btn)
  // --------------------------------------------------
  useEffect(() => {
    if (addButtonRef.current) {
      addButtonRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (open && formFirstInputRef.current) {
      setTimeout(() => {
        formFirstInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (open && addButtonRef.current) {
      addButtonRef.current?.focus();
    }
  }, [location.pathname]);

  // --------------------------------------------------
  //             OPEN/CLOSE MAIN MODAL
  // --------------------------------------------------
  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
    // Also reset any site form:
    setShowSiteForm(false);
    setEditingSiteIndex(null);
    setTempSite(initialSite);
  };

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setOpen(true);
    }
  }, [open]);

  // --------------------------------------------------
  //       AUTOCOMPLETE for "Customer Name"
  // --------------------------------------------------
  const fetchCustomersDebounced = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          if (!query) {
            const resp = await customerService.getCustomerByName('');
            const data = resp.data?.customers || [];
            const top5 = data.slice(0, 5);
            setCustomersFound(top5);
            return;
          }
          const response = await customerService.getCustomerByName(query);
          const data = response.data?.customers || [];
          if (data.length === 0) {
            // If no results, we fill "customerName" with the typed text
            handleCustomerSelect({
              customerName: query.toString(),
              mobileNumber: '',
            } as ICutomer);
          }
          setCustomersFound(data);
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      }, 500),
    []
  );

  const handleCustomerSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setFormData((prev) => ({
      ...prev,
      customerName: query,
    }));
    fetchCustomersDebounced(query);
  };

  const handleCustomerSelect = (cust: ICutomer) => {
    setSearchQuery(cust.customerName || '');
    setCustomersFound([]);
    setFormData((prev) => ({
      ...prev,
      customerName: cust.customerName ?? '',
      customerId: cust._id || '',
      mobileNumber: cust.mobileNumber ?? '',
      // etc. if you want to copy more fields
    }));
  };

  // --------------------------------------------------
  //                 GST LOGIC
  // --------------------------------------------------
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
        };
      }
      throw new Error(data.message || 'Failed to fetch GST details');
    } catch (error) {
      console.error('Error fetching GST details:', error);
      return null;
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'GSTnumber' ? value.toUpperCase() : value;

    if (name === 'GSTnumber' && processedValue.length === 15) {
      try {
        setLoading(true);
        const gstDetails = await fetchGSTDetails(processedValue);
        if (gstDetails) {
          if (gstDetails.status.toLowerCase() !== 'active') {
            toast.error('GST number is not active');
          }
          setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
            companyName: gstDetails.tradeName || gstDetails.legalName || '',
            supplierName: gstDetails.legalName || '',
          }));
          toast.success('GST details fetched successfully');
        } else {
          toast.error('Could not fetch GST details');
        }
      } catch (error: any) {
        toast.error(error.message || 'Error fetching GST details');
      } finally {
        setLoading(false);
      }
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
  };

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

  // --------------------------------------------------
  //                SUBMIT FORM
  // --------------------------------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      if (formData.aadharPhoto instanceof File) {
        formDataToSend.append('aadharPhoto', formData.aadharPhoto);
      }
      if (formData.panCardPhoto instanceof File) {
        formDataToSend.append('panCardPhoto', formData.panCardPhoto);
      }
      if (formData.customerPhoto instanceof File) {
        formDataToSend.append('customerPhoto', formData.customerPhoto);
      }

      // Add normal fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof ICutomer];
        if (key === 'sites') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, String(value ?? ''));
        }
      });

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
        error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} customer`
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  //                DELETE LOGIC
  // --------------------------------------------------
  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await customerService.deleteCustomer(customerToDelete);
      toast.success('Customer deleted successfully');
      setCustomer((prev) => {
        const filtered = prev.filter((item) => item._id !== customerToDelete);
        return filtered.map((c, idx) => ({ ...c, no: idx + 1 }));
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  // --------------------------------------------------
  //                EDIT LOGIC
  // --------------------------------------------------
  const handleEditClick = (cust: ICutomer) => {
    setFormData(cust);
    setIsEditMode(true);
    setOpen(true);
    inputRef.current?.focus();
  };

  // --------------------------------------------------
  //         DATAGRID CUSTOM TOOLBAR & PDF
  // --------------------------------------------------
  const CustomToolbar = () => {
    const handleExport = (type: string) => {
      if (type === 'pdf') {
        const visibleColumns = columns.filter(
          (col) => columnVisibility[col.field] !== false && col.field !== 'actions'
        );
        downloadPDF(visibleColumns);
      }
    };

    return (
      <GridToolbarContainer
        sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
                backgroundColor: 'var(--primary-color)',
                color: '#fff',
              },
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
    doc.text('Customers List', 14, 15);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = visibleColumns.map((col) => col.headerName);
    const keys = visibleColumns.map((col) => col.field);

    const tableData = customer.map((cust: any) =>
      keys.map((key) => {
        switch (key) {
          case 'date':
            return new Date(cust[key]).toLocaleDateString('en-GB');
          default:
            return cust[key]?.toString() || '';
        }
      })
    );

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: { left: 4, right: 4, top: 2, bottom: 2 },
        lineWidth: 0,
      },
      headStyles: {
        fillColor: [123, 78, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
    });
    doc.save('customers-list.pdf');
  };

  // --------------------------------------------------
  //     DETAIL PANEL DIALOG for selected Customer
  // --------------------------------------------------
  const DetailPanelDialog = () => {
    const selectedCust = customer.find((p) => p._id === selectedProductIndex?.toString());
    if (!selectedCust) return null;

    return (
      <Dialog
        open={productPopupOpen}
        onClose={() => setProductPopupOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {/* ... same as your code for showing customer details ... */}
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setProductPopupOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // --------------------------------------------------
  //    PHOTO UPLOAD
  // --------------------------------------------------
  const handlePhotoUpload = async (
    field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto',
    file: File
  ) => {
    try {
      setFormData((prev) => ({
        ...prev,
        [field]: file,
      }));
      toast.success(`${field} selected successfully`);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(`Failed to process ${field}`);
    }
  };

  const PhotoUploadButton = ({
    field,
    icon,
    label,
  }: {
    field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto';
    icon: React.ReactNode;
    label: string;
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
          startIcon={icon}
          sx={{
            mt: 2,
            bgcolor: 'var(--primary-color)',
            color: 'var(--text-light)',
            '&:hover': {
              bgcolor: 'var(--primary-light)',
            },
          }}
        >
          {label}
        </Button>
      </label>
    </Box>
  );

  // --------------------------------------------------
  //    ADD / EDIT PRODUCT LINES
  // --------------------------------------------------
  const handleProductChange = (
    siteIndex: number,
    productIndex: number,
    field: keyof Iprizefix,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.map((site, i) =>
        i === siteIndex
          ? {
              ...site,
              prizefix: site.prizefix.map((prod, j) =>
                j === productIndex ? { ...prod, [field]: value } : prod
              ),
            }
          : site
      ),
    }));
  };

  const addProduct = (siteIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.map((site, i) =>
        i === siteIndex
          ? {
              ...site,
              prizefix: [...site.prizefix, { productName: '', size: '', rate: 0 }],
            }
          : site
      ),
    }));
  };

  const removeProduct = (siteIndex: number, productIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.map((site, i) =>
        i === siteIndex
          ? {
              ...site,
              prizefix: site.prizefix.filter((_, j) => j !== productIndex),
            }
          : site
      ),
    }));
  };

  const productInput = (siteIndex: number, productIndex: number, product: Iprizefix) => {
    const productKey = `${siteIndex}_${productIndex}`;

    // For Product Name Autocomplete
    const handleProductSelected = (newValue: string | null) => {
      const chosenProduct = newValue || '';
      handleProductChange(siteIndex, productIndex, 'productName', chosenProduct);
      // reset size
      handleProductChange(siteIndex, productIndex, 'size', '');
    };

    // For Size Autocomplete
    const sizeOptions = useMemo(() => {
      if (!product.productName || !products) return [];
      const relevant = products.filter((p) => p.productName === product.productName);
      return Array.from(new Set(relevant.map((r) => r.size)));
    }, [product.productName, products]);

    const handleSizeSelected = (newSize: string | null) => {
      handleProductChange(siteIndex, productIndex, 'size', newSize || '');
      const foundRate = products?.find(
        (p) => p.productName === product.productName && p.size === newSize
      )?.rate;
      if (foundRate !== undefined) {
        handleProductChange(siteIndex, productIndex, 'rate', foundRate);
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          mb: 2,
        }}
      >
        {/* Product Name Autocomplete */}
        <Box flex={2} sx={{ width: { xs: '100%', md: 220 } }}>
          <Autocomplete
            openOnFocus
            value={product.productName || ''}
            options={productOptions}
            onChange={(event, newValue) => {
              handleProductSelected(newValue);
              setTimeout(() => {
                const sizeField = document.getElementById(`size-${productKey}`);
                sizeField?.focus();
              }, 0);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Product"
                size="small"
                onKeyDown={() => {
                  // pass
                }}
              />
            )}
          />
        </Box>

        {/* Size Autocomplete */}
        <Box flex={1} sx={{ width: { xs: '100%', md: 160 } }}>
          <Autocomplete
            id={`size-${productKey}`}
            openOnFocus
            value={product.size || ''}
            options={sizeOptions}
            disabled={!product.productName}
            onChange={(event, newValue) => {
              handleSizeSelected(newValue);
              setTimeout(() => {
                document.getElementById(`rate-${productKey}`)?.focus();
              }, 0);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Size"
                size="small"
                onKeyDown={() => {
                  // pass
                }}
              />
            )}
          />
        </Box>
      </Box>
    );
  };

  // --------------------------------------------------
  //     SITE ADD/EDIT Inline Form
  // --------------------------------------------------
  const handleAddSiteFormOpen = () => {
    setEditingSiteIndex(null);
    setTempSite({
      siteName: '',
      siteAddress: '',
      supervisorName: '',
      supervisorNumber: '',
      challanNumber: `S${(formData.sites?.length ?? 0) + 1}C1`,
      prizefix: [{ productName: '', size: '', rate: 0 }],
    });
    setShowSiteForm(true);
  };

  const handleEditSite = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSiteIndex(index);
    setTempSite({ ...formData.sites![index] });
    setShowSiteForm(true);
  };

  const handleSiteFormCancel = () => {
    setEditingSiteIndex(null);
    setTempSite(initialSite);
    setShowSiteForm(false);
  };

  const handleSiteFormSave = () => {
    if (editingSiteIndex === null) {
      // ADD a brand new site
      const count = formData.sites?.length || 0;
      setFormData((prev) => ({
        ...prev,
        sites: [...(prev.sites || []), tempSite],
      }));
      setSelectedSiteIndex(count);
    } else {
      // EDIT existing site
      setFormData((prev) => {
        const updatedSites = [...(prev.sites || [])];
        updatedSites[editingSiteIndex] = { ...tempSite };
        return { ...prev, sites: updatedSites };
      });
      setSelectedSiteIndex(editingSiteIndex);
    }
    // Reset form
    setEditingSiteIndex(null);
    setTempSite(initialSite);
    setShowSiteForm(false);
  };

  const handleSiteFieldChange = (field: keyof ISite, value: string) => {
    setTempSite((prev) => ({ ...prev, [field]: value }));
  };

  // --------------------------------------------------
  //            SITE LIST + Add/Edit Inline
  // --------------------------------------------------
  const removeSite = (index: number) => {
    if (formData.sites?.length === 1) return; // maybe prevent removing last
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.filter((_, i) => i !== index),
    }));
    setSelectedSiteIndex(Math.max(0, index - 1));
  };

  const renderSiteSelection = () => (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mt: 3,
        backgroundColor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Project Sites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your construction sites and their details
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSiteFormOpen}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            borderRadius: 2,
            px: 3,
            py: 1,
          }}
        >
          Add Site
        </Button>
      </Box>

      {/* Updated Sites Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3,
          mb: 2,
        }}
      >
        {formData.sites?.map((site, index) => (
          <Card
            key={index}
            onClick={() => setSelectedSiteIndex(index)}
            sx={{
              cursor: 'pointer',
              border: '2px solid',
              borderColor: selectedSiteIndex === index ? 'primary.main' : 'divider',
              backgroundColor: selectedSiteIndex === index ? 'primary.lighter' : 'white',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              {/* Header with Actions */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: selectedSiteIndex === index ? 'primary.main' : 'text.primary',
                    maxWidth: '70%',
                  }}
                >
                  {site.siteName || `Site ${index + 1}`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={(e) => handleEditSite(index, e)}
                    size="small"
                    sx={{
                      color: 'primary.main',
                      bgcolor: 'primary.50',
                      '&:hover': { bgcolor: 'primary.100' },
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
                      bgcolor: 'error.50',
                      '&:hover': { bgcolor: 'error.100' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Site Details */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 1.5,
                  }}
                >
                  {site.siteAddress || 'No address provided'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${site.prizefix?.length || 0} Products`}
                    size="small"
                    sx={{
                      bgcolor: 'success.lighter',
                      color: 'success.dark',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={site.challanNumber}
                    size="small"
                    sx={{
                      bgcolor: 'info.lighter',
                      color: 'info.dark',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>

              {/* Supervisor Info */}
              <Box
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  pt: 1.5,
                  mt: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SupervisorAccountIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {site.supervisorName || 'No supervisor'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {site.supervisorNumber || '-'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>

            {/* Selection Indicator */}
            {selectedSiteIndex === index && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  width: 12,
                  height: 12,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  boxShadow: 2,
                }}
              />
            )}
          </Card>
        ))}
      </Box>

      {/* Add/Edit Site Form (keep existing implementation) */}
      {/* {showSiteForm && (
        // ... (keep existing form implementation same)
      )} */}

      {/* Empty State */}
      {formData.sites?.length === 0 && !showSiteForm && (
        <Box
          sx={{
            textAlign: 'center',
            p: 4,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            backgroundColor: 'background.default',
          }}
        >
          <Box sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}>🏗️</Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Sites Added
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get started by adding your first project site
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSiteFormOpen}
            sx={{ borderRadius: 2 }}
          >
            Add Site
          </Button>
        </Box>
      )}
    </Paper>
  );

  // Show the product lines for whichever site is selected
  const renderProductsForSite = () => {
    const currentSite = formData.sites?.[selectedSiteIndex];
    if (!currentSite) return null;

    return (
      <Paper
        sx={{
          p: 3,
          mt: 3,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          background: 'white',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Products for {currentSite.siteName || 'Selected Site'}
          </Typography>
          <Button
            onClick={() => addProduct(selectedSiteIndex)}
            variant="contained"
            startIcon={<AddIcon />}
            id="add-product-btn"
            sx={{
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
              borderRadius: '8px',
              px: 3,
              py: 1,
            }}
          >
            Add Product
          </Button>
        </Box>

        <Stack spacing={3}>
          {currentSite.prizefix?.map((prod, productIndex) => {
            const productKey = `${selectedSiteIndex}_${productIndex}`;
            return (
              <Paper
                key={productKey}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  background: '#f8f9fa',
                  position: 'relative',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <Box flex={2} sx={{ width: '100%' }}>
                    {productInput(selectedSiteIndex, productIndex, prod)}
                  </Box>
                  <Box flex={1}>
                    <FormInput
                      label="Rate"
                      name="rate"
                      type="number"
                      value={prod.rate?.toString()}
                      id={`rate-${productKey}`}
                      onChange={(e) =>
                        handleProductChange(
                          selectedSiteIndex,
                          productIndex,
                          'rate',
                          Number(e.target.value)
                        )
                      }
                      sx={{
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
                          pr: 2,
                        },
                      }}
                    />
                  </Box>
                  <IconButton
                    id={`delete-${productKey}`}
                    onClick={() => removeProduct(selectedSiteIndex, productIndex)}
                    sx={{
                      color: 'error.main',
                      position: { xs: 'absolute', md: 'static' },
                      top: 8,
                      right: 8,
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Paper>
    );
  };

  // --------------------------------------------------
  //            TABLE COLUMNS
  // --------------------------------------------------
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
      ),
    },
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'customerName', headerName: 'Customer Name', width: 130 },
    { field: 'mobileNumber', headerName: 'Mobile Number', width: 130 },
    { field: 'partnerName', headerName: 'Partner Name', width: 130 },
    { field: 'partnerMobileNumber', headerName: 'Partner Mobile', width: 130 },
    { field: 'reference', headerName: 'Reference', width: 130 },
    { field: 'referenceMobileNumber', headerName: 'Ref Mobile', width: 130 },
    { field: 'residentAddress', headerName: 'Address', width: 130 },
    { field: 'aadharNo', headerName: 'Aadhar No', width: 130 },
    { field: 'pancardNo', headerName: 'Pancard No', width: 130 },
    { field: 'GSTnumber', headerName: 'GST Number', width: 130 },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <EditIcon
            fontSize="small"
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
      ),
    },
  ];

  // --------------------------------------------------
  //           RENDER COMPONENT
  // --------------------------------------------------
  return (
    <Box sx={{ p: 2 }}>
      <Button
        ref={addButtonRef}
        fullWidth
        variant="contained"
        sx={{
          bgcolor: 'var(--primary-color)',
          color: 'var(--text-light)',
          mb: 2,
          '&:hover': {
            bgcolor: 'var(--primary-light)',
            color: 'var(--text-light)',
          },
          '&:focus': {
            outline: '2px solid var(--primary-color)',
            outlineOffset: '2px',
          },
        }}
        onClick={() => {
          setIsEditMode(false);
          setFormData(initialFormData);
          setOpen(true);
          inputRef.current?.focus();
        }}
        autoFocus
      >
        <PersonAddAltIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        Add new Customer
      </Button>

      {/* Main Modal for Add/Edit Customer */}
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
        <Box sx={modalStyle}>
          <Typography
            id="modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 3, color: 'var(--primary-dark)' }}
          >
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {/* First Row */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box flex={1} sx={{ position: 'relative', display: 'flex', width: '100%' }}>
                    <TextField
                      inputRef={formFirstInputRef}
                      label="Customer Name"
                      value={formData.customerName}
                      onChange={handleCustomerSearchChange}
                      fullWidth
                      required
                      variant="outlined"
                      size="small"
                      autoComplete="off"
                      autoFocus
                      onFocus={() => {
                        if (searchQuery !== '') {
                          fetchCustomersDebounced('');
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '4px',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--primary-color)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--primary-color)',
                          },
                        },
                      }}
                    />
                    {customersFound.length > 0 && (
                      <Paper
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 10,
                          mt: 0.5,
                          maxHeight: 200,
                          border: '2px solid var(--primary-color)',
                          overflowY: 'auto',
                          backgroundColor: 'var(--surface-light)',
                        }}
                      >
                        {customersFound.map((c) => (
                          <Box
                            key={c._id}
                            sx={{
                              p: 1,
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'lightgray' },
                            }}
                            onClick={() => handleCustomerSelect(c)}
                          >
                            {c.customerName}
                          </Box>
                        ))}
                      </Paper>
                    )}
                  </Box>

                  <Box flex={1}>
                    <FormInput
                      name="mobileNumber"
                      label="Mobile Number"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      validate={validateMobile}
                      type="tel"
                      required
                    />
                  </Box>

                  <Box flex={1}>
                    <FormInput
                      name="GSTnumber"
                      label="GST Number"
                      value={formData.GSTnumber}
                      onChange={handleChange}
                      validate={validateGST}
                    />
                  </Box>
                </Stack>

                {/* Second Row */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box flex={1}>
                    <FormInput
                      name="partnerName"
                      label="Partner Name"
                      value={formData.partnerName}
                      onChange={handleChange}
                    />
                  </Box>
                  <Box flex={1}>
                    <FormInput
                      name="partnerMobileNumber"
                      label="Partner Mobile Number"
                      value={formData.partnerMobileNumber}
                      onChange={handleChange}
                      validate={validateMobile}
                      type="tel"
                    />
                  </Box>
                  <Box flex={1}>
                    <FormInput
                      name="residentAddress"
                      label="Resident Address"
                      value={formData.residentAddress}
                      onChange={handleChange}
                    />
                  </Box>
                </Stack>

                {/* Third Row */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box flex={1}>
                    <FormInput
                      name="reference"
                      label="Reference"
                      value={formData.reference}
                      onChange={handleChange}
                    />
                  </Box>
                  <Box flex={1}>
                    <FormInput
                      name="referenceMobileNumber"
                      label="Reference Mobile Number"
                      value={formData.referenceMobileNumber}
                      onChange={handleChange}
                      validate={validateMobile}
                      type="tel"
                    />
                  </Box>
                  <Box flex={1}>
                    <FormInput
                      name="aadharNo"
                      label="Aadhar No"
                      value={formData.aadharNo}
                      onChange={handleChange}
                    />
                  </Box>
                  <Box flex={1}>
                    <FormInput
                      name="pancardNo"
                      label="Pan Card No"
                      value={formData.pancardNo}
                      onChange={handleChange}
                    />
                  </Box>
                </Stack>

                {/* Photos row */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                  <PhotoUploadButton
                    field="aadharPhoto"
                    icon={<AddAPhotoIcon />}
                    label="Aadhar Photo"
                  />
                  <PhotoUploadButton
                    field="panCardPhoto"
                    icon={<CreditCardIcon />}
                    label="Pan Card Photo"
                  />
                  <PhotoUploadButton
                    field="customerPhoto"
                    icon={<PersonIcon />}
                    label="Customer Photo"
                  />
                </Stack>

                {/* Sites + Products */}
                {renderSiteSelection()}
                {renderProductsForSite()}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button
                    onClick={handleClose}
                    variant="contained"
                    sx={{ bgcolor: 'var(--error-color)', color: 'white' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: 'var(--primary-color)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'var(--primary-light)',
                      },
                    }}
                  >
                    {isEditMode ? 'Update Customer' : 'Save Customer'}
                  </Button>
                </Stack>
              </Stack>
            </Form>
          </LocalizationProvider>
        </Box>
      </Modal>

      {/* Confirm Delete Dialog */}
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

      {/* Detail Panel */}
      <DetailPanelDialog />

      {/* DataGrid of all customers */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          ref={gridRef}
          rows={customer}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          getRowId={(row: any) => row._id}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
          slots={{
            toolbar: CustomToolbar,
            loadingOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            ),
          }}
          filterModel={gridFilterModel}
          onFilterModelChange={(model) => setGridFilterModel(model)}
          onColumnVisibilityModelChange={(newModel) => {
            setColumnVisibility(newModel);
          }}
          disableColumnFilter={false}
          disableDensitySelector={true}
          disableColumnSelector={false}
        />
      </Paper>
    </Box>
  );
};

export default Customer;