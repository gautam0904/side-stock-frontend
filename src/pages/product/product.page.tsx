import React, { useState, useEffect, useCallback, useRef, useMemo, forwardRef } from 'react';
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
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FormInput from '../../components/formInput/formInput.component';

interface IProducts {
  no?: number;
  _id?: string;
  productName: string;
  size: string;
  stock: number;
  rented: number;
  loss: number;
  rate: number;
  totalStock: number;
}

const initialFormData: IProducts = {
  productName: '',
  size: '',
  stock: 0,
  rented: 0,
  rate: 0,
  loss: 0,
  totalStock: 0,
};

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
  const [products, setProducts] = useState<IProducts[]>([]);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const columns: GridColDef[] = useMemo(() => [
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'productName', headerName: 'Product Name', width: 130 },
    { field: 'size', headerName: 'Size', width: 130 },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 100,
      valueFormatter: (params: any) => `₹${parseFloat(params)?.toFixed(2)}`
    },
    { field: 'totalStock', headerName: 'totalStock', width: 150 },
    { field: 'stock', headerName: 'Godown Stock', width: 150 },
    { field: 'rented', headerName: 'Rented', width: 150 },
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
  ], []);

  const modalStyle = useMemo(() => ({
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
  } as const), []);

  const fetchProducts = useCallback(async (pageNum: number, pageSize: number) => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts({
        page: pageNum + 1,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const newProducts = response.data?.products || [];
      const totalCount = response.data?.pagination.total || 0;

      const productsWithNumbers = newProducts.map((product: any, index: number) => ({
        ...product,
        id: product._id,
        no: (pageNum * pageSize) + index + 1
      }));

      setProducts(productsWithNumbers);
      setTotalRows(totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(paginationModel.page, paginationModel.pageSize);
  }, [paginationModel, fetchProducts]);

  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      fetchProducts(paginationModel.page, paginationModel.pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} product`);
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
      toast.success('Product deleted successfully');
      setProducts(prev => prev.filter(item => item._id !== productToDelete));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEditClick = (product: IProducts) => {
    setFormData(product);
    setIsEditMode(true);
    setOpen(true);
  };

  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

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
        Add New Product
      </Button>

      <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    name="productName"
                    label="Product Name"
                    value={formData.productName.toString()}
                    onChange={handleChange}
                    required
                    ref={firstInputRef}
                    fullWidth
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="size"
                    label="Size"
                    value={formData.size.toString()}
                    onChange={handleChange}
                    required
                  />
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
                  <FormInput
                    name="rate"
                    label="Rate"
                    type="number"
                    min={0}
                    step="0.01" 
                    value={formData.rate || 0} 
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </Box>
                <Box flex={1}>
                  <FormInput
                    name="totalStock"
                    label="Stock"
                    type="number"
                    value={Number(formData.totalStock)}
                    onChange={handleChange}
                    required
                  />
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                  {isEditMode ? 'Update Product' : 'Save Product'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Modal>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this product? This action cannot be undone.
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

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={products}
          columns={columns}
          rowCount={totalRows}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={(row) => row._id || ''}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
          slots={{
            loadingOverlay: () => (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default Products;