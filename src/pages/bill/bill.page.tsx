import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { billService } from '../../api/bill.service'
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
    Grid,
    TextField,
    debounce,
    Divider,
    Card,
    CardContent,
    Chip
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
import { ICutomer, Iprizefix, ISite } from 'src/DTO/customer.dto';
import CommonDataTable from '../../components/dataTable/dataTable.component';
import { customerService } from '../../api/customer.service';
import { debug } from 'console';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import ListAltIcon from '@mui/icons-material/ListAlt'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import DescriptionIcon from '@mui/icons-material/Description'
import PhoneIcon from '@mui/icons-material/Phone'
import NumbersIcon from '@mui/icons-material/Numbers'
import LocationOnIcon from '@mui/icons-material/LocationOn'


declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface ISearchOption {
    customerName?: string
    startingDate?: Date;
    endingDate?: Date;
    site?: string;
}

const initialSearch: ISearchOption = {
    customerName: '',
    site: '',
    startingDate: new Date(),
    endingDate: new Date(),
}

const initialSite = {
    siteName: '',
    siteAddress: ''
};

export interface IBill {
    _id?: string;
    billName: string;
    mobileNumber: string;
    partnerName: string;
    partnerMobileNumber: string;
    date: Date;
    billTo: string;
    reference: string;
    referenceMobileNumber: string;
    billAddress: string;
    siteName: string;
    siteAddress: string;
    pancard: string;
    // products: IProducts[],
    serviceCharge: Number;
    damageCharge: Number;
    totalPayment: Number;
    [key: string]: any;
}

