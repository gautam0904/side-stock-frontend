import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { challanService } from '../../api/challan.service';
import { productService } from '../../api/product.service';
import { customerService } from '../../api/customer.service';
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
  FormControlLabel,
  Switch
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
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
import { debounce } from 'lodash';
import { ICutomer, ISite } from 'src/DTO/customer.dto';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface IChallan {
  no?: number;
  _id?: string;
  challanNumber: string;
  type: string;
  date: Date;
  custsomerName: string;
  mobileNumber: string;
  siteName: string;
  siteAddress: string;
  products: IProducts[];
  loading: number;
  unloading: number;
  transportCharge: number;
  amount: number;
  totalAmount: number;
  [key: string]: any;
}

const initialProduct: IProducts = {
  date: new Date(),
  productName: '',
  size: '',
  quantity: 0,
  rate: 0,
  amount: 0,
};

const initialFormData: IChallan = {
  challanNumber: '',
  date: new Date(),
  custsomerName: '',
  type: 'Delivery',
  mobileNumber: '',
  siteAddress: '',
  siteName: '',
  products: [{
    _id: '',
    date: new Date(),
    size: '',
    productName: '',
    quantity: 0,
    rate: 0,
    amount: 0
  }],
  transportCharge: 0,
  loading: 0,
  unloading: 0,
  amount: 0,
  totalAmount: 0
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '1200px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '95vh',
  overflowY: 'auto'
} as const;

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

