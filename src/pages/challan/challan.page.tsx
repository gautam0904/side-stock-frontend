import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { challanService } from '../../api/challan.service';
import { productService } from '../../api/product.service';
import { customerService } from '../../api/customer.service';
import { toast } from 'react-hot-toast';
import './challan.css';
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
import { ICutomer, Iprizefix, ISite } from 'src/DTO/customer.dto';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FireTruckIcon from '@mui/icons-material/FireTruck';

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
  customerId: string;
  mobileNumber: string;
  siteName: string;
  siteAddress: string;
  products: IProducts[];
  loading: number;
  unloading: number;
  transportCharge: number;
  serviceCharge?: number;
  damageCharge?: number;
  amount: number;
  totalAmount: number;
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
  customerId: '',
  custsomerName: '',
  type: 'Delivery',
  mobileNumber: '',
  siteAddress: '',
  siteName: '',
  serviceCharge: 0,
  damageCharge: 0,
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
  width: '100%',
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
  // const [selectedGSTRate, setSelectedGSTRate] = useState('18');
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
    { field: 'serviceCharge', headerName: 'Service Charge', width: 130 },
    { field: 'damageCharge', headerName: 'Damage Charge', width: 130 },
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

  const handleSiteChange = (value: any) => {
    setFormData(prev => {
      const s = sites.find((s) => s.siteName == value)
      const challanNUmber = s?.challanNumber.split('C') || ['S0', '-1'];
      return {
        ...prev,
        siteName: s?.siteName || '',
        siteAddress: s?.siteAddress || '',
        challanNumber: `${challanNUmber[0]}C${Number(challanNUmber[1]) + 1}`
      };
    });
  };

  const handleProductChange = (index: number, field: keyof IProducts, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      const updatedProduct = {
        ...newProducts[index],
        [field]: value
      };

      if (field == 'productName') {
        const customerPrize = selectedCustomer?.prizefix?.find((p) => p.productName == value && p.size == formData.products[index].size)
        updatedProduct.rate = customerPrize?.rate;
      }
      if (field == 'size') {
        const customerPrize = selectedCustomer?.prizefix?.find((p) => p.size == value && p.productName == formData.products[index].productName)
        updatedProduct.rate = customerPrize?.rate;
      }

      // Immediately calculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        updatedProduct.amount = Number(updatedProduct.quantity || 0) * Number(updatedProduct.rate || 0);
      }

      newProducts[index] = updatedProduct;

      // Calculate totals
      const subTotal = newProducts.reduce((sum, product) => sum + (Number(product.amount) || 0), 0);
      const transportCharge = Number(prev.loading) + Number(prev.unloading);
      const serviceCharge = Number(prev.serviceCharge)
      const damageCharge = Number(prev.damageCharge)
      const baseAmount = subTotal
      return {
        ...prev,
        products: newProducts,
        amount: baseAmount,
        transportCharge,
        serviceCharge,
        damageCharge,
        totalAmount: Number(baseAmount) + Number(transportCharge) + serviceCharge + damageCharge
      };
    });
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...(prev.products || []), {
        productName: '',
        date: formData.date,
        quantity: 0,
        size: '',
        rate: 0,
        amount: 0
      }]
    }));
    const nextProductIndex = formData.products.length;
    if (productRefs.current[nextProductIndex]) {
      productRefs.current[nextProductIndex]?.focus();
    }
  };

  useEffect(() => {
    if (formData.products.length > 0) {
      const newProductIndex = formData.products.length - 1;
      if (productRefs.current[newProductIndex]) {
        productRefs.current[newProductIndex]?.focus();
      }
    }
  }, [formData.products.length]);

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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const processedValue = value;

    if (name == 'date') {
      const newProduct = formData.products.map((p) => {
        return {
          ...p,
          date: new Date(value),
        }
      });

      setFormData(prev => ({
        ...prev,
        products: newProduct
      }))
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }
  const handleExtraCharge = (field: keyof IChallan, value: any) => {
    const sanitizedValue = value.replace(/,/g, '');

    const numericValue = Number(sanitizedValue)

    setFormData((prev) => {
      const updatedFormData: IChallan = { ...prev };

      (updatedFormData[field] as number) = numericValue;

      const prevAmount = Number(prev[field]) ?? 0;
      updatedFormData.totalAmount = (prev.totalAmount ?? 0) - prevAmount + numericValue;

      return updatedFormData;
    });
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
        totals[key] = challan.reduce((sum, purchase: any) => sum + (purchase[key] || 0), 0);
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
                <Typography>{selectedPurchase.type}</Typography>
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
                <Typography>{selectedPurchase.custsomerName}</Typography>
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
      {/* Product Select */}
      <Box flex={2} sx={{ width: { xs: '100%', md: 'auto', margin: 'auto' } }}>
        <StyledSelect
          fullWidth
          value={product.productName || ''}
          onChange={(e: SelectChangeEvent<unknown>) => {
            handleProductChange(index, 'productName', e.target.value);
            handleProductChange(index, 'size', ''); // Reset size when product changes
          }}
          displayEmpty
          renderValue={(value) => (value as string) || 'Select Product'}
          inputRef={(ref) => (productRefs.current[index] = ref)}
          sx={{
            height: '35px',
            '& .MuiSelect-root': {
              height: '35px',
            },

            '& .MuiOutlinedInput-root': {
              border: '2px solid var(--primary-color)',
              borderRadius: '4px',
              borderColor: '#7b4eff',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: '2px solid var(--primary-color)',
                borderColor: '#7b4eff',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '2px solid var(--primary-color)',
                borderColor: '#7b4eff',
              },
            },
            minWidth: { xs: '100%', md: 200 },
          }}
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
                  backgroundColor: 'var(--primary-color)',
                },
                border: '2px soilid var(--primary-color)',
                borderTop: '2px solid transperent'
              }}
            >
              {option.name}
            </MenuItem>
          ))}
        </StyledSelect>
      </Box>

      {/* Size Select */}
      <Box flex={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
        <StyledSelect
          fullWidth
          value={product.size || ''}
          onChange={(e) => handleProductChange(index, 'size', e.target.value)}
          disabled={!product.productName}
          displayEmpty
          renderValue={(value: unknown) => (value as string) || 'Select Size'}
          sx={{
            height: '35px',
            '& .MuiSelect-root': {
              height: '35px',
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: '4px',
              borderColor: '#7b4eff',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7b4eff',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#7b4eff',
              },
            },
            minWidth: { xs: '100%', md: 150 },
          }}
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
                    backgroundColor: 'var(--primary-color)',
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

  const siteInput = (site: string) => (
    <Box sx={{
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      flexDirection: { xs: 'column', md: 'row' },
      width: '100%',
      mb: 2
    }}>
      {/* site name Select */}
      <Box flex={2} sx={{ width: { xs: '100%', md: 'auto', margin: 'auto' } }}>
        <StyledSelect
          fullWidth
          value={site || ''}
          onChange={(e: SelectChangeEvent<unknown>) => {
            handleSiteChange(e.target.value);
          }}
          onKeyDown={handleTabKeyPress}
          displayEmpty
          renderValue={(value) => (value as string) || 'Select Site'}
          sx={{
            height: '35px',
            '& .MuiSelect-root': {
              height: '35px',
            },

            '& .MuiOutlinedInput-root': {
              border: '2px solid var(--primary-color)',
              borderRadius: '4px',
              borderColor: '#7b4eff',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: '2px solid var(--primary-color)',
                borderColor: '#7b4eff',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '2px solid var(--primary-color)',
                borderColor: '#7b4eff',
              },
            },
            minWidth: { xs: '100%', md: 200 },
          }}
        >
          <MenuItem disabled value="">
            <em>Select Site</em>
          </MenuItem>
          {sites?.map((option) => (
            <MenuItem
              key={option.siteName}
              value={option.siteName}
              sx={{
                '&:hover': {
                  backgroundColor: 'var(--primary-color)',
                },
                border: '2px soilid var(--primary-color)',
                borderTop: '2px solid transperent'
              }}
            >
              {option.siteName}
            </MenuItem>
          ))}
        </StyledSelect>
      </Box>
    </Box>

  );

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

  useEffect(() => {
    // Prevent scroll changing number inputs
    const handleWheel = (event: Event) => {
      if ((document.activeElement as any)?.type === 'number') {
        event.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);


  // Handle customer selection
  const handleCustomerSelect = (customer: ICutomer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.customerName as string); // Optionally, set the search input to the selected customer name
    setCustomers([]);

    setSite(customer.sites || []);

    setFormData((prev) => {

      const updatedForm = {
        ...prev,
        customerName: customer.customerName as string,
        customerId: customer._id || '',
        mobileNumber: customer.mobileNumber as string,
      };
      if (customer.sites?.length || 0 < 1) {
        const challanNUmber =  customer?.sites?.[0]?.challanNumber.split('C') || ['S0', '-1'];
        updatedForm.siteName = customer?.sites?.[0].siteName || '';
        updatedForm.siteAddress = customer?.sites?.[0].siteAddress || '';
        updatedForm.challanNumber =  `${challanNUmber[0]}C${Number(challanNUmber[1]) + 1}`
      }

      return updatedForm;
    });
  };

  const handleTabKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      // Open the dropdown programmatically when the Tab key is pressed
      const select = e.target as HTMLSelectElement;
      if (select) {
        select.focus();
      }
    }
  };

  const productRefs = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <Box sx={{ p: 2 }}>
      <>
        <Box sx={{
          p: 2,
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: { xs: 'column', md: 'row' },
          background: 'radial-gradient(circle at center, #f8f9fa 0%, #e9ecef 100%)'
        }}>
          {/* Delivery Challan Button */}
          <Button
            variant="contained"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              p: 2,
              minWidth: 280,
              background: '#c3e1c5',
              color: 'var(--success-color)',
              border: '2px solid var(--success-color)',
              borderRadius: '12px',
              boxShadow: `
          0 4px 6px rgba(0, 0, 0, 0.1),
          inset 0 1px 2px rgba(255, 255, 255, 0.3),
          0 0 12px rgba(var(--success-rgb), 0.2)
        `,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0) scale(0.98)',
              '&:hover': {
                background: '#c3e1c5',
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: `
            0 6px 12px rgba(0, 0, 0, 0.15),
            inset 0 2px 4px rgba(255, 255, 255, 0.4),
            0 0 16px rgba(var(--success-rgb), 0.3)
          `,
              },
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `
            linear-gradient(
              45deg,
              transparent 25%,
              rgba(255, 255, 255, 0.3) 25%,
              rgba(255, 255, 255, 0.4) 50%,
              transparent 50%,
              transparent 75%,
              rgba(255, 255, 255, 0.3) 75%,
              transparent
            )
          `,
                backgroundSize: '4px 4px',
                opacity: 0.5,
                animation: 'shine 3s infinite linear', // Always apply the shining effect
                zIndex: 1
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                zIndex: 1
              }
            }}
            onClick={() => {
              setIsEditMode(false);
              setFormData(initialFormData);
              setOpen(true);
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              <ArrowBackIcon sx={{
                display: { xs: 'none', md: 'flex' },
                mr: 1,
                filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
              }} />
              <FireTruckIcon sx={{
                display: { xs: 'none', md: 'flex' },
                mr: 1,
                transform: 'scaleX(-1)',
                filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
              }} />
              <Typography variant="button" sx={{ fontWeight: 700 }}>
                Add new Delivery Challan
              </Typography>
            </Box>
          </Button>

          {/* Return Challan Button */}
          <Button
            variant="contained"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              p: 2,
              minWidth: 280,
              background: '#f3bfbc',
              color: 'var(--error-color)',
              border: '2px solid var(--error-color)',
              borderRadius: '12px',
              boxShadow: `
          0 4px 6px rgba(0, 0, 0, 0.1),
          inset 0 1px 2px rgba(255, 255, 255, 0.3),
          0 0 12px rgba(var(--error-rgb), 0.2)
        `,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0) scale(0.98)',
              '&:hover': {
                background: '#f3bfbc',
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: `
            0 6px 12px rgba(0, 0, 0, 0.15),
            inset 0 2px 4px rgba(255, 255, 255, 0.4),
            0 0 16px rgba(var(--error-rgb), 0.3)
          `,
              },
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `
            linear-gradient(
              45deg,
              transparent 25%,
              rgba(255, 255, 255, 0.3) 25%,
              rgba(255, 255, 255, 0.4) 50%,
              transparent 50%,
              transparent 75%,
              rgba(255, 255, 255, 0.3) 75%,
              transparent
            )
          `,
                backgroundSize: '4px 4px',
                opacity: 0.5,
                animation: 'shine 3s infinite linear', // Always apply the shining effect
                zIndex: 1
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                zIndex: 1
              }
            }}
            onClick={() => {
              setIsEditMode(false);
              setFormData({ ...initialFormData, type: "Return" });
              setOpen(true);
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              <Typography variant="button" sx={{ fontWeight: 700 }}>
                Add new Return Challan
              </Typography>
              <FireTruckIcon sx={{
                display: { xs: 'none', md: 'flex' },
                ml: 1,
                filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
              }} />
              <ArrowForwardIcon sx={{
                display: { xs: 'none', md: 'flex' },
                ml: 1,
                filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
              }} />
              
            </Box>
          </Button>
        </Box>

      </>
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

                <Box flex={1} sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  margin: 'auto',
                  '& .MuiBox-root': {
                    margin: 'auto'
                  },
                }}>
                  <TextField
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
                      height: '35px',
                      '& .MuiInputBase-root': {
                        height: '35px',
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7b4eff',
                          color: '#7b4eff'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7b4eff',
                          color: '#7b4eff'
                        },
                      },
                    }}
                  />
                  {customers.length > 0 && (
                    <Paper
                      sx={{
                        position: 'absolute',
                        top: '73%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        mt: 1,
                        maxHeight: 200,
                        border: '2px solid var(--primary-color)',
                        borderTop: 'none',
                        overflowY: 'auto',
                        backgroundColor: 'var(--surface-light)',
                      }}
                    >
                      {customers.map((customer) => (
                        <Box
                          key={customer._id}
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'lightgray' },
                          }}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          {customer.customerName} {/* Display customerName */}
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
                    disabled={true}
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
                <Box flex={1}>
                  {siteInput(formData.siteName)}
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="siteAddress"
                    label="Site Address"
                    value={formData.siteAddress}
                    onChange={handleChange}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    name="serviceCharge"
                    label="Service Charge"
                    type="number"
                    min={0}
                    max={9898998}
                    value={formData.serviceCharge}
                    onChange={(e) => (handleExtraCharge('serviceCharge', e.target.value))}
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    min={0}
                    name="damageCharge"
                    label="Damage Charge"
                    value={formData.damageCharge}
                    onChange={(e) => (handleExtraCharge('damageCharge', e.target.value))}
                    type='number'
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="loading"
                    min={0}
                    label="Loading"
                    value={formData.loading}
                    onChange={(e) => (handleExtraCharge('loading', e.target.value))}
                    type='Number'
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="unloading"
                    min={0}
                    label="Unloading"
                    value={formData.unloading}
                    onChange={(e) => (handleExtraCharge('unloading', e.target.value))}
                    type='number'
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="transportCharge"
                    min={0}
                    label="Transport Charge"
                    value={formData.transportCharge}
                    onChange={(e) => (handleExtraCharge('transportCharge', e.target.value))}
                    type='number'
                  />
                </Box>
              </Stack>

              {/* Products Section */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: 'var(--primary-dark)' }}>
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
                        top: '55%',
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
                            min={0}
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                            required
                          />
                        </Box>
                        <Box flex={1}>
                          <FormInput
                            name={`products.${index}.rate`}
                            label="Rate"
                            min={0}
                            type="number"
                            value={product.rate}
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
                  {isEditMode ? 'Update Challan' : 'Save Challan'}
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
          hideFooter={true}
          sx={{
            color: 'var(primary-color)',
            border: 0,
            height: '80vh',
            width: '100%',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'var(--primary-header-color)',
              color: '#333',
              '&:hover': {
                backgroundColor: '#fff',
                color: '#000',
              },
            },
            '& .MuiDataGrid-filterCell': {
              backgroundColor: 'var(--filter-background-color)',
              color: '#333',
              '&:hover': {
                backgroundColor: '#fff',
                color: '#000',
              },
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-toolbar': {
              backgroundColor: 'var(--toolbar-background-color)',
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowY: 'auto', // Enable vertical scrolling
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