const initialFormData: IBill = {
    _id: '',
    billName: '',
    mobileNumber: '',
    partnerName: '',
    partnerMobileNumber: '',
    date: new Date(),
    billTo: '',
    reference: '',
    referenceMobileNumber: '',
    billAddress: '',
    siteName: '',
    siteAddress: '',
    pancard: '',
    // products: initialProduct,
    serviceCharge: 0,
    damageCharge: 0,
    totalPayment: 0
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

const Bill = () => {
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);
    const [bill, setBill] = useState<IBill>();
    const [billData, setBillData] = useState<any>();
    const [formData, setFormData] = useState<ISearchOption>(initialSearch);
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
    const [productOptions, setProductOptions] = useState<Array<any>>([]);
    const [customers, setCustomers] = useState<ICutomer[]>([])
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await customerService.getAllCustomers();
                // Group products by name with their available sizes
                const groupedProducts = response.data.products.reduce((acc: any[], product: ICutomer) => {
                    // const existing = acc.find(p => p.customerName === product.customerName);
                    // if (existing) {
                    //     if (!existing.sites.includes(product.size)) {
                    //         existing.sizes.push(product.size);
                    //     }
                    // } else {
                    acc.push({ customerName: product.customerName, sites: product.sites });
                    // }
                    return acc;
                }, []);
                setProductOptions(groupedProducts);
            } catch (error) {
                toast.error('Failed to fetch products');
            }
        };
        fetchCustomer();
    }, []);

    const handleClose = () => {
        setOpen(false);
        setIsEditMode(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;
        try {
            setLoading(true);
            console.log(formData, "sub,itse");

            const response = await billService.getAllBill({
                customerName: formData.customerName,
                siteName: formData.site,
                givenStartDate: formData.startingDate,
                givenEndDate: formData.endingDate
            });

            // Make sure to use the correct path to access bill data
            const newBills = response.data?.bill || [];
            setBillData(response.data.billData);
            setBill(newBills);
            handleClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} purchase`);
        } finally {
            setLoading(false);
        }
    };
    const CustomToolbar = () => {
        const handleExport = (type: string) => {
            if (type === 'pdf') {
                // const visibleColumns = columns.filter(col => {
                //     return columnVisibility[col.field] !== false && col.field !== 'actions';
                // });
                // downloadPDF(visibleColumns);
            }
        };

        return (
            <GridToolbarContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>

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

        const tableData = bill?.map((purchase: any) =>
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
                totals[key] = bill?.reduce((sum: number, purchase: any) => sum + (purchase[key] || 0), 0);
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
                    pageTotals[key] = pageData.reduce((sum: any, row: any) => {
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


    // Add site handling functions
    const handleSiteChange = (value: any) => {
        setFormData(prev => {
            return {
                ...prev,
                sites: value
            };
        });
    };

    // Add this configuration object
    const filterOperators = {
        string: [
            {
                label: 'contains',
                value: 'contains',
                getApplyFilterFn: (filterItem: GridFilterItem) => {
                    if (!filterItem.value) return null;
                    return ({ value }: { value: any }) => {
                        const cellValue = (value?.toString() || '').toLowerCase();
                        const searchValue = (filterItem.value?.toString() || '').toLowerCase();
                        return cellValue.includes(searchValue);
                    };
                },
            },
        ],
        number: [
            {
                label: 'contains',
                value: 'contains',
                getApplyFilterFn: (filterItem: GridFilterItem) => {
                    if (!filterItem.value) return null;
                    return ({ value }: { value: any }) => {
                        const cellValue = (value?.toString() || '').toLowerCase();
                        const searchValue = (filterItem.value?.toString() || '').toLowerCase();
                        return cellValue.includes(searchValue);
                    };
                },
            },
        ],
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleSearchChange = (field: keyof ISearchOption, value: any) => {
        setFormData(prev => {
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const fetchCustomers = debounce(async (query) => {
        if (query) {
            try {
                const response = await customerService.getCustomerByName(query);
                let data = await response.data.customers;
                data = data.map((c: ICutomer) => {
                    return {
                        ...c,
                        customerName: c.customerName?.replace(/['"]/g, "").trim()
                    }
                })
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


    // Handle customer selection
    const handleCustomerSelect = (customer: ICutomer) => {
        setSearchQuery(customer.customerName as string);
        setCustomers([]);

        setProductOptions(customer.sites || []);

        // setProductOptions((prev) => {
        //     const groupedProducts = customer.prizefix?.reduce((acc: any[], product: Iprizefix) => {
        //         const existing = acc.find(p => p.name === product.productName);
        //         if (existing) {
        //             if (!existing.sizes.includes(product.size)) {
        //                 existing.sizes.push(product.size);
        //                 existing.rate = product.rate
        //             }
        //         } else {
        //             acc.push({ name: product.productName, sizes: [product.size] });
        //         }
        //         return acc;
        //     }, []) || []; // Use empty array as fallback if groupedProducts is undefined

        //     return [
        //         ...prev,
        //         ...groupedProducts
        //     ];
        // });

        setFormData((prev) => {

            const updatedForm = {
                ...prev,
                customerName: customer.customerName as string,
                customerId: customer._id || '',
                mobileNumber: customer.mobileNumber as string,
            };

            if (customer.sites?.length || 0 < 2) {
                updatedForm.site = customer?.sites?.[0].siteName || '';
            }

            return updatedForm;
        });
    };

    const handleSiteSelect = (site: string) => {
        setFormData(prev => {
            return {
                ...prev,
                siteName: site
            }
        })
    }

    const DetailItem = ({ label, value, icon }: any) => (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            {icon && React.cloneElement(icon, { sx: { color: '#94a3b8', fontSize: '1.25rem' } })}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );

    const SectionHeading = ({ title, icon }: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            {React.cloneElement(icon, { sx: { color: '#6366f1', fontSize: '1.5rem' } })}
            <Typography variant="h6" sx={{
                fontWeight: '600',
                color: '#1f2937',
                fontSize: '1.125rem'
            }}>
                {title}
            </Typography>
        </Box>
    );

    const DateItem = ({ label, date }: any) => (
        <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                {new Date(date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}
            </Typography>
        </Box>
    );

    const StyledCard = styled(Card)({
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        backgroundColor: '#f7f7f7',
        padding: '20px',
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.15)',
        },
    });

    return (
        <Box sx={{ p: 2 }}>
            <Form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex' }}>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flexDirection: { xs: 'column', md: 'row' },
                        width: '100%',
                        mb: 2
                    }}>
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
                                    textAlign: 'justify',
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
                                        textAlign: 'justify',
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
                        <Box flex={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <StyledSelect
                                fullWidth
                                value={formData.site || ''}
                                onChange={(e) => { handleSearchChange('site', e.target.value); handleSiteChange(e.target.value) }}
                                disabled={!formData.customerName}
                                displayEmpty
                                renderValue={(value: unknown) => (value as string) || 'Select Site'}
                                sx={{ minWidth: { xs: '100%', height: '35px', md: 150, textAlign: 'justify' } }}
                            >
                                <MenuItem disabled value="" sx={{ textAlign: 'justify' }}>
                                    Select Site
                                </MenuItem>
                                {productOptions.map((site: ISite) => (
                                    <MenuItem
                                        key={site.siteName}
                                        value={site.siteName}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'var(--primary-color)',
                                            }
                                        }}
                                        onClick={() => handleSiteSelect(site.siteName)}
                                    >
                                        {site.siteName}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <FormInput
                        name="startingDate"
                        label="Starting Date"
                        type="date"
                        fullWidth={false}
                        value={formData.startingDate}
                        onChange={handleChange}
                        required
                        sx={{
                            '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                cursor: 'pointer',
                                padding: '8px',
                                filter: 'invert(0.5)',
                                '&:hover': {
                                    opacity: 0.7
                                }
                            },
                            '& input[type="date"]': {
                                colorScheme: 'light'
                            }
                        }}
                    />
                    <FormInput
                        name="endingDate"
                        label="Ending Date"
                        fullWidth={false}
                        type="date"
                        value={formData.endingDate}
                        onChange={handleChange}
                        required
                        sx={{
                            '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                cursor: 'pointer',
                                padding: '8px',
                                filter: 'invert(0.5)',
                                '&:hover': {
                                    opacity: 0.7
                                }
                            },
                            '& input[type="date"]': {
                                colorScheme: 'light'
                            }
                        }}
                    />
                    <Button type="submit" variant="contained" sx={{ bgcolor: '#7b4eff', color: 'white' }}>
                        Get Bill
                    </Button>
                </Box>
            </Form>
            {billData ? (
                <Box sx={{
                    p: 3,
                    margin: '1.5rem auto',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '4px',
                        height: '100%',
                        backgroundColor: '#6366f1'
                    }
                }}>
                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" sx={{
                            fontWeight: '600',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <ReceiptLongIcon sx={{ color: '#6366f1', fontSize: '1.5rem' }} />
                            Bill Details
                        </Typography>
                        <Divider sx={{ borderColor: '#e5e7eb' }} />
                    </Box>

                    {/* Bill Summary */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <DetailItem label="Bill Name" value={billData.billName} icon={<DescriptionIcon />} />
                            <DetailItem label="Mobile" value={billData.mobileNumber} icon={<PhoneIcon />} />
                            <DetailItem label="Bill Number" value={billData.billNumber} icon={<NumbersIcon />} />
                            <DetailItem label="Partner" value={billData.partnerName} icon={<PersonIcon />} />
                        </Grid>
                        <Grid item xs={4}>
                            <DetailItem label="Partner Mobile" value={billData.partnerMobileNumber} icon={<PhoneIcon />} />
                            <DetailItem label="Reference" value={billData.reference} icon={<ConnectWithoutContactIcon />} />
                            <DetailItem label="Reference Mobile" value={billData.referenceMobileNumber} icon={<PhoneIcon />} />
                            <DetailItem label="Site" value={billData.siteName} icon={<LocationOnIcon />} />
                        </Grid>
                        <Grid item xs={4}>
                            <Box sx={{
                                mb: 3,
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                p: 2,
                                border: '1px solid #e2e8f0'
                            }}>
                                <SectionHeading title="Address Info" icon={<HomeWorkIcon />} />
                                <DetailItem label="Bill Address" value={billData.billAddress} />
                                <DetailItem label="Site Address" value={billData.siteAddress} />
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Address Section */}


                    {/* Challans Section */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeading title="Challans" icon={<ListAltIcon />} />
                        {/* Render Challans dynamically as needed */}
                        <Grid container spacing={2}>
                            {billData.challans.map((challan: any) => (
                                <Grid item xs={12} sm={6} key={challan._id}>
                                    <Box sx={{
                                        backgroundColor: '#F9F9F9',
                                        borderRadius: '8px',
                                        p: 2,
                                        textAlign: 'left',
                                        border: '1px solid #E0E0E0'
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                                            Challan ID
                                        </Typography>
                                        <Chip
                                            label={challan._id}
                                            color="primary"
                                            sx={{
                                                fontWeight: '500',
                                                fontSize: '0.875rem',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Footer Section */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 3,
                        borderTop: '1px solid #E0E0E0',
                        pt: 2
                    }}>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: '400' }}>
                            <strong>Today's Date:</strong> {new Date(billData.today).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: '400' }}>
                            <strong>Bill Date:</strong> {new Date(billData.date).toLocaleDateString()}
                        </Typography>
                    </Box>
                </Box>
            ) : null
            }

            <Box>
                {/* {bill?.map((billMonth: any, idx: any) => (
                    <Paper sx={{ width: '100%' }} key={idx}>
                        <CommonDataTable
                            loading={false}
                            rows={{
                                products: billMonth.products,
                                year: billMonth.year,
                                month: billMonth.month,
                                totalAmount: billMonth.totalAmount
                            }}
                        />
                    </Paper>
                ))} */}
                {billData?.monthData?.map((monthEntry: any) => (
                    <CommonDataTable
                        key={`${monthEntry.year}-${monthEntry.month}`}
                        rows={{
                            products: monthEntry.products,
                            year: monthEntry.year,
                            month: monthEntry.month
                        }}
                        loading={false}
                    />
                ))}
                {/* {
        // Loop over each month in the bill array and display a DataGrid for each one
        bill?.map((billMonth: any, idx: any) => (
            <Paper sx={{ height: 600, width: '100%', marginBottom: 2 }} key={idx}>
                <CommonDataTable
                    loading={false}
                    rows={{
                        year: billMonth.year,
                        month: billMonth.month,
                        totalAmount: billMonth.totalAmount,
                        products: billMonth.products
                    }}
                />
            </Paper>
        ))
    }

{/* {
    bill?.map((billMonth: any, idx: any) => (
        <Paper sx={{ height: 600, width: '100%', marginBottom: 2 }} key={idx}>
            <CommonDataTable
                loading={false}
                rows={{
                    products: billMonth.products,
                    year: billMonth.year,
                    month: billMonth.month,
                    totalAmount: billMonth.totalAmount
                }}
            />
        </Paper>
    ))
} */}

            </Box>



        </Box>
    );
};

export default Bill;