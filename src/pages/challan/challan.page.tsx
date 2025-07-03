import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FormEvent
} from 'react';

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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Grid,
  TextField
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FireTruckIcon from '@mui/icons-material/FireTruck';
import { FormInput } from '../../components/formInput/formInput.component';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { styled } from '@mui/material/styles';
import { SelectChangeEvent } from '@mui/material';
import { debounce } from 'lodash';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { IProducts } from 'src/interfaces/common.interface';
import { ICustomer, IPrizefix, ISite } from 'src/DTO/customer.dto';

// ----------------- Reusable Form + FormInput (for clarity) -----------------
interface FormProps {
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}
const Form: React.FC<FormProps> = ({ onSubmit, children }) => {
  return (
    <form onSubmit={onSubmit} style={{ width: '100%' }}>
      {children}
    </form>
  );
};

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// ----------------- Interfaces -----------------
interface IChallan {
  no?: number;
  _id?: string;
  challanNumber: string;
  type: string;
  date: Date | string;
  customerName: string;
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
  amount: 0
};

const initialFormData: IChallan = {
  challanNumber: '',
  date: new Date(),
  customerId: '',
  customerName: '',
  type: 'Delivery',
  mobileNumber: '',
  siteAddress: '',
  siteName: '',
  serviceCharge: 0,
  damageCharge: 0,
  products: [{ ...initialProduct }],
  transportCharge: 0,
  loading: 0,
  unloading: 0,
  amount: 0,
  totalAmount: 0
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

// Keep for site select – MUI style
const StyledSiteSelect = styled('div')(() => ({})); // not used, but left for reference

const Challan: React.FC = () => {
  // ---------- State ----------
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState<string | null>(null);
  const [challan, setChallan] = useState<IChallan[]>([]);
  const [formData, setFormData] = useState<IChallan>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const fetchInProgress = useRef(false);

  // ---------- For date picker open/close ----------
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ---------- For details panel popup ----------
  const [productPopupOpen, setProductPopupOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<string | null>(null);

  // ---------- DataGrid filter, columns, etc. ----------
  const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: 'and' as GridLogicOperator
  });
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const gridRef = useRef<any>(null);

  // ---------- Product Options ----------
  // E.g. { name: 'Steel Rod', sizes: ['12mm','16mm'], quantity: '20' }
  const [productOptions, setProductOptions] = useState<
    { name: string; sizes: string[]; quantity?: string }[]
  >([]);

  // ---------- Customer Searching ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);

  // ---------- Sites Data ----------
  const [sites, setSites] = useState<ISite[]>([]);

  // ---------- Refs for focus flow ----------
  const customerNameRef = useRef<HTMLInputElement>(null);
  const mobileNumberRef = useRef<HTMLInputElement>(null);
  const siteAddressRef = useRef<HTMLInputElement>(null);
  const serviceChargeRef = useRef<HTMLInputElement>(null);
  const damageChargeRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef<HTMLInputElement>(null);
  const unloadingRef = useRef<HTMLInputElement>(null);
  const transportChargeRef = useRef<HTMLInputElement>(null);

  // ---------- For controlling the 'open' state of the site MUI dropdown ----------
  const [siteSelectOpen, setSiteSelectOpen] = useState(false);

  // ---------- For controlling the 'open' state of each productName, size (custom) ----------
  // We'll track "open" in arrays, one per product row
  const [productNameOpen, setProductNameOpen] = useState<boolean[]>(
    formData.products.map(() => false)
  );
  const [productSizeOpen, setProductSizeOpen] = useState<boolean[]>(
    formData.products.map(() => false)
  );

  // Suppose you had some logic for "Return" stock quantity:
  const [customerQut, setCustomerQut] = useState<string>(''); // example usage

  const productRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const [highlightedSizeIndex, setHighlightedSizeIndex] = useState<number | null>(null);

  // ---------- Table Columns ----------
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
          const date = new Date(params.value);
          return date.toLocaleDateString('en-GB');
        } catch (error) {
          return params.value || '';
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
      valueFormatter: (params: any) => `₹${Number(params.value || 0).toFixed(2)}`
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className={'action-div'} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
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

  // ------------------ Fetch Challan Data ------------------
  const fetchChallan = useCallback(async () => {
    if (fetchInProgress.current || loading) return;
    try {
      fetchInProgress.current = true;
      setLoading(true);

      const response = await challanService.getAllChallan({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newChallans = response.data?.products || [];
      const challansWithNumbers = newChallans.map((ch: any, index: number) => ({
        ...ch,
        id: ch._id,
        no: index + 1
      }));
      setChallan(challansWithNumbers);
      setShouldFetch(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch Challans');
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

  // --------- Focus the first field on open ---------
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        customerNameRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // ------------------ handle site selection ------------------
  const handleSiteChange = (value: string) => {
    setFormData((prev) => {
      const s = sites.find((site) => site.siteName === value);

      let newChallanNumber = prev.challanNumber;
      if (s && s.challanNumber) {
        const parts = s.challanNumber.split('C');
        const prefix = parts[0] || 'S0';
        const number = parts[1] ? Number(parts[1]) : 0;
        newChallanNumber = `${prefix}C${number + 1}`;
      }

      return {
        ...prev,
        siteName: s?.siteName || '',
        siteAddress: s?.siteAddress || '',
        challanNumber: newChallanNumber
      };
    });
  };

  // ------------------ handle product changes ------------------
  const handleProductChange = (index: number, field: keyof IProducts, value: any) => {
    setFormData((prev) => {
      const newProducts = [...prev.products];
      const updatedProduct = { ...newProducts[index], [field]: value };

      // If productName/size changed, find rate from customer site "prizefix" or from your logic
      if (field === 'productName' || field === 'size') {
        const foundPrize = selectedCustomer?.sites?.flatMap((st) => st.prizefix).find(
          (p) =>
            p && p.productName === (field === 'productName' ? value : updatedProduct.productName) &&
            p.size === (field === 'size' ? value : updatedProduct.size)
        );
        if (foundPrize?.rate) {
          updatedProduct.rate = foundPrize.rate;
        }
      }

      // Recompute amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        updatedProduct.amount =
          (Number(updatedProduct.quantity) || 0) * (Number(updatedProduct.rate) || 0);
      }

      newProducts[index] = updatedProduct;

      // Recalc totals
      const subTotal = newProducts.reduce((sum, prod) => sum + Number(prod.amount || 0), 0);
      const transportCharge = Number(prev.loading) + Number(prev.unloading);
      const serviceCharge = Number(prev.serviceCharge);
      const damageCharge = Number(prev.damageCharge);
      const baseAmount = subTotal;

      return {
        ...prev,
        products: newProducts,
        amount: baseAmount,
        transportCharge,
        totalAmount: baseAmount + transportCharge + serviceCharge + damageCharge
      };
    });
  };

  // ------------------ Add/remove product lines ------------------
  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...(prev.products || []), { ...initialProduct }]
    }));
    setProductNameOpen((prevOpen) => [...prevOpen, false]);
    setProductSizeOpen((prevOpen) => [...prevOpen, false]);

    setTimeout(() => {
      const lastIndex = formData.products.length; // new product is at this index
      const el = productRefs.current[lastIndex];
      if (el) {
        el.focus(); // focus custom div
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
    setProductNameOpen((prev) => prev.filter((_, i) => i !== index));
    setProductSizeOpen((prev) => prev.filter((_, i) => i !== index));
  };

  // ------------------ Summation of extra fields ------------------
  const handleExtraCharge = (field: keyof IChallan, value: string) => {
    const numericValue = Number(value.replace(/,/g, ''));
    setFormData((prev) => {
      const newData = { ...prev, [field]: numericValue };
      const base = prev.products?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const loadUnload = newData.loading + newData.unloading;
      const sc = newData.serviceCharge || 0;
      const dc = newData.damageCharge || 0;
      newData.transportCharge = loadUnload;
      newData.totalAmount = base + loadUnload + sc + dc;
      return newData;
    });
  };

  // ------------------ Submit form ------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    try {
      setLoading(true);
      let dateToSave: Date = new Date();
      if (formData.date) {
        dateToSave = new Date(formData.date);
      }
      const finalPayload = { ...formData, date: dateToSave };

      if (isEditMode && formData._id) {
        await challanService.updateChallan(formData._id, finalPayload);
        toast.success('Challan updated successfully');
      } else {
        await challanService.addChallan(finalPayload);
        toast.success('Challan added successfully');
      }
      handleClose();
      setShouldFetch(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} Challan`
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Delete Handling ------------------
  const handleDeleteClick = (id: string) => {
    setChallanToDelete(id);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!challanToDelete) return;
    try {
      await challanService.deleteChallan(challanToDelete);
      toast.success('Challan deleted successfully');
      setChallan((prevData) => {
        const filtered = prevData.filter((item) => item._id !== challanToDelete);
        return filtered.map((c, i) => ({ ...c, no: i + 1 }));
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete Challan');
    } finally {
      setDeleteDialogOpen(false);
      setChallanToDelete(null);
    }
  };

  // ------------------ Edit Handling ------------------
  const handleEditClick = (rowData: any) => {
    setFormData({
      ...rowData,
      date: new Date(rowData.date)
    });
    setIsEditMode(true);
    setOpen(true);
  };

  // ------------------ PDF Export ------------------
  const downloadPDF = (visibleColumns: GridColDef[]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(123, 78, 255);
    doc.text('Challan List', 14, 15);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = visibleColumns.map((col) => col.headerName);
    const keys = visibleColumns.map((col) => col.field);

    const tableData = challan.map((c) =>
      keys.map((key) => {
        switch (key) {
          case 'amount':
          case 'totalAmount':
            return { content: Number(c[key] || 0).toFixed(2), styles: { halign: 'right' } };
          case 'date':
            return new Date(c[key]).toLocaleDateString('en-GB');
          default:
            return c[key as keyof IChallan]?.toString() || '';
        }
      })
    );

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: { left: 4, right: 4, top: 2, bottom: 2 }
      },
      headStyles: {
        fillColor: [123, 78, 255],
        textColor: [255, 255, 255]
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    doc.save('challan-list.pdf');
  };

  const CustomToolbar = () => {
    const handleExportPDF = () => {
      const visibleCols = columns.filter(
        (col) => columnVisibility[col.field] !== false && col.field !== 'actions'
      );
      downloadPDF(visibleCols);
    };
    return (
      <GridToolbarContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <Button
            onClick={handleExportPDF}
            startIcon={<FileDownloadIcon />}
            size="small"
            sx={{ ml: 1, textTransform: 'none' }}
          >
            Export PDF
          </Button>
        </Box>
      </GridToolbarContainer>
    );
  };

  // ------------------ Fetch Product & Site Data, Customer Search ------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        const grouped = response.data.products.reduce(
          (
            acc: { name: string; sizes: string[]; quantity?: string }[],
            product: any
          ) => {
            const existing = acc.find((p) => p.name === product.productName);
            if (existing) {
              if (!existing.sizes.includes(product.size)) {
                existing.sizes.push(product.size);
              }
            } else {
              acc.push({
                name: product.productName,
                sizes: [product.size],
                quantity: product.stock?.toString() || '0'
              });
            }
            return acc;
          },
          []
        );
        setProductOptions(grouped);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };
    fetchProducts();
  }, []);

  const fetchCustomers = debounce(async (query: string) => {
    if (query) {
      try {
        const response = await customerService.getCustomerByName(query);
        setCustomers(response.data.customers || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    } else {
      setCustomers([]);
    }
  }, 500);

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchCustomers(query);
  };

  const handleCustomerSelect = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.customerName || '');
    setCustomers([]);

    setSites(customer.sites || []);
    setFormData((prev) => {
      const newForm = {
        ...prev,
        customerName: customer.customerName || '',
        customerId: customer._id || '',
        mobileNumber: customer.mobileNumber || ''
      };
      if (customer.sites?.length) {
        const defaultSite = customer.sites[0];
        if (defaultSite?.siteName) {
          newForm.siteName = defaultSite.siteName;
          newForm.siteAddress = defaultSite.siteAddress || '';
          if (defaultSite.challanNumber) {
            const parts = defaultSite.challanNumber.split('C');
            const prefix = parts[0] || 'S0';
            const number = parts[1] ? Number(parts[1]) : 0;
            newForm.challanNumber = `${prefix}C${number + 1}`;
          }
        }
      }
      return newForm;
    });

    setTimeout(() => {
      mobileNumberRef.current?.focus();
    }, 50);
  };

  // Prevent number input from scrolling
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if ((document.activeElement as HTMLInputElement)?.type === 'number') {
        event.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  // ------------------ Close the modal and reset form ------------------
  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
    setSelectedCustomer(null);
    setSearchQuery('');
    setCustomers([]);
    setSites([]);
    setDatePickerOpen(false);
    setProductNameOpen([]);
    setProductSizeOpen([]);
  };

  // ------------------ Product Detail Panel Dialog ------------------
  const DetailPanelDialog = () => {
    const selectedPurchase = challan.find((p) => p._id === selectedProductIndex?.toString());
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Challan Type:
                </Typography>
                <Typography>{selectedPurchase.type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Challan Number:
                </Typography>
                <Typography>{selectedPurchase.challanNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Date:
                </Typography>
                <Typography>
                  {new Date(selectedPurchase.date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Customer Name:
                </Typography>
                <Typography>{selectedPurchase.customerName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Mobile Number:
                </Typography>
                <Typography>{selectedPurchase.mobileNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Site Name:
                </Typography>
                <Typography>{selectedPurchase.siteName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Site Address:
                </Typography>
                <Typography>{selectedPurchase.siteAddress}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Loading:
                </Typography>
                <Typography>{selectedPurchase.loading}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Unloading:
                </Typography>
                <Typography>{selectedPurchase.unloading}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Transport Charge:
                </Typography>
                <Typography>{selectedPurchase.transportCharge}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Amount:
                </Typography>
                <Typography>{selectedPurchase.amount}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Total Amount:
                </Typography>
                <Typography>{selectedPurchase.totalAmount}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Products
          </Typography>
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
                {selectedPurchase.products?.map((product, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>
                      {product.date ? new Date(product.date).toLocaleDateString() : ''}
                    </TableCell>
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

        <DialogContent sx={{ pt: 3 }}>
          <>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: '#eef2ff', borderRadius: '8px', height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#3730a3' }}>
                      Challan Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Challan Type:</Typography>
                        <Typography variant="body2" fontWeight={500}>{selectedPurchase.type}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Challan Number:</Typography>
                        <Typography variant="body2" fontWeight={500}>{selectedPurchase.challanNumber}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Date:</Typography>
                        <Typography variant="body2" fontWeight={500}>{new Date(selectedPurchase.date).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: '#dcfce7', borderRadius: '8px', height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#166534' }}>
                      Customer Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Customer Name:</Typography>
                        <Typography variant="body2" fontWeight={500}>{selectedPurchase.customerName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Mobile Number:</Typography>
                        <Typography variant="body2" fontWeight={500}>{selectedPurchase.mobileNumber}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Site Address:</Typography>
                        <Typography variant="body2" fontWeight={500}>{selectedPurchase.siteAddress}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="h6" sx={{ mb: 2, color: '#4338ca' }}>
              Product Details
            </Typography>
            <TableContainer component={Paper} elevation={1}>
              <Table>
                <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Rate</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPurchase.products?.map((product, idx) => (
                    <TableRow key={idx}>
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
          </>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setProductPopupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ------------------ Render each product row (custom dropdown for productName, size) ------------------
  const renderProductRow = (product: IProducts, index: number) => {
    // Are these dropdowns open?
    const isPNameOpen = productNameOpen[index] || false;
    const isSizeOpen = productSizeOpen[index] || false;

    // Open/close for product name
    const handleProductNameFocus = () => {
      const newState = [...productNameOpen];
      newState[index] = true;
      setProductNameOpen(newState);
    };
    const handleProductNameBlur = () => {
      setTimeout(() => {
        const newState = [...productNameOpen];
        newState[index] = false;
        setProductNameOpen(newState);
      }, 100);
    };

    // Open/close for size
    const handleProductSizeFocus = () => {
      const newState = [...productSizeOpen];
      newState[index] = true;
      setProductSizeOpen(newState);
    };
    const handleProductSizeBlur = () => {
      setTimeout(() => {
        const newState = [...productSizeOpen];
        newState[index] = false;
        setProductSizeOpen(newState);
      }, 100);
    };

    // For "Godown Stock" logic
    const productQuantity = (name: string, size: string) => {
      if (formData.type === 'Return') {
        return customerQut;
      } else if (formData.type === 'Delivery') {
        // find the matching product in productOptions
        const matchingOpt = productOptions.find(
          (p) => p.name === name && p.sizes.includes(size)
        );
        return matchingOpt?.quantity || '0';
      }
      return '0';
    };

    return (
      <Paper
        key={index}
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          '&:hover': {
            boxShadow: 1
          }
        }}
      >
        {/* Potential display of "Godown Stock" if name+size selected */}
        {(product.productName && product.size) ? (
          <Box sx={{ mb: 1, color: 'gray', fontSize: '0.9rem' }}>
            Godown Stock: {productQuantity(product.productName, product.size)}
          </Box>
        ) : null}

        {/* ROW FIELDS */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
          position="relative"
        >
          {/* ----------- CUSTOM DROPDOWN: PRODUCT NAME ----------- */}
          <Box flex={2} minWidth={180}>
            <label style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: 4 }}>
              Product Name
            </label>
            <div
              tabIndex={0}
              ref={(el) => (productRefs.current[index] = el)}
              style={{
                position: 'relative',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '6px 8px',
                cursor: 'pointer',
                minHeight: 35
              }}
              onFocus={() => {
                handleProductNameFocus();
                setHighlightedIndex(0);
              }}
              onBlur={() => {
                handleProductNameBlur();
                setHighlightedIndex(null);
              }}
              onKeyDown={(e) => {
                if (!isPNameOpen) return;

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev === null || prev === productOptions.length - 1 ? 0 : prev + 1
                  );
                }

                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev === null || prev === 0 ? productOptions.length - 1 : prev - 1
                  );
                }

                if (e.key === 'Enter' && highlightedIndex !== null) {
                  e.preventDefault();
                  const option = productOptions[highlightedIndex];
                  handleProductChange(index, 'productName', option.name);
                  handleProductChange(index, 'size', '');

                  const newState = [...productNameOpen];
                  newState[index] = false;
                  setProductNameOpen(newState);

                  setTimeout(() => {
                    const sizeDiv = document.getElementById(`sizeDiv-${index}`);
                    sizeDiv?.focus();
                  }, 50);
                }

                if (e.key === 'Escape') {
                  e.preventDefault();
                  const newState = [...productNameOpen];
                  newState[index] = false;
                  setProductNameOpen(newState);
                }
              }}
            >
              {product.productName || <span style={{ color: '#888' }}>Select Product</span>}

              {isPNameOpen && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    marginTop: 4,
                    zIndex: 999
                  }}
                >
                  {productOptions.length === 0 && (
                    <div style={{ padding: '6px' }}>
                      <em>No products found</em>
                    </div>
                  )}
                  {productOptions.map((option, optIdx) => (
                    <div
                      key={option.name}
                      style={{
                        padding: '6px',
                        borderBottom: '1px solid #eee',
                        backgroundColor: optIdx === highlightedIndex ? '#f0f0f0' : undefined
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleProductChange(index, 'productName', option.name);
                        // reset size
                        handleProductChange(index, 'size', '');
                        // close name dropdown
                        const newState = [...productNameOpen];
                        newState[index] = false;
                        setProductNameOpen(newState);
                        // focus next field => size
                        setTimeout(() => {
                          const sizeDiv = document.getElementById(`sizeDiv-${index}`);
                          sizeDiv?.focus();
                        }, 50);
                      }}
                    >
                      {option.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Box>

          {/* ----------- CUSTOM DROPDOWN: SIZE ----------- */}
          <Box flex={1} minWidth={120}>
            <label style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: 4 }}>
              Size
            </label>
            <div
              id={`sizeDiv-${index}`}
              tabIndex={product.productName ? 0 : -1}
              onFocus={() => {
                if (product.productName) {
                  handleProductSizeFocus();
                  setHighlightedSizeIndex(0);
                }
              }}
              onBlur={() => {
                if (product.productName) {
                  handleProductSizeBlur();
                  setHighlightedSizeIndex(null);
                }
              }}
              onKeyDown={(e) => {
                if (!isSizeOpen) return;

                const sizes = productOptions.find(p => p.name === product.productName)?.sizes || [];

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedSizeIndex((prev) =>
                    prev === null || prev === sizes.length - 1 ? 0 : prev + 1
                  );
                }

                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedSizeIndex((prev) =>
                    prev === null || prev === 0 ? sizes.length - 1 : prev - 1
                  );
                }

                if (e.key === 'Enter' && highlightedSizeIndex !== null) {
                  e.preventDefault();
                  const selectedSize = sizes[highlightedSizeIndex];

                  handleProductChange(index, 'size', selectedSize);

                  const newState = [...productSizeOpen];
                  newState[index] = false;
                  setProductSizeOpen(newState);

                  setTimeout(() => {
                    const qtyField = document.getElementById(`qtyField-${index}`);
                    qtyField?.focus();
                  }, 50);
                }

                if (e.key === 'Escape') {
                  e.preventDefault();
                  const newState = [...productSizeOpen];
                  newState[index] = false;
                  setProductSizeOpen(newState);
                }
              }}
              style={{
                position: 'relative',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '6px 8px',
                cursor: product.productName ? 'pointer' : 'not-allowed',
                minHeight: 35
              }}
            >
              {product.size
                ? product.size
                : product.productName
                  ? 'Select Size'
                  : 'Please select Product first'}

              {isSizeOpen && product.productName && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    marginTop: 4,
                    zIndex: 999
                  }}
                >
                  {/* find available sizes for current productName */}
                  {productOptions
                    .find((p) => p.name === product.productName)
                    ?.sizes.map((sz,szIdx) => (
                      <div
                        key={sz}
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #eee',
                          backgroundColor: szIdx === highlightedSizeIndex ? '#f0f0f0' : undefined
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleProductChange(index, 'size', sz);
                          // find rate if needed
                          const matchedOpt = productOptions.find(
                            (po) => po.name === product.productName && po.sizes.includes(sz)
                          );
                          if (matchedOpt) {
                            // you could do logic if needed
                          }
                          // close size dropdown
                          const newState = [...productSizeOpen];
                          newState[index] = false;
                          setProductSizeOpen(newState);
                          // focus quantity field
                          setTimeout(() => {
                            const qtyField = document.getElementById(`qtyField-${index}`);
                            qtyField?.focus();
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

          {/* Quantity */}
          <Box flex={1}>
            <FormInput
              name={`products.${index}.quantity`}
              label="Quantity"
              type="number"
              min={0}
              id={`qtyField-${index}`}
              value={product.quantity}
              onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
              required
            />
          </Box>

          {/* Rate */}
          <Box flex={1}>
            <FormInput
              name={`products.${index}.rate`}
              label="Rate"
              type="number"
              min={0}
              value={product.rate}
              onChange={(e) => handleProductChange(index, 'rate', Number(e.target.value))}
              required
            />
          </Box>

          {/* Amount Display */}
          <Box flex={1} sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Amount: ₹{Number(product.amount).toFixed(2)}
            </Typography>
          </Box>

          {/* Remove Button */}
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
    );
  };

  // ------------------ Full Return UI ------------------
  return (
    <Box sx={{ p: 2 }}>
      {/* Buttons to open the modal in Delivery or Return mode */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: { xs: 'column', md: 'row' },
          background: 'radial-gradient(circle at center, #f8f9fa 0%, #e9ecef 100%)'
        }}
      >
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
            boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1)`,
            transition: 'all 0.3s',
            transform: 'translateY(0) scale(0.98)',
            '&:hover': {
              background: '#c3e1c5',
              transform: 'translateY(-2px) scale(1.02)'
            }
          }}
          onClick={() => {
            setIsEditMode(false);
            setFormData({ ...initialFormData, type: 'Delivery' });
            setOpen(true);
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <ArrowBackIcon sx={{ display: { xs: 'none', md: 'block' }, mr: 1 }} />
            <FireTruckIcon
              sx={{ display: { xs: 'none', md: 'block' }, mr: 1, transform: 'scaleX(-1)' }}
            />
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
            boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1)`,
            transition: 'all 0.3s',
            transform: 'translateY(0) scale(0.98)',
            '&:hover': {
              background: '#f3bfbc',
              transform: 'translateY(-2px) scale(1.02)'
            }
          }}
          onClick={() => {
            setIsEditMode(false);
            setFormData({ ...initialFormData, type: 'Return' });
            setOpen(true);
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <Typography variant="button" sx={{ fontWeight: 700 }}>
              Add new Return Challan
            </Typography>
            <FireTruckIcon sx={{ display: { xs: 'none', md: 'block' }, ml: 1 }} />
            <ArrowForwardIcon sx={{ display: { xs: 'none', md: 'block' }, ml: 1 }} />
          </Box>
        </Button>
      </Box>

      {/* MAIN MODAL */}
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 3 }}>
            {`${isEditMode ? 'Edit' : 'Add New'} ${formData.type} Challan`}
          </Typography>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* Row 1: Customer Name, Mobile, Challan Number, Date */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {/* Customer Name + Autocomplete */}
                <Box flex={1} sx={{ position: 'relative' }}>
                  <TextField
                    label="Customer Name"
                    inputRef={customerNameRef}
                    value={searchQuery}
                    onChange={handleCustomerSearchChange}
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
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
                  {/* Autocomplete Paper */}
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
                        border: '1px solid var(--primary-color)',
                        overflowY: 'auto',
                        backgroundColor: '#fff'
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

                {/* Mobile Number */}
                <Box flex={1}>
                  <TextField
                    label="Mobile Number"
                    inputRef={mobileNumberRef}
                    name="mobileNumber"
                    type="tel"
                    fullWidth
                    required
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))
                    }
                    size="small"
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
                </Box>

                {/* Challan Number */}
                <Box flex={1}>
                  <FormInput
                    name="challanNumber"
                    label="Challan Number"
                    value={formData.challanNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, challanNumber: e.target.value }))
                    }
                    disabled
                    required
                  />
                </Box>

                {/* Date => react-datepicker */}
                <Box flex={1} sx={{ position: 'relative' }}>
                  <label
                    style={{
                      fontWeight: 500,
                      marginBottom: '4px',
                      display: 'inline-block'
                    }}
                  >
                    Date
                  </label>
                  <DatePicker
                    selected={
                      formData.date
                        ? typeof formData.date === 'string'
                          ? new Date(formData.date)
                          : formData.date
                        : null
                    }
                    onChange={(date: Date | null) => {
                      if (!date) return;
                      setFormData((prev) => ({ ...prev, date }));
                    }}
                    // onSelect={() => setDatePickerOpen(false)}
                    dateFormat="dd/MM/yyyy"
                    className="form-control datepicker-custom "
                    placeholderText="Select date"
                  />
                </Box>
              </Stack>

              {/* Row 2: Site Select, Site Address */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {/* Site (MUI-based) */}
                <Box flex={1} sx={{ minWidth: 180 }}>
                  <label
                    style={{ fontWeight: 500, marginBottom: '4px', display: 'inline-block' }}
                  >
                    Site
                  </label>
                  <div
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      minHeight: 35,
                      position: 'relative'
                    }}
                    tabIndex={0}
                    onFocus={() => setSiteSelectOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setSiteSelectOpen(false), 100);
                    }}
                  >
                    {formData.siteName || 'Select Site'}
                    {siteSelectOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #ddd',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          marginTop: 4,
                          zIndex: 999
                        }}
                      >
                        {sites.map((s) => (
                          <div
                            key={s.siteName}
                            style={{
                              padding: '6px',
                              borderBottom: '1px solid #eee'
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (s.siteName) {
                                handleSiteChange(s.siteName);
                              }
                              setSiteSelectOpen(false);
                              setTimeout(() => {
                                siteAddressRef.current?.focus();
                              }, 50);
                            }}
                          >
                            {s.siteName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Box>

                {/* Site Address */}
                <Box flex={1}>
                  <FormInput
                    name="siteAddress"
                    label="Site Address"
                    inputref={siteAddressRef}
                    value={formData.siteAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, siteAddress: e.target.value }))
                    }
                  />
                </Box>
              </Stack>

              {/* Row 3: Service, Damage, Loading, Unloading, Transport */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {formData.type === 'Delivery' ?
                  <Box flex={1}>
                    <FormInput
                      name="serviceCharge"
                      label="Service Charge"
                      type="number"
                      min={0}
                      max={9999999}
                      value={formData.serviceCharge}
                      onChange={(e) => handleExtraCharge('serviceCharge', e.target.value)}
                      inputref={serviceChargeRef}
                    />
                  </Box>
                  :
                  <Box flex={1}>
                    <FormInput
                      name="damageCharge"
                      label="Damage Charge"
                      type="number"
                      min={0}
                      max={9999999}
                      value={formData.damageCharge}
                      onChange={(e) => handleExtraCharge('damageCharge', e.target.value)}
                      inputref={damageChargeRef}
                    />
                  </Box>
                }
                {formData.type === 'Delivery' ?
                  <Box flex={1}>
                    <FormInput
                      name="loading"
                      label="Loading"
                      type="number"
                      min={0}
                      value={formData.loading}
                      onChange={(e) => handleExtraCharge('loading', e.target.value)}
                      inputref={loadingRef}
                    />
                  </Box>
                  :
                  <Box flex={1}>
                    <FormInput
                      name="unloading"
                      label="Unloading"
                      type="number"
                      min={0}
                      value={formData.unloading}
                      onChange={(e) => handleExtraCharge('unloading', e.target.value)}
                      inputref={unloadingRef}
                    />
                  </Box>
                }
              </Stack>

              {/* Products Section */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: 'var(--primary-dark)' }}>
                  Products
                </Typography>
                <Stack spacing={2}>
                  {formData.products.map((product, index) => renderProductRow(product, index))}
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

              {/* Total Amount */}
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6">
                  Total Amount: ₹{Number(formData.totalAmount).toFixed(2)}
                </Typography>
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
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Challan? This action cannot be undone.
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

      {/* Products Detail Panel Dialog */}
      <DetailPanelDialog />

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%', mt: 2 }}>
        <DataGrid
          ref={gridRef}
          rows={challan}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          getRowId={(row) => row._id as string}
          hideFooter
          sx={{
            border: 0,
            height: '80vh',
            width: '100%',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'var(--primary-header-color)',
              color: '#333'
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowY: 'auto'
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
          onColumnVisibilityModelChange={(newModel) => setColumnVisibility(newModel)}
          disableColumnFilter={false}
          disableDensitySelector
          disableColumnSelector={false}
        />
      </Paper>
    </Box>
  );
};

export default Challan;
