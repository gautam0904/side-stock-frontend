import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridFilterModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { v4 as uuidv4 } from 'uuid';

interface RowData {
  id?: string;
  productName: string;
  quantity: number;
  rate?: number;
  amount?: number | string;
  month?: number;
  year?: number;
  previousRestBill?: number;
  startingDate?: string;
  endingDate?: string;
  dayCount?: string | number;
  // Add more fields if needed
  [key: string]: any;
}

interface CommonDataTableProps {
  rows: RowData[];
  loading: boolean;
}

const CommonDataTable: React.FC<any> = ({
  rows,
  loading,
}:{rows : any, loading: boolean}) => {
  const [gridFilterModel, setGridFilterModel] = useState<GridFilterModel>({
    items: [],
  });
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({});
  const gridRef = useRef<HTMLDivElement | null>(null);

  const assignUniqueIds = (data: RowData[]) => {
    return data.map((row, index) => ({
      no: index + 1,
      ...row,
      id: uuidv4(),
    }));
  };
  const rowsWithIds = assignUniqueIds(rows.products);  

  const columns: GridColDef[] = [
    {
      field: 'no',
      headerName: 'No',
      width: 70,
    },
    {
      field: 'productName',
      headerName: 'Product Name',
      width: 130,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 130,
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 130,
    },
    {
      field: 'startingDate',
      headerName: 'Starting Date',
      width: 130,
      valueFormatter: (params: any) => {
        try {
          const date = new Date(params);
          return date.toLocaleDateString('en-GB');
        } catch (error) {
          console.error('Date parsing error:', error);
          return params?.value || '';
        }
      }
    },
    {
      field: 'endingDate',
      headerName: 'Ending Date',
      width: 130,
      valueFormatter: (params: any) => {
        try {
          const date = new Date(params);
          return date.toLocaleDateString('en-GB');
        } catch (error) {
          console.error('Date parsing error:', error);
          return params?.value || '';
        }
      }
    },
    {
      field: 'dayCount',
      headerName: 'Day',
      width: 130,
      valueFormatter: (params: any) => {
        const parsed = parseFloat(params);
        return Math.floor(parsed);
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,

      valueFormatter: (params: any) => {
        const numericVal = parseFloat(params);
        return numericVal.toFixed(2);
      },
    },
  ];

  const groupedRows = rowsWithIds.reduce((acc: any, row: RowData) => {
    const m = row.month || 0;
    const y = row.year || 0;
    const groupKey = `${y}-${m}`;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(row);
    return acc;
  }, {});

  const downloadPDF = (visibleColumns: GridColDef[]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(123, 78, 255);
    doc.text('Purchase List', 14, 15);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = visibleColumns.map((col) => col.headerName ?? col.field);
    const keys = visibleColumns.map((col) => col.field);

    const tableData = rowsWithIds.map((row: any) =>
      keys.map((key) => {
        // Some special formatting for certain fields
        switch (key) {
          case 'amount':
          case 'rate':
          case 'totalAmount': {
            const value = parseFloat(row[key] || 0);
            return { content: value.toFixed(2), styles: { halign: 'right' } };
          }
          case 'startingDate':
          case 'endingDate':
          case 'date': {
            if (row[key]) {
              try {
                return new Date(row[key]).toLocaleDateString('en-GB');
              } catch {
                return row[key];
              }
            }
            return '';
          }
          case 'dayCount': {
            const value = parseFloat(row[key] || 0);
            return Math.floor(value).toString();
          }
          default:
            return row[key]?.toString() || '';
        }
      }),
    );

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: {
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
    });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' },
      );
    }

    doc.save('purchases-list.pdf');
    const pdfBlob = doc.output('blob');
    return pdfBlob
  };

  const handleShareClick = () => {
    const api_key= "596258636375658";
    const api_secret= "PBWzlNAuSmudhmV7BpGB-KHFk3k"
    const cloudName = 'dcvx4tnwp';

    const [uploading, setUploading] = useState(false);

    const generatePdfBlob = async () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Hello World from jsPDF!', 10, 20);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 30);

      // Simple table example
      doc.autoTable({
        head: [['Column 1', 'Column 2']],
        body: [
          ['Row 1 Col 1', 'Row 1 Col 2'],
          ['Row 2 Col 1', 'Row 2 Col 2'],
        ],
        startY: 40,
      });

      const visibleColumns = columns.filter((col) => columnVisibility[col.field] !== false);

      const pdfBlob = downloadPDF(visibleColumns);
      return pdfBlob;
    };

    const uploadToCloudinary = async (pdfBlob: Blob) => {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', pdfBlob);
      // formData.append('upload_preset', unsignedUploadPreset) 

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const data = await response.json();

        setUploading(false);
        if (data.secure_url) {
          // This is your hosted PDF URL
          return data.secure_url;
        } else {
          console.error('Cloudinary upload error', data);
          return null;
        }
      } catch (error) {
        console.error('Upload to Cloudinary failed', error);
        setUploading(false);
        return null;
      }
    };
    
    const shareOnWhatsApp = (pdfUrl: string) => {
      const shareText = `Hi! Here is the PDF link:\n ${pdfUrl}`;
      const phoneNumber = '';
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    };

    // Combined function to handle "Generate PDF & Share"
    const handleGenerateAndShare = async () => {
      // 1) Generate PDF in memory
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;

      // 2) Upload to Cloudinary
      const pdfUrl = await uploadToCloudinary(pdfBlob);
      if (!pdfUrl) return;

      // 3) Open WhatsApp with link
      shareOnWhatsApp(pdfUrl);
    };
    const shareText = 'Check out my purchase list for the month!';
    // Provide a phone number or leave it blank
    const phoneNumber = '+919427173635';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const CustomToolbar = (data: any) => {
    const handleExportClick = () => {
      const visibleColumns = columns.filter((col) => columnVisibility[col.field] !== false);
      downloadPDF(visibleColumns);
    };

    return (
      <GridToolbarContainer
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#f7f7f7',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Box>
          <GridToolbarColumnsButton />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
            {`Month: ${new Date(Number(data.year), Number(data.month) - 1).toLocaleString('default', { month: 'long' })}, Year: ${data.year}`}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
            {`Previous Rest Amount: ₹${data.previousRestAmount.toFixed(2)}`}
          </Typography>
        </Box>

        {/* Right section with Export and Share buttons */}
        <Box>
          <ButtonGroup variant="contained" sx={{ gap: 2 }}>
            <Button
              onClick={handleExportClick}
              startIcon={<FileDownloadIcon />}
              sx={{
                bgcolor: '#7b4eff', // Using primary color
                color: 'white',
                '&:hover': { bgcolor: '#5a2dd6' }, // Hover effect with darker shade
              }}
            >
              Export PDF
            </Button>
            <Button
              onClick={handleShareClick}
              startIcon={<WhatsAppIcon />}
              sx={{
                bgcolor: '#25D366', // WhatsApp green
                color: 'white',
                '&:hover': { bgcolor: '#128C7E' }, // Hover effect with darker WhatsApp green
              }}
            >
              Share on WhatsApp
            </Button>
          </ButtonGroup>
        </Box>
      </GridToolbarContainer>
    );
  };
 return (
  <Box>
    {Object.keys(groupedRows).map((groupKey) => {
      const [year, month] = groupKey.split('-');
      const monthYearRows = groupedRows[groupKey];
      const previousRestAmount = monthYearRows[0]?.previousRestBill || 0;
      const monthTotal = monthYearRows.reduce((sum: number, row: any) => sum + (row.amount || 0), 0);
      const totalWithRest = previousRestAmount + monthTotal;

      // Create the header content
      const headerContent = `${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' })} ${year} - Previous Rest Amount: ${previousRestAmount.toFixed(2)}`;

      return (
        <Box
          key={groupKey}
          border={'2px solid var(--primary-color)'}
          sx={{ marginBottom: 3, display: 'flex', flexDirection: 'column' }}
        >
          <Paper
            sx={{
              padding: 2,
              backgroundColor: 'var(--surface-light)',
              boxShadow: 'var(--Paper-shadow)',
              borderRadius: '4px',
              flex: 1, // Allow the Paper to expand flexibly
              marginBottom: 0, // Remove default margin-bottom (16px)
              display: 'flex', // Use flexbox for better control
              flexDirection: 'column',
            }}
          >
            <DataGrid
              ref={gridRef}
              rows={monthYearRows}
              columns={columns}
              loading={loading}
              columnVisibilityModel={columnVisibility}
              onColumnVisibilityModelChange={(newModel) => setColumnVisibility(newModel)}
              disableRowSelectionOnClick
              hideFooterPagination={true}
              sx={{
                border: 0,
                flexGrow: 1,  // Ensure DataGrid takes up available space
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'var(--background-light)',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-footer': {
                  display: 'none',
                },
              }}
              slots={{
                toolbar: () => <CustomToolbar month={month} year={year} previousRestAmount={previousRestAmount} />,
                loadingOverlay: () => (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                ),
              }}
              getRowId={(row) => row.id!}
            />
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <Typography marginLeft={2} variant="h6" sx={{ fontWeight: 'bold' }}>
                {`Total Due Amount: ₹${(previousRestAmount + monthTotal).toFixed(2)}`}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {`Month Amount: ₹${(monthTotal).toFixed(2)}`}
              </Typography>
            </Box>
          </Paper>
        </Box>
      );
    })}
  </Box>
);

  
};
export default CommonDataTable;