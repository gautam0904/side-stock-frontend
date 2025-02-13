import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { customerService } from '../../api/customer.service'
import { productService } from '../../api/product.service';
import { Iprizefix, ISite } from 'src/DTO/customer.dto';
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
    debounce
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridFilterModel, GridLogicOperator, GridFilterItem } from '@mui/x-data-grid';
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
import PhotoIcon from '@mui/icons-material/Photo';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { useLocation } from 'react-router-dom';

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

const initialProduct: IProducts = {
    productName: '',
    size: '',
    rate: 0,
};

const initialSite: ISite = {
    siteName: '',
    siteAddress: '',
    challanNumber: 'S1C1'
};

interface ICutomer {
    _id?: string;
    customerName: string;
    mobileNumber: string;
    partnerName: string;
    partnerMobileNumber: string;
    reference: string;
    referenceMobileNumber: string;
    residentAddress: string;
    aadharNo: string;
    pancardNo: string;
    GSTnumber: string;
    aadharPhoto: File | string | null;
    panCardPhoto: File | string | null;
    customerPhoto: File | string | null;
    prizefix: Iprizefix[];
    sites: ISite[];
    [key: string]: any;
}

const initialFormData: ICutomer = {
    customerName: '',
    mobileNumber: '',
    partnerName: '',
    partnerMobileNumber: '',
    reference: '',
    referenceMobileNumber: '',
    residentAddress: '',
    aadharNo: '',
    pancardNo: '',
    GSTnumber: '',
    aadharPhoto: null,
    panCardPhoto: null,
    customerPhoto: null,
    prizefix: [{
        size: '',
        productName: '',
        rate: 0,
    }],
    sites: [{
        siteName: '',
        siteAddress: '',
        challanNumber: 'S1C0',
    }],
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

const Customer = () => {
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    const [customer, setCustomer] = useState<ICutomer[]>([]);
    const [formData, setFormData] = useState<ICutomer>(initialFormData);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(true);
    const fetchInProgress = useRef(false);
    const [productPopupOpen, setProductPopupOpen] = useState(false);
    const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
    const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
        items: [],
        quickFilterLogicOperator: 'and' as GridLogicOperator
    });
    const gridRef = useRef<any>(null);
    const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
    const [productOptions, setProductOptions] = useState<Array<{ name: string, sizes: string[] }>>([]);
    const addButtonRef = useRef<HTMLButtonElement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<ICutomer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<ICutomer | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null); 
    const location1 = useLocation(); 
    const [products, setProducts] = useState<IProducts[] | null>(null);



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
        { field: 'customerName', headerName: 'Customer Name', width: 130 },
        { field: 'mobileNumber', headerName: 'Mobile Number', width: 130 },
        { field: 'partnerName', headerName: 'Partner Name', width: 130 },
        { field: 'partnerMobileNumber', headerName: 'Partner MobileNumber', width: 130 },
        { field: 'reference', headerName: 'Reference', width: 130 },
        { field: 'referenceMobileNumber', headerName: 'Reference MobileNumber', width: 130 },
        { field: 'residentAddress', headerName: 'Resident Address', width: 130 },
        { field: 'aadharNo', headerName: 'Aadhar No', width: 150 },
        { field: 'pancardNo', headerName: 'Pancard No', width: 150 },
        { field: 'GSTnumber', headerName: 'GST Number', width: 130 },
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
        setFormData(prev => ({
            ...prev,
            prizefix: prev.prizefix.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            prizefix: [...(prev.prizefix || []), {
                productName: '',
                size: '',
                rate: 0
            }]
        }));
    };

    const removeProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prizefix: prev.prizefix.filter((_, i) => i !== index)
        }));
    };

    const fetchCustomers = useCallback(async () => {
        if (fetchInProgress.current || loading) return;

        try {
            fetchInProgress.current = true;
            setLoading(true);

            const response = await customerService.getAllCustomers({
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            const newCustomers = response.data?.items || [];
            const customersWithNumbers = newCustomers.map((purchase: any, index: number) => ({
                ...purchase,
                id: purchase._id,
                no: index + 1
            }));

            setCustomer(customersWithNumbers);
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
            fetchCustomers();
        }
    }, [shouldFetch, fetchCustomers]);

    const handleClose = () => {
        setOpen(false);
        setIsEditMode(false);
        setFormData(initialFormData);
    };

    // const fetchGSTDetails = async (gstNumber: string) => {
    //     try {
    //         // Using a different free GST API
    //         const response = await fetch(`https://api.gstincheck.co.in/v1/verify/${gstNumber}`, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'apikey': '4ff236814d3317fdd0479ca80b1b4cd4'
    //             }
    //         });

    //         if (!response.ok) {
    //             throw new Error('Failed to fetch GST details');
    //         }

    //         const data = await response.json();

    //         // Check if the API call was successful
    //         if (data && data.success) {
    //             return {
    //                 legalName: data.data.lgnm || '',
    //                 tradeName: data.data.tradeNam || '',
    //                 status: data.data.sts || ''
    //             };
    //         } else {
    //             throw new Error(data.message || 'Failed to fetch GST details');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching GST details:', error);
    //         return null;
    //     }
    // };


    const fetchGSTDetails = async (gstNumber: string) => {
        try {
            const response = await fetch(`/api/gst-proxy?gstNumber=${gstNumber}`);

            // Check if response is JSON (based on the 'Content-Type' header)
            const contentType = response.headers.get('Content-Type');
            if (!response.ok || (contentType && !contentType.includes('application/json'))) {
                throw new Error('Expected JSON response, but got something else');
            }

            const data = await response.json();

            if (data?.success) {
                return {
                    legalName: data.data.lgnm || '',
                    tradeName: data.data.tradeNam || '',
                    status: data.data.sts || ''
                };
            }
            throw new Error(data.message || 'Failed to fetch GST details');
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
                }
                return newFormData;
            });
        } else {
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

    const validateMobile = (field: string, value: string) => {
        const mobilePattern = /^[6-9]\d{9}$/;
        if (!value) return `${field} is required`;
        if (!mobilePattern.test(value)) return 'Invalid Mobile Number';
        return undefined;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;
        try {
            setLoading(true);
            const formDataToSend = new FormData();
            if (formData.aadharPhoto instanceof File) {
                formDataToSend.append('aadharPhoto', formData.aadharPhoto);
            }
            if (formData.panCardPhoto instanceof File) {
                formDataToSend.append('panCardPhoto', formData.panCardPhoto);
            }
            if (formData.customerPhoto instanceof File) {
                formDataToSend.append('customerPhoto', formData.customerPhoto);
            }
            const cleanData = {
                ...formData,
                aadharPhoto: undefined,
                panCardPhoto: undefined,
                customerPhoto: undefined
            };

            Object.keys(formData).forEach(key => {
                const value = formData[key as keyof ICutomer];
                console.log(key);
                if (key === 'prizefix' || key === 'sites') {
                    console.log(formData[key]);

                    const value = formData[key];
                    if (Array.isArray(value)) {
                        formDataToSend.append(key, JSON.stringify(value));
                    }
                } else {
                    formDataToSend.append(key, String(value));
                }
            });

            if (isEditMode && formData._id) {
                await customerService.updateCustomer(formData._id, formDataToSend);
                toast.success('Customer updated successfully');
            } else {
                await customerService.addCustomer(formDataToSend);
                toast.success('Customer added successfully');
            }
            handleClose();
            setShouldFetch(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} customer`);
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
            await customerService.deleteCustomer(customerToDelete);
            toast.success('Customer deleted successfully');

            // Update purchases with recalculated numbers
            setCustomer(prevData => {
                const filteredData = prevData.filter((item: ICutomer) => item._id !== customerToDelete);
                return filteredData.map((purchase: ICutomer, index: number) => ({
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
        setFormData(purchase);
        setIsEditMode(true);
        setOpen(true);
        inputRef.current?.focus();
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

        doc.setFontSize(16);
        doc.setTextColor(123, 78, 255);
        doc.text('Purchase List', 14, 15);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const headers = visibleColumns.map(col => col.headerName);
        const keys = visibleColumns.map(col => col.field);

        const tableData = customer.map((purchase: any) =>
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

            doc.autoTable({
                head: [headers],
                body: pageData,
                startY: startY,
                styles: {
                    fontSize: 9,
                    cellPadding: { left: 4, right: 4, top: 2, bottom: 2 },
                    lineWidth: 0,
                },
                headStyles: {
                    fillColor: [123, 78, 255],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 11
                },
            });

            startY = (doc as any).lastAutoTable.finalY + 10;

            // Add new page if not the last page
            if (pageIndex < pages.length - 1) {
                doc.addPage();
                startY = 25;
            }
        });

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

    //     setFormData(prev => {
    //         const subTotal = prev.products.reduce((sum, product) => sum + (product.amount || 0), 0);
    //         const transportCost = Number(prev.transportAndCasting) || 0;
    //         const baseAmount = subTotal + transportCost;

    //         const newSgst = (baseAmount * (type === 'sgstRate' ? value : gstRates.sgstRate) / 100);
    //         const newCgst = (baseAmount * (type === 'cgstRate' ? value : gstRates.cgstRate) / 100);
    //         const newIgst = (baseAmount * (type === 'igstRate' ? value : gstRates.igstRate) / 100);

    //         return {
    //             ...prev,
    //             sgst: newSgst,
    //             cgst: newCgst,
    //             igst: newIgst,
    //             totalAmount: baseAmount + (prev.GSTnumber.startsWith('24') ? (newSgst + newCgst) : newIgst)
    //         };
    //     });
    // };

    // const handleGSTRateOptionChange = (value: string) => {
    //     setSelectedGSTRate(value);
    //     if (value === 'custom') {
    //         setIsCustomGstRates(true);
    //         // Keep existing rates when switching to custom
    //         return;
    //     }

    //     setIsCustomGstRates(false);
    //     const numericValue = Number(value);
    //     const isHomeState = formData.GSTnumber.startsWith('24');

    //     setGstRates({
    //         sgstRate: isHomeState ? numericValue / 2 : 0,
    //         cgstRate: isHomeState ? numericValue / 2 : 0,
    //         igstRate: isHomeState ? 0 : numericValue
    //     });

    //     // Recalculate totals with new GST rates
    //     setFormData(prev => {
    //         const subTotal = prev.products.reduce((sum, product) => sum + (product.amount || 0), 0);
    //         const transportCost = Number(prev.transportAndCasting) || 0;
    //         const baseAmount = subTotal + transportCost;

    //         const newSgst = isHomeState ? (baseAmount * (numericValue / 2) / 100) : 0;
    //         const newCgst = isHomeState ? (baseAmount * (numericValue / 2) / 100) : 0;
    //         const newIgst = isHomeState ? 0 : (baseAmount * numericValue / 100);

    //         return {
    //             ...prev,
    //             amount: baseAmount,
    //             sgst: newSgst,
    //             cgst: newCgst,
    //             igst: newIgst,
    //             totalAmount: baseAmount + (isHomeState ? (newSgst + newCgst) : newIgst)
    //         };
    //     });
    // };

    // Fetch products on component mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productService.getAllProducts();
               setProducts(response.data.products);
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

    // Add custom product selection dialog
    const DetailPanelDialog = () => {
        const selectedCustomer = customer.find(p => p._id == selectedProductIndex?.toString());
        if (!selectedCustomer) return null;

        return (
            <Dialog
                open={productPopupOpen}
                onClose={() => setProductPopupOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Customer Details</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>

                        <Grid container spacing={2}>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">GST Number: </Typography>
                                <Typography>{selectedCustomer.GSTnumber}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Customer Name: </Typography>
                                <Typography>{selectedCustomer.customerName}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Mobile Number: </Typography>
                                <Typography>{selectedCustomer.mobileNumber}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Rcedent Address: </Typography>
                                <Typography>{selectedCustomer.residentAddress}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Pan Card Number: </Typography>
                                <Typography>{selectedCustomer.pancardNo}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Aadhar Card Number: </Typography>
                                <Typography>{selectedCustomer.aadharNo}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Partner Name: </Typography>
                                <Typography>{selectedCustomer.partnerName}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Partner Number: </Typography>
                                <Typography>{selectedCustomer.partnerMobileNumber}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Reference : </Typography>
                                <Typography>{selectedCustomer.reference}</Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ display: 'flex' }}>
                                <Typography variant="body2" color="var(--primary-color)">Reference Number: </Typography>
                                <Typography>{selectedCustomer.referenceMobileNumber}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Products Table */}
                    <Typography variant="subtitle1" color='var(--primary-color)' gutterBottom>Products</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell align="right">Rate</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedCustomer.prizefix?.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{product.productName}</TableCell>
                                        <TableCell>{product.size}</TableCell>
                                        <TableCell align="right">₹{product.rate?.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Sites Section */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" color='var(--primary-color)' gutterBottom>Sites</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Site Name</TableCell>
                                        <TableCell>Site Address</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedCustomer?.sites?.map((site, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{site.siteName}</TableCell>
                                            <TableCell>{site.siteAddress}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                    {/* images */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" color='var(--primary-color)' gutterBottom>Documents & Photos</Typography>
                        {selectedCustomer.aadharPhoto && (
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="var(--primary-color)">Aadhar Card:</Typography>
                                <Box
                                    component="img"
                                    src={typeof selectedCustomer.aadharPhoto === 'string' ? selectedCustomer.aadharPhoto : ''}
                                    alt="Customer Photo"
                                    sx={{
                                        width: '100%',
                                        height: 200,
                                        objectFit: 'cover',
                                        borderRadius: 1
                                    }}
                                />
                            </Grid>
                        )}
                        {selectedCustomer.panCardPhoto && (
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="var(--primary-color)">Pan Card Card:</Typography>
                                <Box
                                    component="img"
                                    src={typeof selectedCustomer.panCardPhoto === 'string' ? selectedCustomer.panCardPhoto : ''}
                                    alt="Pancard Photo"
                                    sx={{
                                        width: '100%',
                                        height: 200,
                                        objectFit: 'cover',
                                        borderRadius: 1
                                    }}
                                />
                            </Grid>
                        )}
                        {selectedCustomer.customerPhoto && (
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="var(--primary-color)">Customer Card:</Typography>
                                <Box
                                    component="img"
                                    src={typeof selectedCustomer.customerPhoto === 'string' ? selectedCustomer.customerPhoto : ''}
                                    alt="Customer Photo"
                                    sx={{
                                        width: '100%',
                                        height: 200,
                                        objectFit: 'cover',
                                        borderRadius: 1
                                    }}
                                />
                            </Grid>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button color='error' onClick={() => setProductPopupOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Modify the product input section in the form
    const productInput = (index: number, product: Iprizefix) => (
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
                                    backgroundColor: '#7b4eff',
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
                                onClick={()=>{
                                    setFormData(prev => {
                                        const value = products?.find(p => p.productName == product.productName && p.size === size)?.rate
                                        return {
                                        ...prev,
                                        prizefix: prev.prizefix.map((item, i) =>
                                            i === index ? { ...item, rate: value } : item
                                        )
                                    }});
                                }}
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
    const addSite = () => {
        setFormData(prev => {
            const newSite = {
                ...initialSite,
                challanNumber: `S${Array.isArray(prev.sites) ? prev.sites.length : 0}C0`
            }
            return {
                ...prev,
                sites: Array.isArray(prev.sites) ? [...prev.sites, newSite] : [newSite]
            }
        });
    };

    const removeSite = (index: number) => {
        setFormData(prev => ({
            ...prev,
            sites: Array.isArray(prev.sites)
                ? prev.sites.filter((_, i) => i !== index)
                : [initialSite]
        }));
    };

    const handleSiteChange = (index: number, field: keyof ISite, value: string) => {
        setFormData(prev => {
            const currentSites = Array.isArray(prev.sites) ? prev.sites : [initialSite];
            const newSites = [...currentSites];
            newSites[index] = {
                ...newSites[index],
                [field]: value
            };
            return {
                ...prev,
                sites: newSites
            };
        });
    };

    // Add photo upload functionality
    const handlePhotoUpload = async (field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto', file: File) => {
        try {
            console.log('Uploading file:', field, file); // Debug log
            setFormData(prev => ({
                ...prev,
                [field]: file
            }));
            toast.success(`${field} selected successfully`);
        } catch (error) {
            console.error('Photo upload error:', error);
            toast.error(`Failed to process ${field}`);
        }
    };

    // Photo upload buttons with proper icons
    const PhotoUploadButton = ({ field, icon, label }: {
        field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto',
        icon: React.ReactNode,
        label: string
    }) => (
        <Box flex={1}>
            <input
                type="file"
                accept="image/*"
                id={`${field}-upload`}
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        console.log('File selected:', field, file); // Debug log
                        handlePhotoUpload(field, file);
                    }
                }}
            />
            <label htmlFor={`${field}-upload`}>
                <Button
                    component="span"
                    startIcon={icon}
                    sx={{
                        mt: 2,
                        bgcolor: '#7b4eff',
                        color: 'white',
                        '&:hover': {
                            bgcolor: '#6a3dd9',
                        }
                    }}
                >
                    {label}
                </Button>
            </label>
        </Box>
    );

    useEffect(() => {
        if (open && addButtonRef.current) {
          
            addButtonRef.current?.focus();
        }
      }, [ location.pathname]);

    const handleCustomerSearchChange = (e: any) => {
        const query = e.target.value;
        setSearchQuery(query);
        fetchCustomerss(query);
      };

      const fetchCustomerss = debounce(async (query) => {
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

          const handleCustomerSelect = (customer: ICutomer) => {
            setSelectedCustomer(customer);
            setSearchQuery(customer.customerName as string); // Optionally, set the search input to the selected customer name
            setCustomers([]);
        
            setFormData((prev) => {
        
              const updatedForm = {
                ...prev,
                customerName: customer.customerName as string,
                customerId: customer._id || '',
                mobileNumber: customer.mobileNumber as string,
              };
              if (customer.sites?.length || 0 < 2) {
                const challanNUmber =  customer?.sites?.[0]?.challanNumber.split('C') || ['S0', '-1'];
                updatedForm.sites[0].siteName = customer?.sites?.[0].siteName || '';
                updatedForm.sites[0].siteAddress = customer?.sites?.[0].siteAddress || '';
              }
        
              return updatedForm;
            });
          };

    return (
        <Box sx={{ p: 2 }}>
            <Button
                ref={addButtonRef}
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#7b4eff', color: 'white', mb: 2 }}
                onClick={() => {
                    setIsEditMode(false);
                    setFormData(initialFormData);
                    setOpen(true);
                    inputRef.current?.focus();
                }}
                autoFocus
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
                        {isEditMode ? 'Edit Customer' : 'Add New Customer'}
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
                                        ref={inputRef}
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
                                        validate={validateMobile}
                                        type="tel"
                                        required
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="GSTnumber"
                                        label="GST Number"
                                        value={formData.GSTnumber}
                                        onChange={handleChange}
                                        validate={validateGST}
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
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="partnerMobileNumber"
                                        label="Partner Mobile Number"
                                        value={formData.partnerMobileNumber}
                                        onChange={handleChange}
                                        validate={validateMobile}
                                        type="tel"
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="residentAddress"
                                        label="Resident Address"
                                        value={formData.residentAddress}
                                        onChange={handleChange}
                                    />
                                </Box>
                            </Stack>

                            {/* Third Row */}
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box flex={1}>
                                    <FormInput
                                        name="reference"
                                        label="Reference"
                                        value={formData.reference}
                                        onChange={handleChange}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="referenceMobileNumber"
                                        label="Reference Mobile Number"
                                        value={formData.referenceMobileNumber}
                                        onChange={handleChange}
                                        validate={validateMobile}
                                        type="tel"
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="aadharNo"
                                        label="Aadhar No"
                                        value={formData.aadharNo}
                                        onChange={handleChange}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <FormInput
                                        name="pancardNo"
                                        label="Pan Card No"
                                        value={formData.pancardNo}
                                        onChange={handleChange}
                                    />
                                </Box>
                            </Stack>

                            {/* 5 Row */}
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                                <PhotoUploadButton
                                    field="aadharPhoto"
                                    icon={<AddAPhotoIcon />}
                                    label="Aadhar Photo"
                                />
                                <PhotoUploadButton
                                    field="panCardPhoto"
                                    icon={<CreditCardIcon />}
                                    label="Pan Card Photo"
                                />
                                <PhotoUploadButton
                                    field="customerPhoto"
                                    icon={<PersonIcon />}
                                    label="Customer Photo"
                                />
                            </Stack>

                            {/* Sites Section */}
                            <Paper sx={{ p: 3, mt: 3 }}>
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
                                                <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', justifyItems: "center" }}>
                                                    {index == formData.sites.length - 1 ? <Button
                                                        onClick={addSite}
                                                        startIcon={<AddIcon />}
                                                        variant="outlined"
                                                        sx={{
                                                            color: 'var(--success-color)',
                                                            border: '2px solid var(--success-color)',
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        Add Site
                                                    </Button> : ""}
                                                    <IconButton
                                                        onClick={() => removeSite(index)}
                                                        color="error"
                                                        size="small"
                                                        sx={{
                                                            marginLeft: "3px",
                                                            '&:hover': {
                                                                backgroundColor: 'error.lighter'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>

                            </Paper>

                            {/* Products Section */}
                            <Paper sx={{ p: 3, mt: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                                    Products
                                </Typography>
                                <Stack spacing={2}>
                                    {formData.prizefix?.map((product, index) => (
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
                                                        name={`products.${index}.rate`}
                                                        label="Rate"
                                                        type="number"
                                                        value={product.rate?.toString()}
                                                        onChange={(e) => handleProductChange(index, 'rate', Number(e.target.value))}
                                                        required
                                                    />
                                                </Box>
                                                <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                                                    {index == formData.prizefix.length - 1 ?
                                                        <Button
                                                            onClick={addProduct}
                                                            startIcon={<AddIcon />}
                                                            variant="outlined"
                                                            sx={{
                                                                color: 'var(--success-color)',
                                                                border: '2px solid var(--success-color)',
                                                                padding: '4px'
                                                            }}
                                                        >
                                                            Add Product
                                                        </Button> : ''
                                                    }
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
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>

                            </Paper>

                            {/* Action Buttons */}
                            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                                <Button onClick={handleClose} variant="contained" color="error">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                                    {isEditMode ? 'Update Customer' : 'Save CUstomer'}
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
                    rows={customer}
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

export default Customer;