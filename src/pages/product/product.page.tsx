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


interface IProducts {
  no?: number;
  _id?: string;
  productName: string;
  size: string;
  stock:number;
  rented:number;
  loss:number;
}

const initialFormData: IProducts = {
  productName: '',
  size: '',
  stock: 0,
  rented: 0,
  loss: 0,
};

// const initialFormData: IPurchase = {
//   GSTnumber: '',
//   billNumber: '',
//   date: new Date(),
//   companyName: '',
//   supplierName: '',
//   supplierNumber: '',
//   products: [{
//     _id: '',
//     size: '',
//     productName: '',
//     quantity: 0,
//     rate: 0,
//     amount: 0
//   }],
//   transportAndCasting: 0,
//   amount: 0,
//   sgst: 0,
//   cgst: 0,
//   igst: 0,
//   totalAmount: 0,
// };

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


const Products = () => {
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
  const [gstRates, setGstRates] = useState({
    sgstRate: 9,
    cgstRate: 9,
    igstRate: 18
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [shouldFetch, setShouldFetch] = useState(true);
  const fetchInProgress = useRef(false);
  const [products, setProducts] = useState<IProducts[]>([]);

  const columns: GridColDef[] = [
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'productName', headerName: 'Product Name', width: 130 },
    { field: 'size', headerName: 'Size', width: 130 },
    { field: 'stock', headerName: 'Stock', width: 150 },
    { field: 'rented', headerName: 'Ranted', width: 150 },
    { field: 'loss', headerName: 'Loss', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEditClick(params.row)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDeleteClick(params.row._id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const fetchProducts = useCallback(async (pageNum: number, pageSize: number) => {
    if (fetchInProgress.current || loading) return;

    try {
      fetchInProgress.current = true;
      setLoading(true);

      const response = await productService.getAllProducts({
        page: pageNum + 1,
        limit: pageSize === -1 ? 0 : pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newProducts = response.data?.products || [];
      const totalCount = response.data?.pagination.total || 0;

      const ProductsWithNumbers = newProducts.map((purchase: any, index: number) => ({
        ...purchase,
        id: purchase._id,
        no: pageSize === -1 ? index + 1 : (pageNum * pageSize) + index + 1
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
      fetchProducts(paginationModel.page, paginationModel.pageSize);
    }
  }, [shouldFetch, paginationModel.page, paginationModel.pageSize, fetchProducts]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    try {
      setLoading(true);
      if (isEditMode && formData._id) {
        await productService.updateProduct(formData._id, formData);
        toast.success('Product updated successfully');
      } else {
        await productService.addProduct(formData);
        toast.success('Product added successfully');
      }
      handleClose();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      setShouldFetch(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} purchase`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productService.deleteProduct(productToDelete);
      toast.success('Customer deleted successfully');
      setProducts(prevData => prevData.filter((item: IProducts) => item._id !== productToDelete));
      fetchProducts(paginationModel.page, paginationModel.pageSize);
    } catch (error: any) {

    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEditClick = (purchase: any) => {
    setFormData({
      ...purchase,
    });
    setIsEditMode(true);
    setOpen(true);
  };

  const CustomPagination = () => {
    const pageCount = paginationModel.pageSize === -1
      ? 1
      : Math.max(1, Math.ceil(totalRows / paginationModel.pageSize));

    const handlePageChange = (newPage: number) => {
      if (newPage >= 0 && newPage < pageCount) {
        setPaginationModel(prev => ({ ...prev, page: newPage }));
        setShouldFetch(true);
      }
    };

    const startItem = paginationModel.pageSize === -1
      ? 1
      : paginationModel.page * paginationModel.pageSize + 1;

    const endItem = paginationModel.pageSize === -1
      ? totalRows
      : Math.min((paginationModel.page + 1) * paginationModel.pageSize, totalRows);

    return (
      <Stack spacing={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Rows per page:
            </Typography>
            <Select
              value={paginationModel.pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPaginationModel({
                  page: 0,
                  pageSize: newSize
                });
                setShouldFetch(true);
              }}
              size="small"
              sx={{ minWidth: 80 }}
            >
              {[5, 10, 25, 50].map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
              <MenuItem value={-1}>All</MenuItem>
            </Select>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {paginationModel.pageSize === -1
                ? `1-${totalRows} of ${totalRows}`
                : `${paginationModel.page * paginationModel.pageSize + 1}-${Math.min((paginationModel.page + 1) * paginationModel.pageSize, totalRows)} of ${totalRows}`
              }
            </Typography>
            <ButtonGroup
              size="small"
              sx={{
                '& .MuiButton-root': {
                  minWidth: '40px',
                  px: 1,
                }
              }}
            >
              <Button
                onClick={() => {
                  setPaginationModel({ ...paginationModel, page: 0 });
                  setShouldFetch(true);
                }}
                disabled={paginationModel.page === 0 || paginationModel.pageSize === -1}
                title="First Page"
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  }
                }}
              >
                <FirstPageIcon fontSize="small" />
              </Button>
              <Button
                onClick={() => {
                  setPaginationModel(prev => ({ ...prev, page: prev.page - 1 }));
                  setShouldFetch(true);
                }}
                disabled={paginationModel.page === 0 || paginationModel.pageSize === -1}
                title="Previous Page"
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  }
                }}
              >
                <NavigateBeforeIcon fontSize="small" />
              </Button>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  minWidth: '80px',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body2">
                  {totalRows > 0 ? `${paginationModel.page + 1} of ${pageCount}` : '0 of 0'}
                </Typography>
              </Box>
              <Button
                onClick={() => {
                  setPaginationModel(prev => ({ ...prev, page: prev.page + 1 }));
                  setShouldFetch(true);
                }}
                disabled={paginationModel.page >= Math.ceil(totalRows / paginationModel.pageSize) - 1 || paginationModel.pageSize === -1}
                title="Next Page"
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  }
                }}
              >
                <NavigateNextIcon fontSize="small" />
              </Button>
              <Button
                onClick={() => {
                  const lastPage = Math.ceil(totalRows / paginationModel.pageSize) - 1;
                  setPaginationModel({ ...paginationModel, page: lastPage });
                  setShouldFetch(true);
                }}
                disabled={paginationModel.page >= Math.ceil(totalRows / paginationModel.pageSize) - 1 || paginationModel.pageSize === -1}
                title="Last Page"
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  }
                }}
              >
                <LastPageIcon fontSize="small" />
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
      </Stack>
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
        Add new Products
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Typography>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* First Row */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    name="productName"
                    label="Product Name"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="size"
                    label="Size"
                    value={formData.size}
                    onChange={handleChange}
                    required
                  />
                </Box>
            
              </Stack>

              {/* Second Row */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    name="stock"
                    label="Stock"
                    type='number'
                    value={formData.stock.toString()}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="rented"
                    label="Rented"
                    type='number'
                    value={formData.rented.toString()}
                    onChange={handleChange}
                    required
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="loss"
                    label="Loss"
                    value={formData.loss.toString()}
                    onChange={handleChange}
                    required
                  />
                </Box>
              </Stack>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                  {isEditMode ? 'Update Product' : 'Save Product'}
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
            pagination: CustomPagination,
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

export default Products;