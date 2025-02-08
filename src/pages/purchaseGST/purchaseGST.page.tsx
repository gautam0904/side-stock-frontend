import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { purchaseService } from '../../api/purchaseGST.service';
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
  Grid
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
import InfoIcon from '@mui/icons-material/Info';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ISite {
  siteName: string;
  siteAddress: string;
}

interface IPurchase {
  no?: number;
  _id?: string;
  GSTnumber: string;
  billNumber: string;
  date: Date;
  companyName: string;
  supplierName: string;
  supplierNumber: string;
  products: IProducts[];
  transportAndCasting: number;
  amount: number;
  sgst: number;
  cgst: number;
  igst: number;
  totalAmount: number;
  [key: string]: any;
}

const initialProduct: IProducts = {
  productName: '',
  size: '',
  quantity: 0,
  rate: 0,
  amount: 0,
};

// const initialSite: ISite = {
//   siteName: '',
//   siteAddress: ''
// };

const initialFormData: IPurchase = {
  GSTnumber: '',
  billNumber: '',
  date: new Date(),
  companyName: '',
  supplierName: '',
  supplierNumber: '',
  products: [{
    _id: '',
    size: '',
    productName: '',
    quantity: 0,
    rate: 0,
    amount: 0
  }],
  transportAndCasting: 0,
  amount: 0,
  sgst: 0,
  cgst: 0,
  igst: 0,
  totalAmount: 0,
  // sites: [{
  //   siteName: '',
  //   siteAddress: ''
  // }],
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

const PurchasesGST = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [formData, setFormData] = useState<IPurchase>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gstRates, setGstRates] = useState({
    sgstRate: 9,
    cgstRate: 9,
    igstRate: 18
  });
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
          <InfoIcon/>
        </IconButton>
      )
    },
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'GSTnumber', headerName: 'GST Number', width: 130 },
    { field: 'billNumber', headerName: 'Bill Number', width: 130 },
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
    { field: 'companyName', headerName: 'Company Name', width: 150 },
    { field: 'supplierName', headerName: 'Supplier Name', width: 150 },
    { field: 'supplierNumber', headerName: 'Supplier Number', width: 130 },
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
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 130,
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
      const transportCost = Number(prev.transportAndCasting || 0);
      const baseAmount = subTotal + transportCost;

      // Calculate GST based on rates
      const sgst = (baseAmount * (gstRates.sgstRate / 100));
      const cgst = (baseAmount * (gstRates.cgstRate / 100));
      const igst = (baseAmount * (gstRates.igstRate / 100));

      return {
        ...prev,
        products: newProducts,
        amount: baseAmount,
        sgst: sgst,
        cgst: cgst,
        igst: igst,
        totalAmount: baseAmount + (prev.GSTnumber.startsWith('24') ? (sgst + cgst) : igst)
      };
    });
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, initialProduct]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const fetchPurchases = useCallback(async () => {
    if (fetchInProgress.current || loading) return;

    try {
      fetchInProgress.current = true;
      setLoading(true);

      const response = await purchaseService.getAllPurchases({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newPurchases = response.data?.purchaseBills || [];
      const purchasesWithNumbers = newPurchases.map((purchase: any, index: number) => ({
        ...purchase,
        id: purchase._id,
        no: index + 1
      }));

      setPurchases(purchasesWithNumbers);
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
      fetchPurchases();
    }
  }, [shouldFetch, fetchPurchases]);

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

            setGstRates({
              sgstRate: isHomeState ? currentGSTRate / 2 : 0,
              cgstRate: isHomeState ? currentGSTRate / 2 : 0,
              igstRate: isHomeState ? 0 : currentGSTRate
            });

            return {
              ...newFormData,
              sgst: newSgst,
              cgst: newCgst,
              igst: newIgst,
              totalAmount: prev.amount + (isHomeState ? (newSgst + newCgst) : newIgst)
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
        await purchaseService.updatePurchase(formData._id, formData);
        toast.success('Purchase updated successfully');
      } else {
        await purchaseService.addPurchase(formData);
        toast.success('Purchase added successfully');
      }
      handleClose();
      setShouldFetch(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} purchase`);
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
      await purchaseService.deletePurchase(customerToDelete);
      toast.success('Customer deleted successfully');

      // Update purchases with recalculated numbers
      setPurchases(prevData => {
        const filteredData = prevData.filter((item: IPurchase) => item._id !== customerToDelete);
        return filteredData.map((purchase: IPurchase, index: number) => ({
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
    const tableData = purchases.map((purchase: any) =>
      keys.map(key => {
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

    // Calculate totals for numeric columns
    const totals: { [key: string]: number } = {};
    const numericFields = ['amount', 'totalAmount', 'sgst', 'cgst', 'igst'];

    keys.forEach((key) => {
      if (numericFields.includes(key)) {
        totals[key] = purchases.reduce((sum, purchase) => sum + (purchase[key] || 0), 0);
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

  const handleTotalChange = (value: number) => {
    setFormData(prev => {
      const transportCost = value || 0;
      const subTotal = prev.products.reduce((sum, product) => sum + (product.amount || 0), 0);
      const baseAmount = subTotal + transportCost;
  
      // GST Calculation
      const gstAmount = prev.GSTnumber.startsWith('24')
        ? prev.sgst + prev.cgst
        : prev.igst;
  
      // Update totalAmount with correct rounding
      const totalAmount = baseAmount + gstAmount;
  
      return {
        ...prev,
        transportAndCasting: transportCost,
        totalAmount: parseFloat(totalAmount.toFixed(2)), // rounding to 2 decimal places
      };
    });
  };
  

  const handleGSTRateChange = (type: 'sgstRate' | 'cgstRate' | 'igstRate', value: number) => {
    setGstRates(prev => ({
      ...prev,
      [type]: value
    }));

    // Recalculate totals with new GST rates
    setFormData(prev => {
      const subTotal = prev.products.reduce((sum, product) => sum + (product.amount || 0), 0);
      const transportCost = Number(prev.transportAndCasting) || 0;
      const baseAmount = subTotal + transportCost;

      const newSgst = (baseAmount * (type === 'sgstRate' ? value : gstRates.sgstRate) / 100);
      const newCgst = (baseAmount * (type === 'cgstRate' ? value : gstRates.cgstRate) / 100);
      const newIgst = (baseAmount * (type === 'igstRate' ? value : gstRates.igstRate) / 100);

      return {
        ...prev,
        sgst: newSgst,
        cgst: newCgst,
        igst: newIgst,
        totalAmount: baseAmount + (prev.GSTnumber.startsWith('24') ? (newSgst + newCgst) : newIgst)
      };
    });
  };

  const handleGSTRateOptionChange = (value: string) => {
    setSelectedGSTRate(value);
    if (value === 'custom') {
      setIsCustomGstRates(true);
      // Keep existing rates when switching to custom
      return;
    }

    setIsCustomGstRates(false);
    const numericValue = Number(value);
    const isHomeState = formData.GSTnumber.startsWith('24');

    setGstRates({
      sgstRate: isHomeState ? numericValue / 2 : 0,
      cgstRate: isHomeState ? numericValue / 2 : 0,
      igstRate: isHomeState ? 0 : numericValue
    });

    // Recalculate totals with new GST rates
    setFormData(prev => {
      const subTotal = prev.products.reduce((sum, product) => sum + (product.amount || 0), 0);
      const transportCost = Number(prev.transportAndCasting) || 0;
      const baseAmount = subTotal + transportCost;

      const newSgst = isHomeState ? (baseAmount * (numericValue / 2) / 100) : 0;
      const newCgst = isHomeState ? (baseAmount * (numericValue / 2) / 100) : 0;
      const newIgst = isHomeState ? 0 : (baseAmount * numericValue / 100);

      return {
        ...prev,
        amount: baseAmount,
        sgst: newSgst,
        cgst: newCgst,
        igst: newIgst,
        totalAmount: baseAmount + (isHomeState ? (newSgst + newCgst) : newIgst)
      };
    });
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
    const selectedPurchase = purchases.find(p => p._id == selectedProductIndex?.toString());

    if (!selectedPurchase) return null;

    return (
      <Dialog
        open={productPopupOpen}
        onClose={() => setProductPopupOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Purchase Details</DialogTitle>
        <DialogContent>
          {/* Basic Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">GST Number:</Typography>
                <Typography>{selectedPurchase.GSTnumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Bill Number:</Typography>
                <Typography>{selectedPurchase.billNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Date:</Typography>
                <Typography>{new Date(selectedPurchase.date).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Company Name:</Typography>
                <Typography>{selectedPurchase.companyName}</Typography>
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
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedPurchase.products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell align="right">{product.quantity}</TableCell>
                    <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{product.amount?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Sites Section */}
          {/* <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Sites</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Site Name</TableCell>
                    <TableCell>Site Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPurchase?.sites?.map((site, index) => (
                    <TableRow key={index}>
                      <TableCell>{site.siteName}</TableCell>
                      <TableCell>{site.siteAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box> */}

          {/* Summary */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Sub Total:</Typography>
                <Typography>₹{selectedPurchase.amount.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Transport & Casting:</Typography>
                <Typography>₹{selectedPurchase.transportAndCasting.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">SGST:</Typography>
                <Typography>₹{selectedPurchase.sgst.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">CGST:</Typography>
                <Typography>₹{selectedPurchase.cgst.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">IGST:</Typography>
                <Typography>₹{selectedPurchase.igst.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                  Total Amount: ₹{selectedPurchase.totalAmount.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
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
          {productOptions.map((option) => (
            <MenuItem
              key={option.name}
              value={option.name}
              sx={{
                '&:hover': {
                  backgroundColor: 'var(--primary-color)',
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

  // Add site handling functions
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
        Add new Purchase
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Purchase' : 'Add New Purchase'}
          </Typography>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* First Row */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    name="GSTnumber"
                    label="GST Number"
                    value={formData.GSTnumber}
                    onChange={handleChange}
                    validate={validateGST}
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="billNumber"
                    label="Bill Number"
                    value={formData.billNumber}
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
                  <FormInput
                    name="companyName"
                    label="Company Name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="supplierName"
                    label="Supplier Name"
                    value={formData.supplierName}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="supplierNumber"
                    label="Supplier Number"
                    value={formData.supplierNumber}
                    onChange={handleChange}
                    required
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

              {/* Sites Section */}
              {/* <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                  Sites
                </Typography>
                <Stack spacing={2}>
                  {formData.sites?.map((site, index) => (
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
                        <Box flex={1}>
                          <FormInput
                            name={`sites.${index}.siteName`}
                            label="Site Name"
                            value={site.siteName}
                            onChange={(e) => handleSiteChange(index, 'siteName', e.target.value)}
                            required
                          />
                        </Box>
                        <Box flex={2}>
                          <FormInput
                            name={`sites.${index}.siteAddress`}
                            label="Site Address"
                            value={site.siteAddress}
                            onChange={(e) => handleSiteChange(index, 'siteAddress', e.target.value)}
                            required
                          />
                        </Box>
                        {formData.sites.length > 1 && (
                          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              onClick={() => removeSite(index)} 
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
                  onClick={addSite}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  sx={{ mt: 2 }}
                >
                  Add Site
                </Button>
              </Paper> */}

              {/* Totals Section */}
              <Paper sx={{ p: 2, mt: 3 }}>
                <Stack spacing={1}>
                  <FormInput
                    name="transportAndCasting"
                    label="transport And Casting"
                    type="number"
                    containerClassName='w-1/4'
                    fullWidth={false}
                    value={formData.transportAndCasting.toString()}
                    onChange={(e) => handleTotalChange( Number(e.target.value))}
                  />

                  <Typography>Sub Total: ₹{Number(formData.amount).toFixed(2)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography component="span">GST % :</Typography>
                    <Select
                      value={selectedGSTRate}
                      onChange={(e) => handleGSTRateOptionChange(e.target.value.toString())}
                      sx={{ width: 120 }}
                      size="small"
                    >
                      {gstOptions.map((option) => (
                        <MenuItem key={option.label} value={option.igst === 'custom' ? 'custom' : option.igst}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  {/* Show SGST and CGST only for home state (24) */}
                  {formData.GSTnumber.startsWith('24') ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormInput
                          name="sgstRate"
                          label="SGST Rate (%)"
                          type="number"
                          disabled={!iscustomGstRates}
                          className='w-1/4'
                          fullWidth={false}
                          value={gstRates.sgstRate.toString()}
                          onChange={(e) => handleGSTRateChange('sgstRate', Number(e.target.value))}
                          sx={{ width: '100px' }}
                        />
                        <Typography>SGST: ₹{Number(formData.sgst).toFixed(2)}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormInput
                          name="cgstRate"
                          label="CGST Rate (%)"
                          type="number"
                          containerClassName='w-1/4'
                          fullWidth={false}
                          disabled={!iscustomGstRates}
                          value={gstRates.cgstRate.toString()}
                          onChange={(e) => handleGSTRateChange('cgstRate', Number(e.target.value))}
                          sx={{ width: '100px' }}
                        />
                        <Typography>CGST: ₹{Number(formData.cgst).toFixed(2)}</Typography>
                      </Box>
                    </>
                  ) : (
                    // Show IGST for other states
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormInput
                        name="igstRate"
                        label="IGST Rate (%)"
                        type="number"
                        containerClassName='w-1/4'
                        disabled={!iscustomGstRates}
                        fullWidth={false}
                        value={gstRates.igstRate.toString()}
                        onChange={(e) => handleGSTRateChange('igstRate', Number(e.target.value))}
                        sx={{ width: '100px' }}
                      />
                      <Typography>IGST: ₹{Number(formData.igst).toFixed(2)}</Typography>
                    </Box>
                  )}

                  <Typography variant="h6">
                    Total Amount: ₹{Number(formData.totalAmount).toFixed(2)}
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

      <DetailPanelDialog />

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          ref={gridRef}
          rows={purchases}
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
    </Box>
  );
};

export default PurchasesGST;