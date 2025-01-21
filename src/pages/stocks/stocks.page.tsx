import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { productService } from '../../api/product.service';
import { toast } from 'react-hot-toast';
import {
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Stack,
  Paper,
  ButtonGroup,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { GridToolbar } from '@mui/x-data-grid';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import Form from '../../components/form/form.component';
import { FormInput } from '../../components/formInput/formInput.component';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { IProducts } from 'src/interfaces/common.interface';

            
const initialFormData: IProducts = {
  productName: '',
  size: '',
  quantity: 0
};

const Stocks = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<IProducts>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });
  const [totalRows, setTotalRows] = useState(0);

  const [shouldFetch, setShouldFetch] = useState(true);
  const fetchInProgress = useRef(false);
  const [products, setProducts] = useState<IProducts[]>([]);

  const columns: GridColDef[] = [
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'productName', headerName: 'Product Name', width: 130 },
    { field: 'size', headerName: 'Size', width: 130 },
    { field: 'stock', headerName: 'In Stock', width: 150 },
    { field: 'rented', headerName: 'Ranted', width: 150 },
    { field: 'loss', headerName: 'Loss', width: 130 },
    { field: 'total', headerName: 'Total', width: 130 },
  ];

  const fetchProducts = useCallback(async () => {
    if (fetchInProgress.current || loading) return;

    try {
      fetchInProgress.current = true;
      setLoading(true);

      const response = await productService.getAllProducts({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newProducts = response.data?.products || [];
      const totalCount = response.data?.pagination.total || 0;
      const ProductsWithNumbers = newProducts.map((purchase: any, index: number) => ({
        ...purchase,
        id: purchase._id,
        no:  index + 1 ,
        total: Number(purchase.stock) + Number(purchase.rented) + Number(purchase.loss)
      }));

      setProducts(ProductsWithNumbers);
      setTotalRows(totalCount);
      setShouldFetch(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch Products');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [loading]);

  // Initial fetch effect
  useEffect(() => {
    if (shouldFetch) {
      fetchProducts();
    }
  }, [shouldFetch, fetchProducts]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={products}
          columns={columns}
          rowCount={totalRows}
          loading={loading}
          paginationModel={paginationModel}
          paginationMode="server"
          pageSizeOptions={[5, 10, 25, 50, { value: -1, label: 'All' }]}
          onPaginationModelChange={(newModel) => {
            setPaginationModel(newModel);
            setShouldFetch(true);
          }}
          disableRowSelectionOnClick
          getRowId={(row) => row._id}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-detailPanel': {
              backgroundColor: '#fafafa',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
            },
          }}
          slots={{
            loadingOverlay: () => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress color="primary" />
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default Stocks;