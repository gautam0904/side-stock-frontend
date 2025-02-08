

// import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import { saleService } from '../../api/saleGST.service';
// import { productService } from '../../api/product.service';
// import { toast } from 'react-hot-toast';
// import {
//   Box,
//   Button,
//   Modal,
//   Typography,
//   IconButton,
//   Tooltip,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   DialogContentText,
//   CircularProgress,
//   Pagination,
//   Stack,
//   Paper,
//   ButtonGroup,
//   Select,
//   MenuItem,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   Collapse,
// } from '@mui/material';
// import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, useGridApiContext, useGridSelector } from '@mui/x-data-grid';
// import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
// import DeleteIcon from '@mui/icons-material/Delete';
// import EditIcon from '@mui/icons-material/Edit';
// import { GridToolbar } from '@mui/x-data-grid';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import FileDownloadIcon from '@mui/icons-material/FileDownload';
// import AddIcon from '@mui/icons-material/Add';
// import Form from '../../components/form/form.component';
// import { FormInput } from '../../components/formInput/formInput.component';
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
// import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
// import FirstPageIcon from '@mui/icons-material/FirstPage';
// import LastPageIcon from '@mui/icons-material/LastPage';
// import NavigateNextIcon from '@mui/icons-material/NavigateNext';
// import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
// import { debounce } from 'lodash';
// import { IProducts } from 'src/interfaces/common.interface';

// declare module 'jspdf' {
//   interface jsPDF {
//     autoTable: (options: any) => jsPDF;
//   }
// }

// interface IPurchase {
//   no?: number;
//   _id?: string;
//   GSTnumber: string;
//   billNumber: string;
//   date: Date;
//   companyName: string;
//   supplierName: string;
//   supplierNumber: string;
//   products: IProducts[];
//   transportAndCasting: number;
//   amount: number;
//   sgst: number;
//   cgst: number;
//   igst: number;
//   totalAmount: number;
// }

// const initialProduct: IProducts = {
//   productName: '',
//   size: '',
//   quantity: 0,
//   rate: 0,
//   amount: 0,
// };

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

// const modalStyle = {
//   position: 'absolute',
//   top: '50%',
//   left: '50%',
//   transform: 'translate(-50%, -50%)',
//   width: '100%',
//   ,
//   bgcolor: 'background.paper',
//   boxShadow: 24,
//   p: 4,
//   borderRadius: 2,
//   maxHeight: '95vh',
//   overflowY: 'auto'
// } as const;


// const PurchasesGST = () => {
//   const isMounted = useRef(false);
//   const [open, setOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
//   const [purchases, setPurchases] = useState<IPurchase[]>([]);
//   const [formData, setFormData] = useState<IPurchase>(initialFormData);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [paginationModel, setPaginationModel] = useState({
//     page: 0,
//     pageSize: 10
//   });
//   const [totalRows, setTotalRows] = useState(0);
//   const [gstRates, setGstRates] = useState({
//     sgstRate: 9,
//     cgstRate: 9,
//     igstRate: 18
//   });
//   const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
//   const [shouldFetch, setShouldFetch] = useState(true);
//   const fetchInProgress = useRef(false);
//   const [products, setProducts] = useState<IProducts[]>([]);
//   const [iscustomGstRates, setIsCustomGstRates] = useState(false);

