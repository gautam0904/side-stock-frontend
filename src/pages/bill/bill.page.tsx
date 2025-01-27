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
    const [bill, setBill] = useState<IBill>();
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
        setFormData(initialSearch);
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

            setBill(newBills);
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
        debugger
        setSearchQuery(customer.customerName as string);
        setCustomers([]);

        setProductOptions(customer.sites || []);

        setProductOptions((prev) => {
            const groupedProducts = customer.prizefix?.reduce((acc: any[], product: Iprizefix) => {
                const existing = acc.find(p => p.name === product.productName);
                if (existing) {
                    if (!existing.sizes.includes(product.size)) {
                        existing.sizes.push(product.size);
                        existing.rate = product.rate
                    }
                } else {
                    acc.push({ name: product.productName, sizes: [product.size] });
                }
                return acc;
            }, []) || []; // Use empty array as fallback if groupedProducts is undefined

            return [
                ...prev,
                ...groupedProducts
            ];
        });

        setFormData((prev) => {

            const updatedForm = {
                ...prev,
                customerName: customer.customerName as string,
                customerId: customer._id || '',
                mobileNumber: customer.mobileNumber as string,
            };

            if (customer.sites?.length || 0 < 1) {
                updatedForm.site = customer?.sites?.[0].siteName || '';
            }

            return updatedForm;
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
                                height: '55px',
                                '& .MuiInputBase-root': {
                                    height: '55px',
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
                    <Box flex={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <StyledSelect
                            fullWidth
                            value={formData.site || ''}
                            onChange={(e) => { handleSearchChange('site', e.target.value); handleSiteChange(e.target.value) }}
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
                                ?.sites.map((site: string) => (
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
            </Form>
            <Box>


                {bill?.map((billMonth: any, idx: any) => (
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