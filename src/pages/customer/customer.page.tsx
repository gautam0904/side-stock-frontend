import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Grid,
  TextField,
  debounce,
  Card,
  CardContent
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridFilterModel,
  GridLogicOperator
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
import {
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';
import { SelectChangeEvent } from '@mui/material';
import { styled } from '@mui/material/styles';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { useLocation } from 'react-router-dom';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
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
  sites: [
    {
      prizefix: [
        {
          size: '',
          productName: '',
          rate: 0,
        },
      ],
      supervisorName: '',
      supervisorNumber: '',
      siteName: '',
      siteAddress: '',
      challanNumber: 'S1C0',
    },
  ],
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
  overflowY: 'auto'
};

// Add styled components
const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'light' ? '#E0E3E7' : '#2D3843',
  },
  '& .MuiSelect-select': {
    padding: '8px 14px',
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#1A2027',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '& .MuiSelect-icon': {
    color: theme.palette.primary.main,
  }
}));

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

  const [productOptions, setProductOptions] = useState<Array<{ name: string; sizes: string[] }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<ICutomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICutomer | null>(null);

  const [products, setProducts] = useState<IProducts[] | null>(null);

  // For site selection
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(0);

  // For adding new site in dialog
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');

  // Inline Site Add/Edit
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editingSiteIndex, setEditingSiteIndex] = useState<number | null>(null);
  const [tempSite, setTempSite] = useState<ISite>(initialSite);

  // --- Focus Maps for the Product Name and Size selects ---
  const [openProductNameSelect, setOpenProductNameSelect] = useState<{ [key: string]: boolean }>({});
  const [openProductSizeSelect, setOpenProductSizeSelect] = useState<{ [key: string]: boolean }>({});

  // Handler to open/close the 'productName' select
  const handleProductNameFocus = (siteIndex: number, productIndex: number) => {
    const key = `${siteIndex}-${productIndex}`;
    setOpenProductNameSelect((prev) => ({
      ...prev,
      [key]: true,
    }));
  };
  const handleProductNameClose = (siteIndex: number, productIndex: number) => {
    const key = `${siteIndex}-${productIndex}`;
    setOpenProductNameSelect((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  // Handler to open/close the 'size' select
  const handleProductSizeFocus = (siteIndex: number, productIndex: number) => {
    const key = `${siteIndex}-${productIndex}`;
    setOpenProductSizeSelect((prev) => ({
      ...prev,
      [key]: true,
    }));
  };
  const handleProductSizeClose = (siteIndex: number, productIndex: number) => {
    const key = `${siteIndex}-${productIndex}`;
    setOpenProductSizeSelect((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

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
      )
    }
  ];

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
      toast.error(error.response?.data?.message || 'Failed to fetch purchases');
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

  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  // --------------- Autocomplete search for "Customer Name" ---------------
  const handleCustomerSearchChange = (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchCustomersByName(query);
  };

  const fetchCustomersByName = debounce(async (query) => {
    if (query) {
      try {
        const response = await customerService.getCustomerByName(query);
        const data = await response.data.customers;
        if (data.length === 0) {
          handleCustomerSelect({
            customerName: query.toString(),
            mobileNumber: ''
          });
        }
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    } else {
      setCustomers([]);
    }
  }, 500);

  const handleCustomerSelect = (customer: ICutomer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.customerName as string);
    setCustomers([]);

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        customerName: customer.customerName || '',
        customerId: customer._id || '',
        mobileNumber: customer.mobileNumber || ''
      };
      if (customer.sites?.length && updatedForm.sites) {
        updatedForm.sites[0].siteName = customer?.sites?.[0].siteName || '';
        updatedForm.sites[0].siteAddress = customer?.sites?.[0].siteAddress || '';
        updatedForm.sites[0].challanNumber = customer?.sites?.[0]?.challanNumber || 'S0C1';
      }
      return updatedForm;
    });
  };

  // --------------- GST fetch ---------------
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
          status: data.data.sts || ''
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
            supplierName: gstDetails.legalName || ''
          }));
          toast.success('GST details fetched successfully');
        } else {
          toast.error('Could not fetch GST details');
        }
      } catch (error: any) {
        toast.error(error.message || 'Error fetching GST details');
        console.error('GST fetch error:', error);
      } finally {
        setLoading(false);
      }
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue
      }));
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

  // --------------- Add / Update Customer ---------------
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

      // Append other fields
      Object.keys(formData).forEach((key) => {
        if (key === 'aadharPhoto' || key === 'panCardPhoto' || key === 'customerPhoto') {
          return; // skip, already appended
        }
        const value = formData[key as keyof ICutomer];
        if (key === 'prizefix' || key === 'sites') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, String(value));
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
    setFormData(cust);
    setIsEditMode(true);
    setOpen(true);
  };

  // --------------- Toolbar & Export ---------------
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
                backgroundColor: 'var(--primary-color)',
              }
            }}
          >
            Export PDF
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  };

  // --------------- PDF Export ---------------
  const downloadPDF = (visibleColumns: any[]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(123, 78, 255);
    doc.text('Purchase List', 14, 15);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = visibleColumns.map((col) => col.headerName);
    const keys = visibleColumns.map((col) => col.field);

    const tableData = customer.map((purchase: any) =>
      keys.map((key) => {
        switch (key) {
          case 'amount':
          case 'totalAmount':
          case 'sgst':
          case 'cgst':
          case 'igst':
            const value = purchase[key] || 0;
            return { content: Number(value).toFixed(2), styles: { halign: 'right' } };
          case 'date':
            return new Date(purchase[key]).toLocaleDateString('en-GB');
          default:
            return purchase[key]?.toString() || '';
        }
      })
    );

    const calculateRowsPerPage = (firstPageData: any[]) => {
      const testTable = doc.autoTable({
        head: [headers],
        body: [firstPageData[0]],
        startY: 25,
        styles: {
          fontSize: 9,
          cellPadding: { left: 4, right: 4, top: 2, bottom: 2 },
          lineWidth: 0
        }
      });

      const pageHeight = doc.internal.pageSize.height;
      const tableRowHeight = (testTable as any).lastAutoTable.finalY - 25;
      const availableHeight = pageHeight - 20;
      return Math.floor(availableHeight / tableRowHeight);
    };

    const rowsPerPage = calculateRowsPerPage(tableData);
    const pages = [];
    for (let i = 0; i < tableData.length; i += rowsPerPage) {
      pages.push(tableData.slice(i, i + rowsPerPage));
    }

    let startY = 25;
    pages.forEach((pageData, pageIndex) => {
      doc.autoTable({
        head: [headers],
        body: pageData,
        startY,
        styles: {
          fontSize: 9,
          cellPadding: { left: 4, right: 4, top: 2, bottom: 2 },
          lineWidth: 0
        },
        headStyles: {
          fillColor: [123, 78, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        }
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
      if (pageIndex < pages.length - 1) {
        doc.addPage();
        startY = 25;
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 15, {
        align: 'center'
      });
    }

    doc.save('purchases-list.pdf');
  };

  // --------------- Fetch Products ---------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        setProducts(response.data.products);
        const groupedProducts = response.data.products.reduce(
          (acc: any[], product: any) => {
            const existing = acc.find((p) => p.name === product.productName);
            if (existing) {
              if (!existing.sizes.includes(product.size)) {
                existing.sizes.push(product.size);
              }
            } else {
              acc.push({ name: product.productName, sizes: [product.size] });
            }
            return acc;
          },
          []
        );
        setProductOptions(groupedProducts);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };
    fetchProducts();
  }, []);

  // --------------- Detail Panel Popup ---------------
  const DetailPanelDialog = () => {
    const selectedCustomerData = customer.find((p) => p._id == selectedProductIndex?.toString());
    if (!selectedCustomerData) return null;

    return (
      <Dialog open={productPopupOpen} onClose={() => setProductPopupOpen(false)} maxWidth="md" fullWidth>
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
                  {selectedCustomerData?.sites?.map((site, index) => (
                    <TableRow key={index}>
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
                    alt="Customer Photo"
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
                    alt="Pancard Photo"
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
                    alt="Customer Photo"
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

  const PhotoUploadButton = ({
    field,
    icon,
    label
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
            bgcolor: '#7b4eff',
            color: 'white',
            '&:hover': {
              bgcolor: '#6a3dd9'
            }
          }}
        >
          {label}
        </Button>
      </label>
    </Box>
  );

  // --------------- Product Management ---------------
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
              prizefix: site.prizefix.map((product, j) =>
                j === productIndex ? { ...product, [field]: value } : product
              )
            }
          : site
      )
    }));
  };

  const addProduct = (siteIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.map((site, i) =>
        i === siteIndex
          ? {
              ...site,
              prizefix: [...site.prizefix, { productName: '', size: '', rate: 0 }]
            }
          : site
      )
    }));
  };

  const removeProduct = (siteIndex: number, productIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.map((site, i) =>
        i === siteIndex
          ? {
              ...site,
              prizefix: site.prizefix.filter((_, j) => j !== productIndex)
            }
          : site
      )
    }));
  };

  // --------------- Site Management ---------------
  const removeSite = (index: number) => {
    if (formData.sites?.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      sites: prev.sites?.filter((_, i) => i !== index)
    }));
    setSelectedSiteIndex(Math.max(0, index - 1));
  };

  const handleSiteChange = (index: number, field: keyof ISite, value: string) => {
    setFormData((prev) => {
      const currentSites = Array.isArray(prev.sites) ? prev.sites : [initialSite];
      const newSites = [...currentSites];
      newSites[index] = {
        ...newSites[index],
        [field]: value
      };
      return {
        ...prev,
        sites: newSites
      };
    });
  };

  const handleCloseSiteDialog = useCallback(() => {
    setSiteDialogOpen(false);
  }, []);

  const addSite = useCallback(
    (name: string, address: string, supervisorNumber: string, supervisorName: string) => {
      setFormData((prev) => {
        const siteCount = prev.sites?.length || 0;
        const newSite: ISite = {
          siteName: name.trim(),
          siteAddress: address.trim(),
          supervisorName: supervisorName.trim(),
          supervisorNumber: supervisorNumber.trim(),
          challanNumber: `S${siteCount + 1}C${Math.floor(Math.random() * 1000)}`,
          prizefix: []
        };

        return {
          ...prev,
          sites: [...(prev.sites || []), newSite]
        };
      });
      setNewSiteName('');
      setNewSiteAddress('');
    },
    []
  );

  // Add/Edit site form
  const handleAddSiteFormOpen = () => {
    // Instead of a separate Dialog, we show inline form
    setEditingSiteIndex(null);
    setTempSite(initialSite);
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
      // ADD new site
      const count = formData.sites?.length || 0;
      setFormData((prev) => ({
        ...prev,
        sites: [...(prev.sites || []), tempSite]
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
    // reset
    setEditingSiteIndex(null);
    setTempSite(initialSite);
    setShowSiteForm(false);
  };

  // Renders the "Add/Edit" site cards
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
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
            Project Sites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all your project locations
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

      {/* Existing sites as cards */}
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
        {formData.sites?.map((site, index) => (
          <Card
            key={index}
            onClick={() => setSelectedSiteIndex(index)}
            sx={{
              cursor: 'pointer',
              border: '1px solid',
              borderColor: selectedSiteIndex === index ? 'primary.main' : 'divider',
              backgroundColor: selectedSiteIndex === index ? 'primary.lighter' : 'white',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                borderColor: 'primary.main'
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
                      color: selectedSiteIndex === index ? 'primary.main' : 'text.primary',
                      mb: 0.5
                    }}
                  >
                    {site.siteName || `Site ${index + 1}`}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
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

              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}
                >
                  {site.prizefix?.length || 0} Products
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'success.lighter',
                    color: 'success.main',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}
                >
                  {site.challanNumber}
                </Typography>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>
                  Supervisor: <strong>{site.supervisorName || '-'}</strong>
                </Typography>
                <Typography variant="caption">
                  Number: <strong>{site.supervisorNumber || '-'}</strong>
                </Typography>
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
          <Stack spacing={2}>
            <TextField
              label="Site Name"
              value={tempSite.siteName}
              onChange={(e) => setTempSite((prev) => ({ ...prev, siteName: e.target.value }))}
            />
            <TextField
              label="Site Address"
              value={tempSite.siteAddress}
              onChange={(e) => setTempSite((prev) => ({ ...prev, siteAddress: e.target.value }))}
            />
            <TextField
              label="Supervisor Name"
              value={tempSite.supervisorName}
              onChange={(e) => setTempSite((prev) => ({ ...prev, supervisorName: e.target.value }))}
            />
            <TextField
              label="Supervisor Number"
              value={tempSite.supervisorNumber}
              onChange={(e) => setTempSite((prev) => ({ ...prev, supervisorNumber: e.target.value }))}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" onClick={handleSiteFormCancel}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (editingSiteIndex === null) {
                    // add new site
                    setFormData((prev) => {
                      const siteCount = prev.sites?.length || 0;
                      const newSite: ISite = {
                        ...tempSite,
                        challanNumber: `S${siteCount + 1}C${Math.floor(Math.random() * 1000)}`,
                        prizefix: tempSite.prizefix || []
                      };
                      return {
                        ...prev,
                        sites: [...(prev.sites || []), newSite]
                      };
                    });
                    setSelectedSiteIndex((formData.sites?.length ?? 0));
                  } else {
                    // edit existing site
                    setFormData((prev) => {
                      const updatedSites = [...(prev.sites || [])];
                      updatedSites[editingSiteIndex] = { ...tempSite };
                      return { ...prev, sites: updatedSites };
                    });
                    setSelectedSiteIndex(editingSiteIndex);
                  }
                  setShowSiteForm(false);
                }}
              >
                Save Site
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* If no sites exist */}
      {formData.sites?.length === 0 && !showSiteForm && (
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

  // --------------- Render the product list for the currently selected site ---------------
// const renderProductsForSite = () => {
//     const currentSite = formData.sites?.[selectedSiteIndex];
//     if (!currentSite) return null;
  
//     return (
//       <Paper sx={{ p: 3, mt: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', background: 'white' }}>
//         <Stack spacing={3}>
//           {currentSite.prizefix?.map((prod, productIndex) => {
//             const productKey = `${selectedSiteIndex}-${productIndex}`;
  
//             return (
//               <Paper
//                 key={productKey}
//                 sx={{
//                   p: 2,
//                   border: '1px solid',
//                   borderColor: 'divider',
//                   borderRadius: '8px',
//                   background: '#f8f9fa',
//                   position: 'relative'
//                 }}
//               >
//                 <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
//                   {/* PRODUCT NAME SELECT */}
                
//                   <Box flex={2}>
//                   <StyledSelect
//   fullWidth
//   value={prod.productName || ''}
//   // 1) Use your existing focus approach:
//   onFocus={() => handleProductNameFocus(selectedSiteIndex, productIndex)}

//   // 2) "open" is controlled by your local openProductNameSelect state:
//   open={openProductNameSelect[productKey] || false}

//   // 3) Always close on onClose:
//   onClose={() => {
//     // Just always close
//     handleProductNameClose(selectedSiteIndex, productIndex);
//   }}

//   // 4) In onChange, immediately close the menu
//   onChange={(e: SelectChangeEvent<unknown>) => {
//     const newValue = e.target.value as string;

//     // update state
//     handleProductChange(selectedSiteIndex, productIndex, 'productName', newValue);
//     handleProductChange(selectedSiteIndex, productIndex, 'size', '');

//     // forcibly close the menu
//     handleProductNameClose(selectedSiteIndex, productIndex);

//     // then focus the size field after a short delay
//     setTimeout(() => {
//       const sizeField = document.getElementById(`size-${productKey}`);
//       sizeField?.focus();
//     }, 100);
//   }}

//   displayEmpty
//   renderValue={(value) => (value as string) || 'Select Product'}
//   size="small"
//   MenuProps={{
//     keepMounted: true,
//     // You can also disable scroll locking if needed:
//     disableScrollLock: true
//   }}
// >
//   <MenuItem disabled value="">
//     <em>Select Product</em>
//   </MenuItem>
//   {productOptions.map((option) => (
//     <MenuItem key={option.name} value={option.name}>
//       {option.name}
//     </MenuItem>
//   ))}
// </StyledSelect>

// </Box>
  
//                   {/* SIZE SELECT */}
//                   <Box flex={1}>
//                     <StyledSelect
//                       fullWidth
//                       id={`size-${productKey}`}
//                       value={prod.size || ''}
//                       onFocus={() => handleProductSizeFocus(selectedSiteIndex, productIndex)}
//                       open={openProductSizeSelect[productKey] || false}
//                       onClose={() => {
//                         // Only close if a value has been selected
//                         if (prod.size) {
//                           handleProductSizeClose(selectedSiteIndex, productIndex);
//                         }
//                       }}
//                       onChange={(e) => {
//                         const newSize = e.target.value as string;
//                         handleProductChange(selectedSiteIndex, productIndex, 'size', newSize);
//                         const selectedRate = products?.find(
//                           (p) => p.productName === prod.productName && p.size === newSize
//                         )?.rate;
//                         handleProductChange(selectedSiteIndex, productIndex, 'rate', selectedRate || 0);
                        
//                         // Close dropdown after selection
//                         handleProductSizeClose(selectedSiteIndex, productIndex);
                        
//                         // Focus rate field
//                           setTimeout(() => {
//                           const rateField = document.getElementById(`rate-${productKey}`);
//                           if (rateField) {
//                             rateField.focus();
//                           }
//                         }, 100);
//                       }}
//                       disabled={!prod.productName}
//                       displayEmpty
//                       renderValue={(value) => (value as string) || 'Select Size'}
//                       size="small"
//                       MenuProps={{
//                         keepMounted: true
//                       }}
//                     >
//                       <MenuItem disabled value="">
//                         <em>Select Size</em>
//                       </MenuItem>
//                       {productOptions
//                         .find((p) => p.name === prod.productName)
//                         ?.sizes.map((size) => (
//                           <MenuItem key={size} value={size}>
//                             {size}
//                           </MenuItem>
//                         ))}
//                     </StyledSelect>
//                   </Box>
  
//                   {/* RATE INPUT */}
//                   <Box flex={1}>
//                     <FormInput
//                       label="Rate"
//                       name="rate"
//                       type="number"
//                       value={prod.rate?.toString()}
//                       id={`rate-${productKey}`} // For auto-focus
//                       onChange={(e) => handleProductChange(selectedSiteIndex, productIndex, 'rate', Number(e.target.value))}
//                       sx={{ '& .MuiInputBase-input': { textAlign: 'right', pr: 2 } }}
//                     />
//                   </Box>
  
//                   {/* DELETE ICON */}
//                   <IconButton
//                     id={`delete-${productKey}`}
//                     onClick={() => removeProduct(selectedSiteIndex, productIndex)}
//                     sx={{
//                       color: 'error.main',
//                       position: { xs: 'absolute', md: 'static' },
//                       top: 8,
//                       right: 8
//                     }}
//                   >
//                     <DeleteIcon />
//                   </IconButton>
//                 </Stack>
//               </Paper>
//             );
//           })}
//         </Stack>
//       </Paper>
//     );
//   };

const renderProductsForSite = () => {
  const currentSite = formData.sites?.[selectedSiteIndex];
  if (!currentSite) return null;

  return (
    <Paper sx={{ p: 3, mt: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', background: 'white' }}>
      <Stack spacing={3}>
        {currentSite.prizefix?.map((prod, productIndex) => {
          const productKey = `${selectedSiteIndex}-${productIndex}`;

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
                  <StyledSelect
                    fullWidth
                    value={prod.productName || ''}
                    onFocus={() => handleProductNameFocus(selectedSiteIndex, productIndex)}
                    open={openProductNameSelect[productKey] || false}
                    onClose={() => {
                      // Always close when user tries to close
                      handleProductNameClose(selectedSiteIndex, productIndex);
                    }}
                    onChange={(e: SelectChangeEvent<unknown>) => {
                      const newValue = e.target.value as string;
                      handleProductChange(selectedSiteIndex, productIndex, 'productName', newValue);
                      handleProductChange(selectedSiteIndex, productIndex, 'size', '');
                      // forcibly close
                      handleProductNameClose(selectedSiteIndex, productIndex);
                      // focus size field after short delay
                      setTimeout(() => {
                        const sizeField = document.getElementById(`size-${productKey}`);
                        sizeField?.focus();
                      }, 100);
                    }}
                    displayEmpty
                    renderValue={(value) => (value as string) || 'Select Product'}
                    size="small"
                    MenuProps={{
                      keepMounted: true,
                      disableScrollLock: true // optional
                    }}
                  >
                    <MenuItem disabled value="">
                      <em>Select Product</em>
                    </MenuItem>
                    {productOptions.map((option) => (
                      <MenuItem key={option.name} value={option.name}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </Box>

                {/* SIZE SELECT */}
                <Box flex={1}>
                  <StyledSelect
                    fullWidth
                    id={`size-${productKey}`}
                    value={prod.size || ''}
                    onFocus={() => handleProductSizeFocus(selectedSiteIndex, productIndex)}
                    open={openProductSizeSelect[productKey] || false}
                    onClose={() => {
                      // Always close
                      handleProductSizeClose(selectedSiteIndex, productIndex);
                    }}
                    onChange={(e) => {
                      const newSize = e.target.value as string;
                      handleProductChange(selectedSiteIndex, productIndex, 'size', newSize);
                      // find the matching rate
                      const selectedRate = products?.find(
                        (p) => p.productName === prod.productName && p.size === newSize
                      )?.rate;
                      handleProductChange(selectedSiteIndex, productIndex, 'rate', selectedRate || 0);
                      // forcibly close
                      handleProductSizeClose(selectedSiteIndex, productIndex);
                      // focus rate field after short delay
                      setTimeout(() => {
                        const rateField = document.getElementById(`rate-${productKey}`);
                        rateField?.focus();
                      }, 100);
                    }}
                    disabled={!prod.productName}
                    displayEmpty
                    renderValue={(value) => (value as string) || 'Select Size'}
                    size="small"
                    MenuProps={{
                      keepMounted: true,
                      disableScrollLock: true // optional
                    }}
                  >
                    <MenuItem disabled value="">
                      <em>Select Size</em>
                    </MenuItem>
                    {productOptions
                      .find((p) => p.name === prod.productName)
                      ?.sizes.map((size) => (
                        <MenuItem key={size} value={size}>
                          {size}
                        </MenuItem>
                      ))}
                  </StyledSelect>
                </Box>

                {/* RATE INPUT */}
                <Box flex={1}>
                  <FormInput
                    label="Rate"
                    name="rate"
                    type="number"
                    value={prod.rate?.toString()}
                    id={`rate-${productKey}`}
                    onChange={(e) => handleProductChange(selectedSiteIndex, productIndex, 'rate', Number(e.target.value))}
                    sx={{ '& .MuiInputBase-input': { textAlign: 'right', pr: 2 } }}
                  />
                </Box>

                {/* DELETE ICON */}
                <IconButton
                  id={`delete-${productKey}`}
                  onClick={() => removeProduct(selectedSiteIndex, productIndex)}
                  sx={{
                    color: 'error.main',
                    position: { xs: 'absolute', md: 'static' },
                    top: 8,
                    right: 8
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
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Typography>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* First Row */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1} sx={{ position: 'relative' }}>
                  <TextField
                    autoFocus
                    label="Customer Name"
                    value={searchQuery}
                    className="customer-name-input"
                    onChange={handleCustomerSearchChange}
                    fullWidth
                    required
                    autoComplete="on"
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7b4eff',
                          color: '#7b4eff'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7b4eff',
                          color: '#7b4eff'
                        }
                      }
                    }}
                  />
                  {/* Autocomplete Suggestions */}
                  {customers.length > 0 && (
                    <Paper
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        mt: 1,
                        maxHeight: 200,
                        border: '2px solid var(--primary-color)',
                        borderTop: 'none',
                        overflowY: 'auto',
                        backgroundColor: 'var(--surface-light)'
                      }}
                    >
                      {customers.map((cust) => (
                        <Box
                          key={cust._id}
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'lightgray' }
                          }}
                          onClick={() => handleCustomerSelect(cust)}
                        >
                          {cust.customerName}
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
                    size="small"
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="GSTnumber"
                    label="GST Number"
                    value={formData.GSTnumber}
                    onChange={handleChange}
                    validate={validateGST}
                    size="small"
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
                    size="small"
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
                    size="small"
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="residentAddress"
                    label="Resident Address"
                    value={formData.residentAddress}
                    onChange={handleChange}
                    size="small"
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
                    size="small"
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
                    size="small"
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="aadharNo"
                    label="Aadhar No"
                    value={formData.aadharNo}
                    onChange={handleChange}
                    size="small"
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="pancardNo"
                    label="Pan Card No"
                    value={formData.pancardNo}
                    onChange={handleChange}
                    size="small"
                  />
                </Box>
              </Stack>

              {/* Photo Upload Buttons */}
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

              {/* Sites */}
              {renderSiteSelection()}

              {/* Products for selected site */}
              {renderProductsForSite()}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: '#7b4eff', color: 'white' }}
                >
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
          loading={loading}
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
