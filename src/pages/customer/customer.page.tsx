

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { customerNonGSTService } from '../../api/customerNonGST.service';
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
    Pagination,
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
    Collapse,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, useGridApiContext, useGridSelector } from '@mui/x-data-grid';
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
import { debounce } from 'lodash';
import { IProducts } from 'src/interfaces/common.interface';

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface ICustomerNonGST {
    no?: number;
    _id?: string;
    customerName: string;
    mobileNumber: string;
    partnerName: string;
    partnerNumber: string;
    reference: string;
    referenceNumber: string;
    aadhar: string;
    aadharPhoto: string;
    panCard: string;
    panCardPhoto: string;
    customerPhoto: string;
    residentAddress: string;
    products: IProducts[];
    sites: Isite[];
}

const initialProduct: IProducts = {
    productName: '',
    size: '',
    rate: 0,
};

const initialSite: Isite = {
    siteName: '',
    siteAddress : ''
};

interface Isite {
    siteName: string;
    siteAddress: string;
}

const initialFormData: ICustomerNonGST = {
    customerName: '',
    mobileNumber: '',
    partnerName: '',
    partnerNumber: '',
    reference: '',
    referenceNumber: '',
    aadhar: '',
    aadharPhoto: '',
    panCard: '',
    panCardPhoto: '',
    customerPhoto: '',
    residentAddress: '',
    sites: [{
        siteName: '',
        siteAddress: '',
    }],
    products: [{
        _id: '',
        size: '',
        productName: '',
        rate: 0,
    }]
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


const CustomerNonGST = () => {
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [expandDialogOpen, setExpandDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    const [customer, setCustomer] = useState<ICustomerNonGST[]>([]);
    const [formData, setFormData] = useState<ICustomerNonGST>(initialFormData);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10
    });
    const [totalRows, setTotalRows] = useState(0);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [shouldFetch, setShouldFetch] = useState(true);
    const fetchInProgress = useRef(false);
    const [products, setProducts] = useState<IProducts[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<IProducts[]>([]);

    const columns: GridColDef[] = [
        {
            field: 'expand',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRowExpansion(params.row._id);
                    }}
                >
                    {expandedRows.has(params.row._id) ?
                        <KeyboardArrowUpIcon /> :
                        <KeyboardArrowDownIcon />
                    }
                </IconButton>
            )
        },
        { field: 'no', headerName: 'No', width: 70 },
        { field: 'customerName', headerName: 'Customer Name', width: 130 },
        { field: 'mobileNumber', headerName: 'Mobile Number', width: 130 },
        { field: 'siteName', headerName: 'Site Name', width: 130 },
        { field: 'siteAddress', headerName: 'Site Address', width: 130 },
        { field: 'partnerName', headerName: 'Partner Name', width: 130 },
        { field: 'partnerNumber', headerName: 'Partner Number', width: 130 },
        { field: 'reference', headerName: 'Reference', width: 130 },
        { field: 'referenceNumber', headerName: 'Reference Number', width: 130 },
        { field: 'aadhar', headerName: 'Aadhar', width: 130 },
        { field: 'panCard', headerName: 'PanCard', width: 130 },
        { field: 'residentAddress', headerName: 'Resident Address', width: 130 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
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

    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, initialProduct]
        }));
    };
    const addSite = () => {
        setFormData(prev => ({
            ...prev,
            sites: [...prev.sites, initialSite]
        }));
    };

    const removeProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }));
    };

    const removeSite = (index: number) => {
        setFormData(prev => ({
            ...prev,
            sites: prev.sites.filter((_, i) => i !== index)
        }));
    };

    const fetchCustomer = useCallback(async (pageNum: number, pageSize: number) => {
        if (fetchInProgress.current || loading) return;

        try {
            fetchInProgress.current = true;
            setLoading(true);

            const response = await customerNonGSTService.getAllCustomerNonGST({
                page: pageNum + 1,
                limit: pageSize === -1 ? 0 : pageSize,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            const newPurchases = response.data?.customers || [];
            const totalCount = response.data?.pagination.total || 0;

            const purchasesWithNumbers = newPurchases.map((purchase: any, index: number) => ({
                ...purchase,
                id: purchase._id,
                no: pageSize === -1 ? index + 1 : (pageNum * pageSize) + index + 1
            }));

            setCustomer(purchasesWithNumbers);
            setTotalRows(totalCount);
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
            fetchCustomer(paginationModel.page, paginationModel.pageSize);
        }
    }, [shouldFetch, paginationModel.page, paginationModel.pageSize, fetchCustomer]);

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

    const validatePAN = (field: string, value: string) => {
        const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!value) return `${field} is required`;
        if (!panPattern.test(value)) return 'Invalid PAN Number format';
        return undefined;
    };

    const validateMobile = (field: string, value: string) => {
        const mobilePattern = /^[6-9]\d{9}$/;
        if (!value) return `${field} is required`;
        if (!mobilePattern.test(value)) return 'Invalid Mobile Number';
        return undefined;
    };

    const validateRequired = (field: string, value: string) => {
        if (!value) return `${field} is required`;
        return undefined;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;
        try {
            setLoading(true);
            if (isEditMode && formData._id) {
                const response = await customerNonGSTService.updateCustomerNonGST(formData._id, formData);
                setCustomer(prevData =>
                    prevData.map((item: ICustomerNonGST) => (item._id === formData._id ? response.data : item))
                );
                toast.success('Customer updated successfully');
            } else {
                const response = await customerNonGSTService.addCustomerNonGST(formData);
                toast.success('Customer added successfully');
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
        setCustomerToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!customerToDelete) return;

        try {
            await customerNonGSTService.deleteCustomerNonGST(customerToDelete);
            toast.success('Customer deleted successfully');
            setCustomer(prevData => prevData.filter((item: ICustomerNonGST) => item._id !== customerToDelete));
            fetchCustomer(paginationModel.page, paginationModel.pageSize);
        } catch (error: any) {

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

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text('Purchase List', 14, 15);

        // Prepare the data
        const tableData = customer.map((c: ICustomerNonGST) => [
            c.no,
            c.customerName,
            c.mobileNumber,
            c.aadhar,
            c.panCard,
            c.reference,
            // Add more fields as needed
        ]);

        // Add the table
        doc.autoTable({
            head: [['No', 'Customer Name', 'Mobile Number', 'Aadhar', 'PanCard', 'siteName', 'siteAddress', 'reference']],
            body: tableData,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [123, 78, 255] },
        });

        // Save the PDF
        doc.save('purchases-list.pdf');
    };

    const CustomToolbar = () => (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ButtonGroup variant="contained" sx={{ gap: 1 }}>
                <Button
                    onClick={downloadPDF}
                    startIcon={<FileDownloadIcon />}
                    sx={{ bgcolor: '#c60055', color: 'white' }}
                >
                    Download PDF
                </Button>
            </ButtonGroup>
            <GridToolbar />
        </Box>
    );

    const CustomPagination = () => {
        // Calculate pageCount correctly
        const pageCount = paginationModel.pageSize === -1
            ? 1
            : Math.max(1, Math.ceil(totalRows / paginationModel.pageSize));

        const handlePageChange = (newPage: number) => {
            // Ensure newPage is within valid range
            if (newPage >= 0 && newPage < pageCount) {
                setPaginationModel(prev => ({ ...prev, page: newPage }));
                setShouldFetch(true);
            }
        };

        const handlePageSizeChange = (newSize: number) => {
            const newModel = {
                page: 0, // Reset to first page when changing page size
                pageSize: newSize
            };
            setPaginationModel(newModel);
            setShouldFetch(true);
        };

        // Calculate current range of items being displayed
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

    const handleRowExpansion = (rowId: string) => {
        const selectedCustomer = customer.find((c) => c._id == rowId);
        setSelectedProducts(selectedCustomer?.products || [])
        setExpandDialogOpen(true);
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    };

    const getDetailPanelContent = useCallback((row: any) => {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom component="div">
                    Products
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Product Name</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Rate</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedProducts.map((product: IProducts, index: number) => (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                    {product.productName}
                                </TableCell>
                                <TableCell align="right">{product.quantity}</TableCell>
                                <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        );
    }, []);

    // Fetch products on component mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productService.getAllProducts();
                setProducts(response.data.products || []);
            } catch (error: any) {
                toast.error('Failed to fetch products');
            }
        };
        fetchProducts();
    }, []);
    const CustomRow = ({ row }: any) => (
        <>
            <TableRow>
                {columns.map((column) => (
                    <TableCell key={column.field}>
                        {column.renderCell ?
                            column.renderCell({ row } as any) :
                            row[column.field]
                        }
                    </TableCell>
                ))}
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length}>
                    <Collapse in={expandedRows.has(row._id)} timeout="auto" unmountOnExit>
                        {getDetailPanelContent(row)}
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );

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
                                        name="customerName"
                                        label="Customer Name"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="mobileNumber"
                                        label="Mobile Number"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        required
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
                                        required
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="partnerNumber"
                                        label="partnerNumber"
                                        value={formData.partnerNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </Box>
                            </Stack>

                            {/* third Row */}
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box flex={1}>
                                    <FormInput
                                        name="reference"
                                        label="Reference"
                                        value={formData.reference}
                                        onChange={handleChange}
                                        required
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="referenceNumber"
                                        label="ReferenceNumber"
                                        value={formData.referenceNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="residentAddress"
                                        label="Resident Address"
                                        value={formData.residentAddress}
                                        onChange={handleChange}
                                        required
                                    />
                                </Box>
                            </Stack>

                            {/* 4 Row */}
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box flex={1}>
                                    <Button
                                        onClick={addProduct}
                                        startIcon={<AddIcon />}
                                        sx={{ mt: 2 }}
                                    >
                                        Aadhar Photo
                                    </Button>
                                </Box>
                                <Box flex={1}>
                                    <Button
                                        onClick={addProduct}
                                        startIcon={<AddIcon />}
                                        sx={{ mt: 2 }}
                                    >
                                        Pan Card Photo
                                    </Button>
                                </Box>
                                <Box flex={1}>
                                    <Button
                                        onClick={addProduct}
                                        startIcon={<AddIcon />}
                                        sx={{ mt: 2 }}
                                    >
                                        Customer Photo
                                    </Button>
                                </Box>
                            </Stack>

                            {/* sites Section */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Sites</Typography>
                                <Stack spacing={2}>
                                    {formData.sites.map((site, index) => (
                                        <Paper key={index} sx={{ p: 2 }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                                <Box flex={1}>
                                                    <FormInput
                                                        name="siteAddress"
                                                        label="Site Address"
                                                        value={site.siteAddress}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </Box>

                                                <Box flex={1}>
                                                    <FormInput
                                                        name="siteName"
                                                        label="Site Name"
                                                        value={site.siteName}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </Box>
                                                {formData.sites.length > 1 && (
                                                    <IconButton onClick={() => removeSite(index)} color="error">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                                <Button
                                    onClick={addSite}
                                    color='success'
                                    variant='outlined'
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Add Site
                                </Button>
                            </Box>

                            {/* Products Section */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Products</Typography>
                                <Stack spacing={2}>
                                    {formData.products.map((product, index) => (
                                        <Paper key={index} sx={{ p: 2 }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                                <Box flex={1}>
                                                    <FormInput
                                                        name={`products.${index}productName`}
                                                        label="Product Name"
                                                        value={product.productName}
                                                        required
                                                    />
                                                </Box>
                                                <Box flex={1}>
                                                    <FormInput
                                                        name={`products.${index}size`}
                                                        label="size"
                                                        type="number"
                                                        value={product.size.toString()}
                                                    />
                                                </Box>
                                                <Box flex={1}>
                                                    <FormInput
                                                        name={`products.${index}.rate`}
                                                        label="Rate"
                                                        type="number"
                                                        value={product.rate?.toString()}
                                                    />
                                                </Box>
                                                <Box flex={1}>
                                                    <Typography>
                                                        Amount: ₹{Number(product.amount).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                                {formData.products.length > 1 && (
                                                    <IconButton onClick={() => removeProduct(index)} color="error">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                                <Button
                                    onClick={addProduct}
                                    color='success'
                                    variant='outlined'
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Add Product
                                </Button>
                            </Box>
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
            <Dialog
                open={expandDialogOpen}
                onClose={() => setExpandDialogOpen(false)}
            >
                <DialogTitle>products</DialogTitle>
                <DialogContent>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom component="div">
                            Products
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell align="right">Size</TableCell>
                                    <TableCell align="right">Rate</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedProducts.map((product: IProducts, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell component="th" scope="row">
                                            {product.productName}
                                        </TableCell>
                                        <TableCell align="right">{product.size}</TableCell>
                                        <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </DialogContent>
            </Dialog>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={customer}
                    columns={[
                        ...columns,
                        {
                            field: 'expand',
                            headerName: '',
                            width: 50,
                            sortable: false,
                            renderCell: (params) => (
                                <IconButton
                                    onClick={() => {
                                        const newExpandedRows = new Set(expandedRows);
                                        if (newExpandedRows.has(params.row._id)) {
                                            newExpandedRows.delete(params.row._id);
                                        } else {
                                            newExpandedRows.add(params.row._id);
                                        }
                                        setExpandedRows(newExpandedRows);
                                    }}
                                >
                                    {expandedRows.has(params.row._id) ?
                                        <KeyboardArrowUpIcon /> :
                                        <KeyboardArrowDownIcon />
                                    }
                                </IconButton>
                            )
                        }
                    ]}
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
                        '& .expanded-row': {
                            backgroundColor: '#fafafa',
                            '& .MuiCollapse-root': {
                                padding: 2,
                            },
                        },
                    }}
                    slots={{
                        toolbar: CustomToolbar,
                        pagination: CustomPagination,
                        loadingOverlay: () => (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress color="primary" />
                            </Box>
                        ),
                    }}
                    getRowClassName={(params) =>
                        expandedRows.has(params.row._id) ? 'expanded-row' : ''
                    }
                    getDetailPanelContent={(params) => expandedRows.has(params.row._id) ? (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Products
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product Name</TableCell>
                                        <TableCell align="right">Product Name</TableCell>
                                        <TableCell align="right">Rate</TableCell>
                                        <TableCell align="right">size</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {params.row.products.map((product: IProducts, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell component="th" scope="row">
                                                {product.productName}
                                            </TableCell>
                                            <TableCell align="right">{product.productName}</TableCell>
                                            <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                                            <TableCell align="right">₹{product.size}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                                            Total:
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            ₹{params.row.amount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    ) : null}
                // getDetailPanelHeight={() => 'auto'}
                // detailPanelExpandedRowIds={Array.from(expandedRows)}
                />
            </Paper>
        </Box>
    );
};

export default CustomerNonGST;