//   const columns: GridColDef[] = [
//     {
//       field: 'expand',
//       headerName: '',
//       width: 60,
//       sortable: false,
//       renderCell: (params: GridRenderCellParams) => (
//         <IconButton
//           onClick={(e) => {
//             e.stopPropagation();
//             handleRowExpansion(params.row._id);
//           }}
//         >
//           {expandedRows.has(params.row._id) ?
//             <KeyboardArrowUpIcon /> :
//             <KeyboardArrowDownIcon />
//           }
//         </IconButton>
//       )
//     },
//     { field: 'no', headerName: 'No', width: 70 },
//     { field: 'GSTnumber', headerName: 'GST Number', width: 130 },
//     { field: 'billNumber', headerName: 'Bill Number', width: 130 },
//     {
//       field: 'date',
//       headerName: 'Date',
//       width: 130,
//       valueFormatter: (params: any) => {
//         try {
//           const date = new Date(params);
//           return date.toLocaleDateString('en-GB');
//         } catch (error) {
//           console.error('Date parsing error:', error);
//           return params?.value || '';
//         }
//       }
//     },
//     { field: 'companyName', headerName: 'Company Name', width: 150 },
//     { field: 'supplierName', headerName: 'Supplier Name', width: 150 },
//     { field: 'supplierNumber', headerName: 'Supplier Number', width: 130 },
//     {
//       field: 'amount',
//       headerName: 'Amount',
//       width: 100,
//       valueFormatter: (params: any) => {
//         return `₹${params.toFixed(2)}`
//       }
//     },
//     {
//       field: 'totalAmount',
//       headerName: 'Total Amount',
//       width: 130,
//       valueFormatter: (params: any) => {
//         return `₹${params.toFixed(2)}`
//       }
//     },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       width: 100,
//       renderCell: (params: GridRenderCellParams) => (
//         <Box>
//           <Tooltip title="Edit">
//             <IconButton onClick={() => handleEditClick(params.row)} color="primary">
//               <EditIcon />
//             </IconButton>
//           </Tooltip>
//           <Tooltip title="Delete">
//             <IconButton onClick={() => handleDeleteClick(params.row._id)} color="error">
//               <DeleteIcon />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       )
//     }
//   ];

//   const handleProductChange = (index: number, field: keyof IProducts, value: any) => {
//     setFormData(prev => {
//       const newProducts = [...prev.products];
//       const updatedProduct = {
//         ...newProducts[index],
//         [field]: value
//       };

//       // Immediately calculate amount when quantity or rate changes
//       if (field === 'quantity' || field === 'rate') {
//         updatedProduct.amount = Number(updatedProduct.quantity || 0) * Number(updatedProduct.rate || 0);
//       }

//       newProducts[index] = updatedProduct;

//       // Calculate totals
//       const subTotal = newProducts.reduce((sum, product) => sum + (product.amount || 0), 0);
//       const transportCost = Number(prev.transportAndCasting) || 0;
//       const baseAmount = subTotal + transportCost;

//       // Calculate GST based on rates
//       const sgst = (baseAmount * (gstRates.sgstRate / 100));
//       const cgst = (baseAmount * (gstRates.cgstRate / 100));
//       const igst = (baseAmount * (gstRates.igstRate / 100));

//       return {
//         ...prev,
//         products: newProducts,
//         amount: baseAmount,
//         sgst: sgst,
//         cgst: cgst,
//         igst: igst,
//         totalAmount: baseAmount + (prev.GSTnumber.startsWith('24') ? (sgst + cgst) : igst)
//       };
//     });
//   };

//   const addProduct = () => {
//     setFormData(prev => ({
//       ...prev,
//       products: [...prev.products, initialProduct]
//     }));
//   };

//   const removeProduct = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       products: prev.products.filter((_, i) => i !== index)
//     }));
//   };

//   const fetchPurchases = useCallback(async (pageNum: number, pageSize: number) => {
//     if (fetchInProgress.current || loading) return;

//     try {
//       fetchInProgress.current = true;
//       setLoading(true);

//       const response = await purchaseService.getAllPurchases({
//         page: pageNum + 1,
//         limit: pageSize === -1 ? 0 : pageSize,
//         sortBy: 'createdAt',
//         sortOrder: 'desc'
//       });

//       const newPurchases = response.data?.purchaseBills || [];
//       const totalCount = response.data?.pagination.total || 0;

//       const purchasesWithNumbers = newPurchases.map((purchase: any, index: number) => ({
//         ...purchase,
//         id: purchase._id,
//         no: pageSize === -1 ? index + 1 : (pageNum * pageSize) + index + 1
//       }));

//       setPurchases(purchasesWithNumbers);
//       setTotalRows(totalCount);
//       setShouldFetch(false);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to fetch purchases');
//     } finally {
//       setLoading(false);
//       fetchInProgress.current = false;
//     }
//   }, [loading]);

//   // Initial fetch effect
//   useEffect(() => {
//     if (shouldFetch) {
//       fetchPurchases(paginationModel.page, paginationModel.pageSize);
//     }
//   }, [shouldFetch, paginationModel.page, paginationModel.pageSize, fetchPurchases]);

