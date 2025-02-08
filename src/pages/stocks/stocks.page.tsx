import React, { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '../../api/product.service';
import { toast } from 'react-hot-toast';
import {
  Box,
  IconButton,
  Paper,
  CircularProgress,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RotateIcon from '@mui/icons-material/Rotate90DegreesCw';


const Stocks = () => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });
  const [totalRows, setTotalRows] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const fetchInProgress = useRef(false);
  const [transposedData, setTransposedData] = useState<any[]>([]);

  const columns: GridColDef[] = isLandscape
    ? [
        { field: 'attribute', headerName: '', width: 150, sortable: false, filterable: false, disableColumnMenu: true },
        ...products.map((p, index) => ({
          field: `product-${index}`,
          headerName: p.productName,
          width: 150,
          sortable: false,
          filterable: false,
          disableColumnMenu: true
        }))
      ]
    : [
        { field: 'no', headerName: 'No', width: 70, sortable: false, filterable: false, disableColumnMenu: true },
        { field: 'productName', headerName: 'Product Name', width: 130, sortable: false, filterable: false, disableColumnMenu: true },
        { field: 'size', headerName: 'Size', width: 130, sortable: false, filterable: false, disableColumnMenu: true },
        { field: 'stock', headerName: 'In Stock', width: 150, sortable: false, filterable: false, disableColumnMenu: true },
        { field: 'rented', headerName: 'Rented', width: 150, sortable: false, filterable: false, disableColumnMenu: true },
        { field: 'loss', headerName: 'Loss', width: 130, sortable: false, filterable: false, disableColumnMenu: true },
        { field: 'totalStock', headerName: 'Total', width: 130, sortable: false, filterable: false, disableColumnMenu: true },
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
        no: index + 1,
        total: Number(purchase.stock), 
        stock: Number(purchase.stock) - Number(purchase.rented) - Number(purchase.loss)
      }));

      setProducts(ProductsWithNumbers);
      setTotalRows(totalCount);

      // Create the transposed data
      const transposed = transposeData(ProductsWithNumbers);
      setTransposedData(transposed);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch Products');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [loading]);

  // Function to transpose data
  const transposeData = (data: any[]) => {
    // Extracting the columns (attributes)
    const attributes = ['size', 'stock', 'rented', 'loss', 'total'];

    // Transposing rows to columns
    return attributes.map((attribute, index) => ({
      id: attribute, // Use attribute as the unique id for the row
      attribute: attribute,
      ...data.reduce((acc, item, itemIndex) => {
        acc[`product-${itemIndex}`] = item[attribute];
        return acc;
      }, {})
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleOrientation = () => {
    setIsLandscape(prev => !prev);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ height: 600, width: '100%' }}>
        {/* Button to toggle orientation */}
        <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Stock List</Typography>
          <Tooltip title="Toggle Landscape/Portrait">
            <IconButton onClick={toggleOrientation}>
              <RotateIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <DataGrid
          rows={isLandscape ? transposedData : products}
          columns={columns}
          rowCount={totalRows}
          loading={loading}
          paginationModel={paginationModel}
          paginationMode="server"
          pageSizeOptions={[5, 10, 25, 50, { value: -1, label: 'All' }]}
          onPaginationModelChange={(newModel) => {
            setPaginationModel(newModel);
          }}
          disableRowSelectionOnClick
          getRowId={(row) => row.id} // Ensure the custom id is used
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
        />
      </Paper>
    </Box>
  );
};

export default Stocks;