const Challan = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [challan, setChallan] = useState<IChallan[]>([]);
  const [formData, setFormData] = useState<IChallan>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const fetchInProgress = useRef(false);
  const [iscustomGstRates, setIsCustomGstRates] = useState(false);
  const [productPopupOpen, setProductPopupOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: 'and' as GridLogicOperator
  });
  const gridRef = useRef<any>(null);
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const [selectedGSTRate, setSelectedGSTRate] = useState('18');
  const [productOptions, setProductOptions] = useState<{ name: string; sizes: string[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<ICutomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICutomer | null>(null);
  const [sites, setSite] = useState<ISite[]>([]);

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
    { field: 'challenType', headerName: 'Challan Type', width: 130 },
    { field: 'challanNumber', headerName: 'Challan Number', width: 130 },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: (params: any) => {
        try {
          const date = new Date(params);
          return date.toLocaleDateString('en-GB');
        } catch (error) {
          console.error('Date parsing error:', error);
          return params?.value || '';
        }
      }
    },
    { field: 'customerName', headerName: 'Custsomer Name', width: 150 },
    { field: 'mobileNumber', headerName: 'Mobile Number', width: 150 },
    { field: 'siteName', headerName: 'Site Name', width: 130 },
    { field: 'siteAddress', headerName: 'Site Address', width: 130 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      headerAlign: 'right',
      align: 'right',
      valueFormatter: (params: any) => {
        return `₹${params?.toFixed(2)}`
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <EditIcon fontSize="small" onClick={(e) => {
            e.stopPropagation();
            handleEditClick(params.row)
          }} />
          <DeleteIcon fontSize="small" color="error" onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(params.row._id)
          }} />
        </Box>
      )
    }
  ];

  const handleProductChange = (index: number, field: keyof IProducts, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      const updatedProduct = {
        ...newProducts[index],
        [field]: value
      };

      // Immediately calculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        updatedProduct.amount = Number(updatedProduct.quantity || 0) * Number(updatedProduct.rate || 0);
      }

      newProducts[index] = updatedProduct;

      // Calculate totals
      const subTotal = newProducts.reduce((sum, product) => sum + (Number(product.amount) || 0), 0);
      const transportCost = Number(prev.transportCharge || 0);
      const transportCharge = Number(prev.loading) + Number(prev.unloading);
      const baseAmount = subTotal



      return {
        ...prev,
        products: newProducts,
        amount: baseAmount,
        transportCharge,
        totalAmount: Number(baseAmount) + Number(transportCharge)
      };
    });
  };

  const addProduct = () => {
    setFormData(prev => ({
        ...prev,
        products: [...(prev.products || []), {
            productName: '',
            date: new Date(),
            quantity: 0,
            size: '',
            rate: 0,
            amount: 0
        }]
    }));
};

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const fetchChallan = useCallback(async () => {
    if (fetchInProgress.current || loading) return;

    try {
      fetchInProgress.current = true;
      setLoading(true);

      const response = await challanService.getAllChallan({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      const newPurchases = response.data?.products || [];
      const purchasesWithNumbers = newPurchases.map((purchase: any, index: number) => ({
        ...purchase,
        id: purchase._id,
        no: index + 1
      }));

      setChallan(purchasesWithNumbers);
      setShouldFetch(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [loading]);

  // Simplify initial fetch effect
  useEffect(() => {
    if (shouldFetch) {
      fetchChallan();
    }
  }, [shouldFetch, fetchChallan]);

  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  const fetchGSTDetails = async (gstNumber: string) => {
    try {
      // Using a different free GST API
      const response = await fetch(`https://api.gstincheck.co.in/v1/verify/${gstNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '4ff236814d3317fdd0479ca80b1b4cd4'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GST details');
      }

      const data = await response.json();

      // Check if the API call was successful
      if (data && data.success) {
        return {
          legalName: data.data.lgnm || '',  // Legal name
          tradeName: data.data.tradeNam || '',  // Trade name
          status: data.data.sts || ''  // GST status
        };
      } else {
        throw new Error(data.message || 'Failed to fetch GST details');
      }
    } catch (error) {
      console.error('Error fetching GST details:', error);
      return null;
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Convert GST number to uppercase
    const processedValue = name === 'GSTnumber' ? value.toUpperCase() : value;

    // Special handling for GST number
    if (name === 'GSTnumber' && processedValue.length === 15) {
      try {
        setLoading(true);

        // Fetch GST details
        const gstDetails = await fetchGSTDetails(processedValue);

        if (gstDetails) {
          // Check if the GST status is active
          if (gstDetails.status.toLowerCase() !== 'active') {
            toast.error('GST number is not active');
          }

          setFormData(prev => ({
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

      // Continue with existing GST number logic
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: processedValue
        };

        if (processedValue.length >= 2) {
          const isHomeState = processedValue.startsWith('24');
          const currentGSTRate = Number(selectedGSTRate);

          if (!iscustomGstRates) {
            const newSgst = isHomeState ? (prev.amount * (currentGSTRate / 2) / 100) : 0;
            const newCgst = isHomeState ? (prev.amount * (currentGSTRate / 2) / 100) : 0;
            const newIgst = isHomeState ? 0 : (prev.amount * currentGSTRate / 100);

            return {
              ...newFormData,
              amount: prev.amount + (isHomeState ? (newSgst + newCgst) : newIgst)
            };
          }
        }
        return newFormData;
      });
    } else {
      // Original handleChange logic for other fields
      setFormData(prev => ({
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    try {
      setLoading(true);
      if (isEditMode && formData._id) {
        await challanService.updateChallan(formData._id, formData);
        toast.success('Challan updated successfully');
      } else {
        await challanService.addChallan(formData);
        toast.success('Challan added successfully');
      }
      handleClose();
      setShouldFetch(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} Challan`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      await challanService.deleteChallan(customerToDelete);
      toast.success('Challan deleted successfully');

      // Update purchases with recalculated numbers
      setChallan(prevData => {
        const filteredData = prevData.filter((item: IChallan) => item._id !== customerToDelete);
        return filteredData.map((purchase: IChallan, index: number) => ({
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

  const handleEditClick = (purchase: any) => {
    setFormData({
      ...purchase,
      date: new Date(purchase.date).toISOString().split('T')[0]
    });
    setIsEditMode(true);
    setOpen(true);
  };

  const CustomToolbar = () => {
    const handleExport = (type: string) => {
      if (type === 'pdf') {
        const visibleColumns = columns.filter(col => {
          return columnVisibility[col.field] !== false && col.field !== 'actions';
        });
        downloadPDF(visibleColumns);
      }
    };

    return (
      <GridToolbarContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                backgroundColor: 'primary.light',
              }
            }}
          >
            Export PDF
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹ ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const downloadPDF = (visibleColumns: any[]) => {
    const doc = new jsPDF();

    // Add title with styling
    doc.setFontSize(16);
    doc.setTextColor(123, 78, 255);
    doc.text('Purchase List', 14, 15);

    // Add timestamp
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    // Get headers and keys from visible columns
    const headers = visibleColumns.map(col => col.headerName);
    const keys = visibleColumns.map(col => col.field);

    // Prepare the data based on visible columns
    const tableData = challan.map((c: any) =>
      keys.map(key => {
        switch (key) {
          case 'amount':
          case 'totalAmount':
            const value = c[key] || 0;
            return { content: Number(value).toFixed(2), styles: { halign: 'right' } };
          case 'date':
            return new Date(c[key]).toLocaleDateString('en-GB');
          default:
            return c[key]?.toString() || '';
        }
      })
    );

    // Calculate totals for numeric columns
    const totals: { [key: string]: number } = {};
    const numericFields = ['amount', 'totalAmount', 'sgst', 'cgst', 'igst'];

    keys.forEach((key) => {
      if (numericFields.includes(key)) {
        totals[key] = challan.reduce((sum, purchase) => sum + (purchase[key] || 0), 0);
      }
    });

    // Prepare footer row with styled totals
    const footerRow = keys.map((key, index) => {
      if (numericFields.includes(key)) {
        const value = totals[key] || 0;
        return Number(value).toFixed(2);
      }
      if (index === 0) {
        return 'Total';
      }
      return '';
    });

    // Calculate rows per page based on content height
    const calculateRowsPerPage = (firstPageData: any[]) => {
      const testTable = doc.autoTable({
        head: [headers],
        body: [firstPageData[0]],
        startY: 25,
        styles: {
          fontSize: 9,
          cellPadding: { left: 4, right: 4, top: 2, bottom: 2 },
          lineWidth: 0,
        }
      });

      const pageHeight = doc.internal.pageSize.height;
      const tableRowHeight = ((testTable as any).lastAutoTable.finalY - 25) / 1;
      const availableHeight = pageHeight - 20;
      return Math.floor(availableHeight / tableRowHeight);
    };

    // Calculate dynamic rows per page
    const rowsPerPage = calculateRowsPerPage(tableData);

    // Split data into pages using calculated rowsPerPage
    const pages = [];
    for (let i = 0; i < tableData.length; i += rowsPerPage) {
      pages.push(tableData.slice(i, i + rowsPerPage));
    }

    let startY = 25;
    let grandTotals: { [key: string]: number } = {};

    // Process each page
    pages.forEach((pageData, pageIndex) => {
      // Calculate page totals
      const pageTotals: { [key: string]: number } = {};
      keys.forEach((key) => {
        if (numericFields.includes(key)) {
          pageTotals[key] = pageData.reduce((sum, row) => {
            // Extract numeric value from the cell content
            const value = typeof row[keys.indexOf(key)] === 'object'
              ? Number(row[keys.indexOf(key)].content)
              : Number(row[keys.indexOf(key)]);
            return sum + (isNaN(value) ? 0 : value);
          }, 0);
          grandTotals[key] = (grandTotals[key] || 0) + pageTotals[key];
        }
      });

      // Add page data with page totals
      doc.autoTable({
        head: [headers],
        body: pageData,
        foot: [[
          'Page Total',
          ...keys.slice(1).map(key =>
            numericFields.includes(key) ? {
              content: pageTotals[key].toFixed(2),
              styles: { halign: 'right' }
            } : ''
          )
        ]],
        startY: startY,
        styles: {
          fontSize: 9,
          cellPadding: { left: 4, right: 4, top: 2, bottom: 2 },
          lineWidth: 0,
        },
        columnStyles: {
          amount: { halign: 'right' },
          totalAmount: { halign: 'right' }
        },
        headStyles: {
          fillColor: [123, 78, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 11
        }
      });

      startY = (doc as any).lastAutoTable.finalY + 10;

      // Add new page if not the last page
      if (pageIndex < pages.length - 1) {
        doc.addPage();
        startY = 25;
      }
    });

    // Add grand total on the last page
    if (pages.length > 0) {
      doc.autoTable({
        head: [[
          'Grand Total',
          ...keys.slice(1).map(key =>
            numericFields.includes(key) ? grandTotals[key].toFixed(2) : ''
          )
        ]],
        startY: startY + 10,
        styles: {
          fontSize: 11,
          fontStyle: 'bold',
          cellPadding: { left: 8, right: 8, top: 4, bottom: 4 },
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [100, 100, 100],
          textColor: [255, 255, 255]
        }
      });
    }

    // Add page numbers
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

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        // Group products by name with their available sizes
        const groupedProducts = response.data.products.reduce((acc: any[], product: any) => {
          const existing = acc.find(p => p.name === product.productName);
          if (existing) {
            if (!existing.sizes.includes(product.size)) {
              existing.sizes.push(product.size);
            }
          } else {
            acc.push({ name: product.productName, sizes: [product.size] });
          }
          return acc;
        }, []);
        setProductOptions(groupedProducts);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };
    fetchProducts();
  }, []);

  // GST rate options
  const gstOptions = useMemo(() => [
    { label: '5%', sgst: 2.5, cgst: 2.5, igst: 5 },
    { label: '12%', sgst: 6, cgst: 6, igst: 12 },
    { label: '18%', sgst: 9, cgst: 9, igst: 18 },
    { label: '28%', sgst: 14, cgst: 14, igst: 28 },
    { label: 'Custom', sgst: 'custom', cgst: 'custom', igst: 'custom' }
  ], []);

  // Add custom product selection dialog
  const DetailPanelDialog = () => {
    const selectedPurchase = challan.find(p => p._id == selectedProductIndex?.toString());

    if (!selectedPurchase) return null;

    return (
      <Dialog
        open={productPopupOpen}
        onClose={() => setProductPopupOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Challan Details</DialogTitle>
        <DialogContent>
          {/* Basic Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom> Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Challan Type:</Typography>
                <Typography>{selectedPurchase.challenType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Challan Number:</Typography>
                <Typography>{selectedPurchase.challanNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Date:</Typography>
                <Typography>{new Date(selectedPurchase.date).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Customer Name:</Typography>
                <Typography>{selectedPurchase.companyName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Mobile Number:</Typography>
                <Typography>{selectedPurchase.mobileNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Site Name:</Typography>
                <Typography>{selectedPurchase.siteName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Site Address:</Typography>
                <Typography>{selectedPurchase.siteAddress}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Loading:</Typography>
                <Typography>{selectedPurchase.loading}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Unloading:</Typography>
                <Typography>{selectedPurchase.unloading}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Transport Charge:</Typography>
                <Typography>{selectedPurchase.transportCharge}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Amount:</Typography>
                <Typography>{selectedPurchase.amount}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
                <Typography>{selectedPurchase.totalAmount}</Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Products Table */}
          <Typography variant="subtitle1" gutterBottom>Products</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedPurchase.products?.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{product.date ? new Date(product.date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell align="right">{product.quantity}</TableCell>
                    <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{product.amount?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductPopupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Modify the product input section in the form
  const productInput = (index: number, product: IProducts) => (
    <Box sx={{
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      flexDirection: { xs: 'column', md: 'row' },
      width: '100%',
      mb: 2
    }}>
      <Box flex={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
        <StyledSelect
          fullWidth
          value={product.productName || ''}
          onChange={(e: SelectChangeEvent<unknown>) => {
            handleProductChange(index, 'productName', e.target.value);
            handleProductChange(index, 'size', '');
          }}
          displayEmpty
          renderValue={(value) => (value as string) || 'Select Product'}
          sx={{ minWidth: { xs: '100%', md: 200 } }}
        >
          <MenuItem disabled value="">
            <em>Select Product</em>
          </MenuItem>
          {productOptions?.map((option) => (
            <MenuItem
              key={option.name}
              value={option.name}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                }
              }}
            >
              {option.name}
            </MenuItem>
          ))}
        </StyledSelect>
      </Box>
      <Box flex={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
        <StyledSelect
          fullWidth
          value={product.size || ''}
          onChange={(e) => handleProductChange(index, 'size', e.target.value)}
          disabled={!product.productName}
          displayEmpty
          renderValue={(value: unknown) => (value as string) || 'Select Size'}
          sx={{ minWidth: { xs: '100%', md: 150 } }}
        >
          <MenuItem disabled value="">
            <em>Select Size</em>
          </MenuItem>
          {productOptions
            .find(p => p.name === product.productName)
            ?.sizes.map((size) => (
              <MenuItem
                key={size}
                value={size}
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                {size}
              </MenuItem>
            ))}
        </StyledSelect>
      </Box>
    </Box>
  );
  // const addSite = () => {
  //   setFormData(prev => ({
  //     ...prev,
  //     sites: Array.isArray(prev.sites) ? [...prev.sites, initialSite] : [initialSite]
  //   }));
  // };

  // const removeSite = (index: number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     sites: Array.isArray(prev.sites) 
  //       ? prev.sites.filter((_, i) => i !== index)
  //       : [initialSite]
  //   }));
  // };

  // const handleSiteChange = (index: number, field: keyof ISite, value: string) => {
  //   setFormData(prev => {
  //     const currentSites = Array.isArray(prev.sites) ? prev.sites : [initialSite];
  //     const newSites = [...currentSites];
  //     newSites[index] = {
  //       ...newSites[index],
  //       [field]: value
  //     };
  //     return {
  //       ...prev,
  //       sites: newSites
  //     };
  //   });
  // };

  // Add this configuration object
  const filterOperators = {
    string: [
      {
        label: 'contains',
        value: 'contains',
        getApplyFilterFn: (filterItem: any) => {
          if (!filterItem.value) {
            return null;
          }
          return (params: any) => {
            const cellValue = params.value?.toString().toLowerCase() || '';
            const filterValue = filterItem.value.toString().toLowerCase() || '';
            return cellValue.includes(filterValue);
          };
        },
      },
    ],
    number: [
      {
        label: 'contains',
        value: 'contains',
        getApplyFilterFn: (filterItem: any) => {
          if (!filterItem.value) {
            return null;
          }
          return (params: any) => {
            const cellValue = params.value?.toString() || '';
            const filterValue = filterItem.value.toString() || '';
            return cellValue.includes(filterValue);
          };
        },
      },
    ],
  };

  const fetchCustomers = debounce(async (query) => {
    if (query) {
      try {
        const response = await customerService.getCustomerByName(query);
        const data = await response.data.customers;
        setCustomers(data);
        console.log(data);

      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    } else {
      setCustomers([]);
    }
  }, 500);

  const handleCustomerSearchChange = (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchCustomers(query);
  };


  // Handle customer selection
  const handleCustomerSelect = (customer: ICutomer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.customerName as string); // Optionally, set the search input to the selected customer name
    setCustomers([]);

    setProductOptions((prev) => {
      const groupedProducts = customer.prizefix?.reduce((acc: any[], product: any) => {
        const existing = acc.find(p => p.name === product.productName);
        if (existing) {
          if (!existing.sizes.includes(product.size)) {
            existing.sizes.push(product.size);
          }
        } else {
          acc.push({ name: product.productName, sizes: [product.size] });
        }
        return acc;
      }, []) || []; // Use empty array as fallback if groupedProducts is undefined
      
      return [
        ...prev,
        ...groupedProducts
      ];
    });

    setSite(customer.sites || []);

    setFormData((prev) => {

      const updatedForm = {
        ...prev,
        customerName: customer.customerName as string,
        mobileNumber: customer.mobileNumber as string,
      };

      // Check if customer.sites exists and has at least one site
      if (customer.sites?.length || 0 < 2) {
        updatedForm.siteName = customer?.sites?.[0].siteName || '';
        updatedForm.siteAddress = customer?.sites?.[0].siteAddress || '';
      }

      return updatedForm;
    });
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      type: event.target.checked ? 'Return' : 'Delivery'
    });
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
        Add new Challan
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {`${isEditMode ? 'Edit' : 'Add New'} ${formData.type} Challan`}
          </Typography>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* First Row */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <TextField
                    label="Customer Name"
                    value={searchQuery}
                    onChange={handleCustomerSearchChange}
                    fullWidth
                    required
                    autoComplete="on"
                    variant="outlined"
                    size="small"
                  />
                  {customers.length > 0 && (
                    <Paper sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                      {customers.map((customer) => (
                        <Box
                          key={customer._id}  // Use customer._id instead of customer.id
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'lightgray' }
                          }}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          {customer.customerName}  {/* Display customerName */}
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
                    type='tel'
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="challanNumber"
                    label="Challan Number"
                    value={formData.challanNumber}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Box flex={1}>
                <FormInput
                  name="date"
                  label="Date"
                  type="date"
                  value={formData.date.toString().split('T')[0]}
                  onChange={handleChange}
                  required
                />
              </Box>
            </Stack>

            {/* Second Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControlLabel
                control={
                  <Switch
                    checked={formData.type === 'Return'}
                    onChange={handleToggleChange}
                    color="primary"
                  />
                }
                label={formData.type === 'Return' ? 'Return Challan' : 'Delivery Challan'}
              />
              <Box flex={1}>
                <FormInput
                  name="siteName"
                  label="Site Name"
                  value={formData.siteName}
                  onChange={handleChange}
                  required
                />
              </Box>
              <Box flex={1}>
                <FormInput
                  name="siteAddress"
                  label="Site Address"
                  value={formData.siteAddress}
                  onChange={handleChange}
                  required
                />
              </Box>
            </Stack>

            {/* 3 Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box flex={1}>
                <FormInput
                  name="loading"
                  label="Loading"
                  value={formData.loading.toString()}
                  onChange={handleChange}
                  type='number'
                />
              </Box>
              <Box flex={1}>
                <FormInput
                  name="unloading"
                  label="Unloading"
                  value={formData.unloading.toString()}
                  onChange={handleChange}
                  type='number'
                />
              </Box>
              <Box flex={1}>
                <FormInput
                  name="transportCharge"
                  label="Transport Charge"
                  value={formData.transportCharge.toString()}
                  onChange={handleChange}
                 type='number'
                />
              </Box>
            </Stack>

            {/* Products Section */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                Products
              </Typography>
              <Stack spacing={2}>
                {formData.products.map((product, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        boxShadow: 1
                      }
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2}
                      alignItems="center"
                      position="relative"
                    >
                      <Box flex={2}>
                        {productInput(index, product)}
                      </Box>
                      <Box flex={1}>
                        <FormInput
                          name={`products.${index}.quantity`}
                          label="Quantity"
                          type="number"
                          value={product.quantity?.toString()}
                          onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                          required
                        />
                      </Box>
                      <Box flex={1}>
                        <FormInput
                          name={`products.${index}.rate`}
                          label="Rate"
                          type="number"
                          value={product.rate?.toString()}
                          onChange={(e) => handleProductChange(index, 'rate', Number(e.target.value))}
                          required
                        />
                      </Box>
                      <Box
                        flex={1}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          Amount: ₹{Number(product.amount).toFixed(2)}
                        </Typography>
                      </Box>
                      {formData.products.length > 1 && (
                        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            onClick={() => removeProduct(index)}
                            color="error"
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: 'error.lighter'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
              <Button
                onClick={addProduct}
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Product
              </Button>
            </Paper>

            {/* Totals Section */}
            <Paper sx={{ p: 2, mt: 3 }}>
              <Stack spacing={1}>

                <Typography variant="h6">
                  Total Amount: ₹{Number(formData.totalAmount)?.toFixed(2)}
                </Typography>
              </Stack>
            </Paper>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button onClick={handleClose} variant="contained" color="error">
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                {isEditMode ? 'Update Purchase' : 'Save Purchase'}
              </Button>
            </Stack>
          </Stack>
        </Form>
    </Box>
      </Modal >

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

      <DetailPanelDialog />

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          ref={gridRef}
          rows={challan}
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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
    </Box >
  );
};

export default Challan;