//   const handleOpen = () => setOpen(true);
//   const handleClose = () => {
//     setOpen(false);
//     setIsEditMode(false);
//     setFormData(initialFormData);
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const validateGST = (field: string, value: string) => {
//     const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
//     if (!value) return `${field} is required`;
//     if (!gstPattern.test(value)) return 'Invalid GST Number format';
//     return undefined;
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (loading) return;
//     try {
//       setLoading(true);
//       if (isEditMode && formData._id) {
//         await purchaseService.updatePurchase(formData._id, formData);
//         toast.success('Purchase updated successfully');
//       } else {
//         await purchaseService.addPurchase(formData);
//         toast.success('Purchase added successfully');
//       }
//       handleClose();
//       setPaginationModel(prev => ({ ...prev, page: 0 }));
//       setShouldFetch(true);
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} purchase`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteClick = (id: string) => {
//     setCustomerToDelete(id);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!customerToDelete) return;

//     try {
//       await purchaseService.deletePurchase(customerToDelete);
//       toast.success('Customer deleted successfully');
//       setPurchases(prevData => prevData.filter((item: IPurchase) => item._id !== customerToDelete));
//       fetchPurchases(paginationModel.page, paginationModel.pageSize);
//     } catch (error: any) {

//     } finally {
//       setDeleteDialogOpen(false);
//       setCustomerToDelete(null);
//     }
//   };

//   const handleEditClick = (purchase: any) => {
//     setFormData({
//       ...purchase,
//       date: new Date(purchase.date).toISOString().split('T')[0]
//     });
//     setIsEditMode(true);
//     setOpen(true);
//   };

//   // Helper function to check scroll position
//   const isNearBottom = (element: HTMLElement): boolean => {
//     const visibleRows = element.querySelectorAll('.MuiDataGrid-row');
//     if (visibleRows.length === 0) return false;

//     const lastVisibleRowIndex = visibleRows.length - 2; // Second to last row
//     if (lastVisibleRowIndex < 0) return false;

//     const lastVisibleRow = visibleRows[lastVisibleRowIndex] as HTMLElement;
//     const rect = lastVisibleRow.getBoundingClientRect();
//     const elementRect = element.getBoundingClientRect();

//     return rect.bottom <= elementRect.bottom;
//   };

//   const downloadPDF = () => {
//     const doc = new jsPDF();

//     // Add title
//     doc.setFontSize(16);
//     doc.text('Purchase List', 14, 15);

//     // Prepare the data
//     const tableData = purchases.map((purchase: IPurchase) => [
//       purchase.no,
//       purchase.GSTnumber,
//       purchase.billNumber,
//       purchase.date,
//       purchase.companyName,
//       purchase.supplierName,
//       purchase.supplierNumber,
//       // Add more fields as needed
//     ]);

//     // Add the table
//     doc.autoTable({
//       head: [['No', 'GST Number', 'Bill Number', 'Date', 'Company Name', 'Supplier Name', 'Supplier Number']],
//       body: tableData,
//       startY: 25,
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [123, 78, 255] },
//     });

//     // Save the PDF
//     doc.save('purchases-list.pdf');
//   };

//   const CustomToolbar = () => (
//     <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <ButtonGroup variant="contained" sx={{ gap: 1 }}>
//         <Button
//           onClick={downloadPDF}
//           startIcon={<FileDownloadIcon />}
//           sx={{ bgcolor: '#c60055', color: 'white' }}
//         >
//           Download PDF
//         </Button>
//       </ButtonGroup>
//       <GridToolbar />
//     </Box>
//   );

//   const CustomPagination = () => {
//     // Calculate pageCount correctly
//     const pageCount = paginationModel.pageSize === -1
//       ? 1
//       : Math.max(1, Math.ceil(totalRows / paginationModel.pageSize));

//     const handlePageChange = (newPage: number) => {
//       // Ensure newPage is within valid range
//       if (newPage >= 0 && newPage < pageCount) {
//         setPaginationModel(prev => ({ ...prev, page: newPage }));
//         setShouldFetch(true);
//       }
//     };

//     const handlePageSizeChange = (newSize: number) => {
//       const newModel = {
//         page: 0, // Reset to first page when changing page size
//         pageSize: newSize
//       };
//       setPaginationModel(newModel);
//       setShouldFetch(true);
//     };

//     // Calculate current range of items being displayed
//     const startItem = paginationModel.pageSize === -1
//       ? 1
//       : paginationModel.page * paginationModel.pageSize + 1;

//     const endItem = paginationModel.pageSize === -1
//       ? totalRows
//       : Math.min((paginationModel.page + 1) * paginationModel.pageSize, totalRows);

//     return (
//       <Stack spacing={2} sx={{ p: 2 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Typography variant="body2">
//               Rows per page:
//             </Typography>
//             <Select
//               value={paginationModel.pageSize}
//               onChange={(e) => {
//                 const newSize = Number(e.target.value);
//                 setPaginationModel({
//                   page: 0,
//                   pageSize: newSize
//                 });
//                 setShouldFetch(true);
//               }}
//               size="small"
//               sx={{ minWidth: 80 }}
//             >
//               {[5, 10, 25, 50].map((size) => (
//                 <MenuItem key={size} value={size}>
//                   {size}
//                 </MenuItem>
//               ))}
//               <MenuItem value={-1}>All</MenuItem>
//             </Select>
//           </Box>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Typography variant="body2">
//               {paginationModel.pageSize === -1
//                 ? `1-${totalRows} of ${totalRows}`
//                 : `${paginationModel.page * paginationModel.pageSize + 1}-${Math.min((paginationModel.page + 1) * paginationModel.pageSize, totalRows)} of ${totalRows}`
//               }
//             </Typography>
//             <ButtonGroup
//               size="small"
//               sx={{
//                 '& .MuiButton-root': {
//                   minWidth: '40px',
//                   px: 1,
//                 }
//               }}
//             >
//               <Button
//                 onClick={() => {
//                   setPaginationModel({ ...paginationModel, page: 0 });
//                   setShouldFetch(true);
//                 }}
//                 disabled={paginationModel.page === 0 || paginationModel.pageSize === -1}
//                 title="First Page"
//                 sx={{
//                   '&.Mui-disabled': {
//                     opacity: 0.5,
//                   }
//                 }}
//               >
//                 <FirstPageIcon fontSize="small" />
//               </Button>
//               <Button
//                 onClick={() => {
//                   setPaginationModel(prev => ({ ...prev, page: prev.page - 1 }));
//                   setShouldFetch(true);
//                 }}
//                 disabled={paginationModel.page === 0 || paginationModel.pageSize === -1}
//                 title="Previous Page"
//                 sx={{
//                   '&.Mui-disabled': {
//                     opacity: 0.5,
//                   }
//                 }}
//               >
//                 <NavigateBeforeIcon fontSize="small" />
//               </Button>
//               <Box
//                 sx={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   px: 2,
//                   border: '1px solid',
//                   borderColor: 'divider',
//                   bgcolor: 'background.paper',
//                   minWidth: '80px',
//                   justifyContent: 'center'
//                 }}
//               >
//                 <Typography variant="body2">
//                   {totalRows > 0 ? `${paginationModel.page + 1} of ${pageCount}` : '0 of 0'}
//                 </Typography>
//               </Box>
//               <Button
//                 onClick={() => {
//                   setPaginationModel(prev => ({ ...prev, page: prev.page + 1 }));
//                   setShouldFetch(true);
//                 }}
//                 disabled={paginationModel.page >= Math.ceil(totalRows / paginationModel.pageSize) - 1 || paginationModel.pageSize === -1}
//                 title="Next Page"
//                 sx={{
//                   '&.Mui-disabled': {
//                     opacity: 0.5,
//                   }
//                 }}
//               >
//                 <NavigateNextIcon fontSize="small" />
//               </Button>
//               <Button
//                 onClick={() => {
//                   const lastPage = Math.ceil(totalRows / paginationModel.pageSize) - 1;
//                   setPaginationModel({ ...paginationModel, page: lastPage });
//                   setShouldFetch(true);
//                 }}
//                 disabled={paginationModel.page >= Math.ceil(totalRows / paginationModel.pageSize) - 1 || paginationModel.pageSize === -1}
//                 title="Last Page"
//                 sx={{
//                   '&.Mui-disabled': {
//                     opacity: 0.5,
//                   }
//                 }}
//               >
//                 <LastPageIcon fontSize="small" />
//               </Button>
//             </ButtonGroup>
//           </Box>
//         </Box>
//       </Stack>
//     );
//   };

//   const handleGSTRateChange = (type: 'sgstRate' | 'cgstRate' | 'igstRate', value: number) => {
//     setGstRates(prev => ({
//       ...prev,
//       [type]: value
//     }));

//     // Recalculate totals with new GST rates
//     setFormData(prev => {
//       const subTotal = prev.products.reduce((sum, product) => sum + (product.amount || 0), 0);
//       const transportCost = Number(prev.transportAndCasting) || 0;
//       const baseAmount = subTotal + transportCost;

//       const newSgst = (baseAmount * (type === 'sgstRate' ? value : gstRates.sgstRate) / 100);
//       const newCgst = (baseAmount * (type === 'cgstRate' ? value : gstRates.cgstRate) / 100);
//       const newIgst = (baseAmount * (type === 'igstRate' ? value : gstRates.igstRate) / 100);

//       return {
//         ...prev,
//         sgst: newSgst,
//         cgst: newCgst,
//         igst: newIgst,
//         totalAmount: baseAmount + (prev.GSTnumber.startsWith('24') ? (newSgst + newCgst) : newIgst)
//       };
//     });
//   };

//   const handleGSTRateOptionChange = (value: string) => {
//     if (value == 'custom') {
//       setIsCustomGstRates(true)
//     } else {
//       setIsCustomGstRates(false);
//       setGstRates({
//         sgstRate: Number(value) / 2,
//         cgstRate: Number(value) / 2,
//         igstRate: Number(value)
//       })
//     }
//   }

//   const handleRowExpansion = (rowId: string) => {
//     setExpandedRows(prev => {
//       const next = new Set(prev);
//       if (next.has(rowId)) {
//         next.delete(rowId);
//       } else {
//         next.add(rowId);
//       }
//       return next;
//     });
//   };

//   const getDetailPanelContent = useCallback((row: any) => {
//     return (
//       <Box sx={{ p: 2 }}>
//         <Typography variant="h6" gutterBottom component="div">
//           Products
//         </Typography>
//         <Table size="small">
//           <TableHead>
//             <TableRow>
//               <TableCell>Product Name</TableCell>
//               <TableCell align="right">Quantity</TableCell>
//               <TableCell align="right">Rate</TableCell>
//               <TableCell align="right">Amount</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {row.products.map((product: IProducts, index: number) => (
//               <TableRow key={index}>
//                 <TableCell component="th" scope="row">
//                   {product.productName}
//                 </TableCell>
//                 <TableCell align="right">{product.quantity}</TableCell>
//                 <TableCell align="right">₹{product.rate.toFixed(2)}</TableCell>
//                 <TableCell align="right">₹{product.amount.toFixed(2)}</TableCell>
//               </TableRow>
//             ))}
//             <TableRow>
//               <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
//                 Subtotal:
//               </TableCell>
//               <TableCell align="right" sx={{ fontWeight: 'bold' }}>
//                 ₹{row.amount.toFixed(2)}
//               </TableCell>
//             </TableRow>
//             <TableRow>
//               <TableCell colSpan={3} align="right">
//                 Transport & Casting:
//               </TableCell>
//               <TableCell align="right">
//                 ₹{row.transportAndCasting.toFixed(2)}
//               </TableCell>
//             </TableRow>
//             <TableRow>
//               <TableCell colSpan={3} align="right">
//                 SGST ({(row.sgst / row.amount * 100).toFixed(1)}%):
//               </TableCell>
//               <TableCell align="right">
//                 ₹{row.sgst.toFixed(2)}
//               </TableCell>
//             </TableRow>
//             <TableRow>
//               <TableCell colSpan={3} align="right">
//                 CGST ({(row.cgst / row.amount * 100).toFixed(1)}%):
//               </TableCell>
//               <TableCell align="right">
//                 ₹{row.cgst.toFixed(2)}
//               </TableCell>
//             </TableRow>
//             <TableRow>
//               <TableCell colSpan={3} align="right">
//                 IGST ({(row.igst / row.amount * 100).toFixed(1)}%):
//               </TableCell>
//               <TableCell align="right">
//                 ₹{row.igst.toFixed(2)}
//               </TableCell>
//             </TableRow>
//             <TableRow>
//               <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
//                 Total Amount:
//               </TableCell>
//               <TableCell align="right" sx={{ fontWeight: 'bold' }}>
//                 ₹{row.totalAmount.toFixed(2)}
//               </TableCell>
//             </TableRow>
//           </TableBody>
//         </Table>
//       </Box>
//     );
//   }, []);

//   // Fetch products on component mount
//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await productService.getAllProducts();
//         setProducts(response.data.products || []);
//       } catch (error: any) {
//         toast.error('Failed to fetch products');
//       }
//     };
//     fetchProducts();
//   }, []);

//   // GST rate options
//   const gstOptions = useMemo(() => [
//     { label: '5%', sgst: 2.5, cgst: 2.5, igst: 5 },
//     { label: '12%', sgst: 6, cgst: 6, igst: 12 },
//     { label: '18%', sgst: 9, cgst: 9, igst: 18 },
//     { label: '28%', sgst: 14, cgst: 14, igst: 28 },
//     { label: 'Custom', sgst: 'custom', cgst: 'custom', igst: 'custom' }
//   ], []);

//   const CustomRow = ({ row }: any) => (
//     <>
//       <TableRow>
//         {columns.map((column) => (
//           <TableCell key={column.field}>
//             {column.renderCell ? 
//               column.renderCell({ row } as any) : 
//               row[column.field]
//             }
//           </TableCell>
//         ))}
//       </TableRow>
//       <TableRow>
//         <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length}>
//           <Collapse in={expandedRows.has(row._id)} timeout="auto" unmountOnExit>
//             {getDetailPanelContent(row)}
//           </Collapse>
//         </TableCell>
//       </TableRow>
//     </>
//   );

//   return (
//     <Box sx={{ p: 2 }}>
//       <Button
//         fullWidth
//         variant="contained"
//         sx={{ bgcolor: '#7b4eff', color: 'white', mb: 2 }}
//         onClick={() => {
//           setIsEditMode(false);
//           setFormData(initialFormData);
//           setOpen(true);
//         }}
//       >
//         <PersonAddAltIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
//         Add new Purchase
//       </Button>

//       <Modal
//         open={open}
//         onClose={handleClose}
//         aria-labelledby="modal-title"
//       >
//         <Box sx={modalStyle}>
//           <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
//             {isEditMode ? 'Edit Purchase' : 'Add New Purchase'}
//           </Typography>

//           <Form onSubmit={handleSubmit}>
//             <Stack spacing={2}>
//               {/* First Row */}
//               <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
//                 <Box flex={1}>
//                   <FormInput
//                     name="GSTnumber"
//                     label="GST Number"
//                     value={formData.GSTnumber}
//                     onChange={handleChange}
//                     validate={validateGST}
//                     required
//                   />
//                 </Box>
//                 <Box flex={1}>
//                   <FormInput
//                     name="billNumber"
//                     label="Bill Number"
//                     value={formData.billNumber}
//                     onChange={handleChange}
//                     required
//                   />
//                 </Box>
//                 <Box flex={1}>
//                   <FormInput
//                     name="date"
//                     label="Date"
//                     type="date"
//                     value={formData.date.toString().split('T')[0]}
//                     onChange={handleChange}
//                     required
//                   />
//                 </Box>
//               </Stack>

//               {/* Second Row */}
//               <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
//                 <Box flex={1}>
//                   <FormInput
//                     name="companyName"
//                     label="Company Name"
//                     value={formData.companyName}
//                     onChange={handleChange}
//                     required
//                   />
//                 </Box>
//                 <Box flex={1}>
//                   <FormInput
//                     name="supplierName"
//                     label="Supplier Name"
//                     value={formData.supplierName}
//                     onChange={handleChange}
//                     required
//                   />
//                 </Box>
//                 <Box flex={1}>
//                   <FormInput
//                     name="supplierNumber"
//                     label="Supplier Number"
//                     value={formData.supplierNumber}
//                     onChange={handleChange}
//                     required
//                   />
//                 </Box>
//               </Stack>

//               {/* Products Section */}
//               <Box sx={{ mt: 3 }}>
//                 <Typography variant="h6" sx={{ mb: 2 }}>Products</Typography>
//                 <Stack spacing={2}>
//                   {formData.products.map((product, index) => (
//                     <Paper key={index} sx={{ p: 2 }}>
//                       <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
//                         <Box flex={1}>

//                           <Select
//                             value={product._id || ''}
//                             className = 'w-full'
//                             onChange={(e) => handleProductChange(index, 'productName', e.target.value)}
//                             required={true}
//                           >
//                             {products.map((p) => (
//                               <MenuItem key={p._id} value={p._id}>
//                                 {`${p.productName} ${p.size}`}
//                               </MenuItem>
//                             ))}
//                           </Select>
//                         </Box>
//                         <Box flex={1}>
//                           <FormInput
//                             name={`products.${index}.quantity`}
//                             label="Quantity"
//                             type="number"
//                             value={product.quantity.toString()}
//                             onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
//                             required
//                           />
//                         </Box>
//                         <Box flex={1}>
//                           <FormInput
//                             name={`products.${index}.rate`}
//                             label="Rate"
//                             type="number"
//                             value={product.rate.toString()}
//                             onChange={(e) => handleProductChange(index, 'rate', Number(e.target.value))}
//                             required
//                           />
//                         </Box>
//                         <Box flex={1}>
//                           <Typography>
//                             Amount: ₹{Number(product.amount).toFixed(2)}
//                           </Typography>
//                         </Box>
//                         {formData.products.length > 1 && (
//                           <IconButton onClick={() => removeProduct(index)} color="error">
//                             <DeleteIcon />
//                           </IconButton>
//                         )}
//                       </Stack>
//                     </Paper>
//                   ))}
//                 </Stack>
//                 <Button
//                   onClick={addProduct}
//                   startIcon={<AddIcon />}
//                   sx={{ mt: 2 }}
//                 >
//                   Add Product
//                 </Button>
//               </Box>

//               {/* Totals Section */}
//               <Paper sx={{ p: 2, mt: 3 }}>
//                 <Stack spacing={1}>
//                   <FormInput
//                     name="transportAndCasting"
//                     label="transport And Casting"
//                     type="number"
//                     containerClassName='w-1/4'
//                     fullWidth={false}
//                     onChange={(e) => handleGSTRateChange('cgstRate', Number(e.target.
//                       value))}
//                   />

//                   <Typography>Sub Total: ₹{Number(formData.amount).toFixed(2)}</Typography>
//                   <Typography>GST % : <Select value={18} onChange={(e) => handleGSTRateOptionChange(e.target.value.toString())} sx={{ width: 120 }}>
//                     {gstOptions.map((option) => (
//                       <MenuItem key={option.label} value={option.igst}>
//                         {option.label}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                   </Typography>

//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <FormInput
//                       name="sgstRate"
//                       label="SGST Rate (%)"
//                       type="number"
//                       disabled={!iscustomGstRates}
//                       className='w-1/4'
//                       fullWidth={false}
//                       value={iscustomGstRates ? '' : gstRates.sgstRate.toString()}
//                       onChange={(e) => handleGSTRateChange('sgstRate', Number(e.target.
//                         value))}
//                       sx={{ width: '100px' }}
//                     />
//                     <Typography>SGST: ₹{Number(formData.sgst).toFixed(2)}</Typography>
//                   </Box>

//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <FormInput
//                       name="cgstRate"
//                       label="CGST Rate (%)"
//                       type="number"
//                       containerClassName='w-1/4'
//                       fullWidth={false}
//                       disabled={!iscustomGstRates}
//                       value={iscustomGstRates ? '' : gstRates.cgstRate.toString()}
//                       onChange={(e) => handleGSTRateChange('cgstRate', Number(e.target.
//                         value))}
//                       sx={{ width: '100px' }}
//                     />
//                     <Typography>CGST: ₹{Number(formData.cgst).toFixed(2)}</Typography>
//                   </Box>

//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <FormInput
//                       name="igstRate"
//                       label="IGST Rate (%)"
//                       type="number"
//                       containerClassName='w-1/4'
//                       disabled={!iscustomGstRates}
//                       fullWidth={false}
//                       value={iscustomGstRates ? '' : gstRates.igstRate.toString()}
//                       onChange={(e) => handleGSTRateChange('igstRate', Number(e.target.
//                         value))}
//                       sx={{ width: '100px' }}
//                     />
//                     <Typography>IGST: ₹{Number(formData.igst).toFixed(2)}</Typography>
//                   </Box>

//                   <Typography variant="h6">
//                     Total Amount: ₹{Number(formData.totalAmount).toFixed(2)}
//                   </Typography>
//                 </Stack>
//               </Paper>

//               {/* Action Buttons */}
//               <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
//                 <Button onClick={handleClose} variant="contained" color="error">
//                   Cancel
//                 </Button>
//                 <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
//                   {isEditMode ? 'Update Purchase' : 'Save Purchase'}
//                 </Button>
//               </Stack>
//             </Stack>
//           </Form>
//         </Box>
//       </Modal>

//       <Dialog
//         open={deleteDialogOpen}
//         onClose={() => setDeleteDialogOpen(false)}
//       >
//         <DialogTitle>Confirm Delete</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Are you sure you want to delete this customer? This action cannot be undone.
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={() => setDeleteDialogOpen(false)}
//             variant="outlined"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleDeleteConfirm}
//             variant="contained"
//             color="error"
//             autoFocus
//           >
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Paper sx={{ height: 600, width: '100%' }}>
//         <DataGrid
//           rows={purchases}
//           columns={[
//             ...columns,
//             {
//               field: 'expand',
//               headerName: '',
//               width: 50,
//               sortable: false,
//               renderCell: (params) => (
//                 <IconButton
//                   onClick={() => {
//                     const newExpandedRows = new Set(expandedRows);
//                     if (newExpandedRows.has(params.row._id)) {
//                       newExpandedRows.delete(params.row._id);
//                     } else {
//                       newExpandedRows.add(params.row._id);
//                     }
//                     setExpandedRows(newExpandedRows);
//                   }}
//                 >
//                   {expandedRows.has(params.row._id) ? 
//                     <KeyboardArrowUpIcon /> : 
//                     <KeyboardArrowDownIcon />
//                   }
//                 </IconButton>
//               )
//             }
//           ]}
//           rowCount={totalRows}
//           loading={loading}
//           paginationModel={paginationModel}
//           paginationMode="server"
//           pageSizeOptions={[5, 10, 25, 50, { value: -1, label: 'All' }]}
//           onPaginationModelChange={(newModel) => {
//             setPaginationModel(newModel);
//             setShouldFetch(true);
//           }}
//           disableRowSelectionOnClick
//           getRowId={(row) => row._id}
//           sx={{
//             border: 0,
//             '& .MuiDataGrid-columnHeaders': {
//               backgroundColor: '#f5f5f5',
//             },
//             '& .MuiDataGrid-cell:focus': {
//               outline: 'none',
//             },
//             '& .expanded-row': {
//               backgroundColor: '#fafafa',
//               '& .MuiCollapse-root': {
//                 padding: 2,
//               },
//             },
//           }}
//           slots={{
//             toolbar: CustomToolbar,
//             pagination: CustomPagination,
//             loadingOverlay: () => (
//               <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
//                 <CircularProgress color="primary" />
//               </Box>
//             ),
//           }}
//           getRowClassName={(params) => 
//             expandedRows.has(params.row._id) ? 'expanded-row' : ''
//           }
//           getDetailPanelContent={(params) => expandedRows.has(params.row._id) ? (
//             <Box sx={{ p: 2 }}>
//               <Typography variant="h6" gutterBottom component="div">
//                 Products
//               </Typography>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Product Name</TableCell>
//                     <TableCell align="right">Quantity</TableCell>
//                     <TableCell align="right">Rate</TableCell>
//                     <TableCell align="right">Amount</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {params.row.products.map((product: IProducts, index: number) => (
//                     <TableRow key={index}>
//                       <TableCell component="th" scope="row">
//                         {product.productName}
//                       </TableCell>
//                       <TableCell align="right">{product.quantity}</TableCell>
//                       <TableCell align="right">₹{product.rate.toFixed(2)}</TableCell>
//                       <TableCell align="right">₹{product.amount.toFixed(2)}</TableCell>
//                     </TableRow>
//                   ))}
//                   <TableRow>
//                     <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
//                       Total:
//                     </TableCell>
//                     <TableCell align="right" sx={{ fontWeight: 'bold' }}>
//                       ₹{params.row.amount.toFixed(2)}
//                     </TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </Box>
//           ) : null}
//           // getDetailPanelHeight={() => 'auto'}
//           detailPanelExpandedRowIds={Array.from(expandedRows)}
//         />
//       </Paper>
//     </Box>
//   );
// };

// export default PurchasesGST;