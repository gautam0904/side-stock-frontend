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
    Grid
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
import CommonDataTable from '@components/dataTable/dataTable.component';
import { customerService } from 'src/api/customer.service';

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
    width: '90%',
    maxWidth: '1200px',
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
    const [bill, setBill] = useState<IBill>([]);
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
    const [productOptions, setProductOptions] = useState<Array<{ customerName: string, sites: string[] }>>([]);
    const [bill2, setBill2] = useState([
        {
            "year": 2024,
            "month": 1,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 1,
                    "year": 2024,
                    "previousRestBill": 15999.999994212963,
                    "startingDate": "2024-01-01T00:00:00.000Z",
                    "endingDate": "2024-01-30T18:30:00.000Z",
                    "dayCount": 30.770833333333332
                }
            ]
        },
        {
            "year": 2024,
            "month": 2,
            "totalAmount": 14999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 14999.999994212963,
                    "month": 2,
                    "year": 2024,
                    "previousRestBill": 30999.999988425927,
                    "startingDate": "2024-01-31T18:30:00.000Z",
                    "endingDate": "2024-02-28T18:30:00.000Z",
                    "dayCount": 29
                }
            ]
        },
        {
            "year": 2024,
            "month": 3,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 3,
                    "year": 2024,
                    "previousRestBill": 46999.99998263889,
                    "startingDate": "2024-02-29T18:30:00.000Z",
                    "endingDate": "2024-03-30T18:30:00.000Z",
                    "dayCount": 31
                }
            ]
        },
        {
            "year": 2024,
            "month": 4,
            "totalAmount": 15499.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15499.999994212963,
                    "month": 4,
                    "year": 2024,
                    "previousRestBill": 62499.999976851854,
                    "startingDate": "2024-03-31T18:30:00.000Z",
                    "endingDate": "2024-04-29T18:30:00.000Z",
                    "dayCount": 30
                }
            ]
        },
        {
            "year": 2024,
            "month": 5,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 5,
                    "year": 2024,
                    "previousRestBill": 78499.99997106481,
                    "startingDate": "2024-04-30T18:30:00.000Z",
                    "endingDate": "2024-05-30T18:30:00.000Z",
                    "dayCount": 31
                }
            ]
        },
        {
            "year": 2024,
            "month": 6,
            "totalAmount": 15499.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15499.999994212963,
                    "month": 6,
                    "year": 2024,
                    "previousRestBill": 88999.99996527778,
                    "startingDate": "2024-05-31T18:30:00.000Z",
                    "endingDate": "2024-06-29T18:30:00.000Z",
                    "dayCount": 30
                }
            ]
        },
        {
            "year": 2024,
            "month": 7,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 7,
                    "year": 2024,
                    "previousRestBill": 104999.99995949074,
                    "startingDate": "2024-06-30T18:30:00.000Z",
                    "endingDate": "2024-07-30T18:30:00.000Z",
                    "dayCount": 31
                }
            ]
        },
        {
            "year": 2024,
            "month": 8,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 8,
                    "year": 2024,
                    "previousRestBill": 120999.99995370371,
                    "startingDate": "2024-07-31T18:30:00.000Z",
                    "endingDate": "2024-08-30T18:30:00.000Z",
                    "dayCount": 31
                }
            ]
        },
        {
            "year": 2024,
            "month": 9,
            "totalAmount": 15499.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15499.999994212963,
                    "month": 9,
                    "year": 2024,
                    "previousRestBill": 136499.99994791666,
                    "startingDate": "2024-08-31T18:30:00.000Z",
                    "endingDate": "2024-09-29T18:30:00.000Z",
                    "dayCount": 30
                }
            ]
        },
        {
            "year": 2024,
            "month": 10,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 10,
                    "year": 2024,
                    "previousRestBill": 152499.99994212962,
                    "startingDate": "2024-09-30T18:30:00.000Z",
                    "endingDate": "2024-10-30T18:30:00.000Z",
                    "dayCount": 31
                }
            ]
        },
        {
            "year": 2024,
            "month": 11,
            "totalAmount": 15499.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15499.999994212963,
                    "month": 11,
                    "year": 2024,
                    "previousRestBill": 167999.9999363426,
                    "startingDate": "2024-10-31T18:30:00.000Z",
                    "endingDate": "2024-11-29T18:30:00.000Z",
                    "dayCount": 30
                }
            ]
        },
        {
            "year": 2024,
            "month": 12,
            "totalAmount": 15999.999994212963,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 15999.999994212963,
                    "month": 12,
                    "year": 2024,
                    "previousRestBill": 183999.99993055555,
                    "startingDate": "2024-11-30T18:30:00.000Z",
                    "endingDate": "2024-12-30T18:30:00.000Z",
                    "dayCount": 31
                }
            ]
        },
        {
            "year": 2025,
            "month": 1,
            "totalAmount": 21507.796708333335,
            "products": [
                {
                    "productName": "Product A",
                    "quantity": 5,
                    "rate": 100,
                    "amount": 11948.775949074074,
                    "month": 1,
                    "year": 2025,
                    "previousRestBill": 145948.77587962963,
                    "startingDate": "2024-12-31T18:30:00.000Z",
                    "endingDate": "2025-01-23T16:02:28.484Z",
                    "dayCount": 23.897551898148148
                },
                {
                    "productName": "Product B",
                    "quantity": 2,
                    "rate": 200,
                    "amount": 9559.02075925926,
                    "month": 1,
                    "year": 2025,
                    "previousRestBill": 155507.7966388889,
                    "startingDate": "2025-01-01T00:00:00.000Z",
                    "endingDate": "2025-01-23T16:02:28.484Z",
                    "dayCount": 23.66838523148148
                }
            ]
        }
    ]);
    const [customer, setCustomer] = useState<ICutomer>({})

    const fetchBills = useCallback(async () => {
        debugger
        if (fetchInProgress.current || loading) return;

        try {
            fetchInProgress.current = true;
            setLoading(true);

            const response = await billService.getAllBill({
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            const newBills = response.data?.items || [];
            const billsWithNumbers = newBills.map((purchase: any, index: number) => ({
                ...purchase,
                id: purchase._id,
                no: index + 1
            }));

            setBill(billsWithNumbers);
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
            fetchBills();
        }
    }, [shouldFetch, fetchBills]);


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
        setFormData(initialSearch);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;
        try {
            setLoading(true);

            await billService.getAllBill();
            // await billService.getAllBill(formData);
            toast.success('Purchase added successfully');

            handleClose();
            setShouldFetch(true);
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
                                backgroundColor: 'primary.light',
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

        const tableData = bill.map((purchase: any) =>
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
                totals[key] = bill.reduce((sum, purchase) => sum + (purchase[key] || 0), 0);
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
    const handleSiteChange = (value: string) => {
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



    return (
        <Box sx={{ p: 2 }}>
            <Form onSubmit={handleSubmit}>
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
                            value={formData.customerName || ''}
                            onChange={(e: SelectChangeEvent<unknown>) => {
                                handleSearchChange('customerName', e.target.value);
                            }}
                            displayEmpty
                            renderValue={(value) => (value as string) || 'Select Customer'}
                            sx={{ minWidth: { xs: '100%', md: 200 } }}
                        >
                            <MenuItem disabled value="">
                                <em>Select Customer</em>
                            </MenuItem>
                            {productOptions.map((option) => (
                                <MenuItem
                                    key={option.customerName}
                                    value={option.customerName}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'var(----primary-color)',
                                        }
                                    }}
                                >
                                    {option.customerName}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </Box>
                    <Box flex={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <StyledSelect
                            fullWidth
                            value={formData.site || ''}
                            onChange={(e) => handleSearchChange('site', e.target.value)}
                            disabled={!formData.customerName}
                            displayEmpty
                            renderValue={(value: unknown) => (value as string) || 'Select Site'}
                            sx={{ minWidth: { xs: '100%', md: 150 } }}
                        >
                            <MenuItem disabled value="">
                                <em>Select Site</em>
                            </MenuItem>
                            {productOptions
                                .find(p => p.customerName === formData.customerName)
                                ?.sites.map((site) => (
                                    <MenuItem
                                        key={site}
                                        value={site}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'primary.light',
                                            }
                                        }}
                                    >
                                        {site}
                                    </MenuItem>
                                ))}
                        </StyledSelect>
                    </Box>
                </Box>
                <FormInput
                    name="startingDate"
                    label="Starting Date"
                    type="date"
                    value={formData.startingDate?.toISOString()}
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
                    type="date"
                    value={formData.endingDate?.toISOString()}
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
                    {isEditMode ? 'Update Purchase' : 'Save Purchase'}
                </Button>
            </Form>

            {(
                // Loop over each month and display a DataGrid for each one
                bill.map((billMonth, idx) => (
                    <Paper sx={{ height: 600, width: '100%', marginBottom: 2 }} key={idx}>
                        <CommonDataTable
                        loading=
                        />
                    </Paper>
                ))
            )}

        </Box>
    );
};

export default Bill;