import React, { useState, useRef } from 'react';
import { Box, Button, ButtonGroup, CircularProgress, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarProps } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import IconButton from '@mui/material/IconButton';
import jsPDF from 'jspdf';
import { IBill } from '@pages/bill/bill.page';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShareIcon from '@mui/icons-material/Share';

// Custom Toolbar for each table (month-year)

interface CustomToolbarProps extends GridToolbarProps {
  month: string;
  year: number;
  downloadPDF: (month: string, year: number) => void;
}
// const CustomToolbar: React.FC<CustomToolbarProps> = ({ month, year, downloadPDF }) => {
//   // Correctly type the `onClick` handler
//   const handleDownloadClick: React.MouseEventHandler<HTMLButtonElement> = () => {
//     downloadPDF(month, year);
//   };

//   const handleShareClick: React.MouseEventHandler<HTMLButtonElement> = () => {
//     const url = `https://wa.me/?text=Check%20out%20this%20bill%20for%20${month}%20${year}!`;
//     window.open(url, '_blank');
//   };

//   return (
//     <Box sx={{ padding: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <ButtonGroup variant="contained" sx={{ gap: 1 }}>
//         <Button
//           onClick={handleDownloadClick}
//           startIcon={<FileDownloadIcon />}
//           sx={{ bgcolor: '#c60055', color: 'white' }}
//         >
//           Download PDF
//         </Button>
//         <Button
//           onClick={handleShareClick}
//           startIcon={<ShareIcon />}
//           sx={{ bgcolor: '#25D366', color: 'white' }}
//         >
//           Share on WhatsApp
//         </Button>
//       </ButtonGroup>
//       <span>{`${month} ${year}`}</span>
//     </Box>
//   );
// };


const CommonDataTable = ({ rows, loading, handleEditClick, handleDeleteClick }: { rows: any, loading: any, handleEditClick: any, handleDeleteClick: any }) => {
  const [gridFilterModel, setGridFilterModel] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const gridRef = useRef(null);

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
          }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )
    },
    { field: 'no', headerName: 'No', width: 70 },
    { field: 'billName', headerName: 'Bill Name', width: 130 },
    { field: 'mobileNumber', headerName: 'Mobile Number', width: 130 },
    { field: 'partnerName', headerName: 'Partner Name', width: 130 },
    { field: 'partnerMobileNumber', headerName: 'Partner MobileNumber', width: 130 },
    {
      field: 'date',
      headerName: 'Date',
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
    { field: 'productName', headerName: 'Product Name', width: 130 },
    { field: 'quantity', headerName: 'Quantity', width: 130 },
    { field: 'rate', headerName: 'Rate', width: 130 },
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
        try {
          return Number(params).toFixed(0);
        } catch (error) {
          console.error('Day parsing error:', error);
          return params?.value || '';
        }
      }
    },
    { field: 'amount', headerName: 'Amount', width: 130 },
  ];

  // Group the rows by month and year
  const groupedRows = rows.reduce((acc: any, row: any) => {
    const month = row.month;
    const year = row.year;
    if (!acc[`${year}-${month}`]) {
      acc[`${year}-${month}`] = [];
    }
    acc[`${year}-${month}`].push(row);
    return acc;
  }, {});

  // Download the current month's data as PDF
  // const downloadPDF = (month: string, year: number) => {
  //   const doc = new jsPDF();

  //   // Add title
  //   doc.setFontSize(16);
  //   doc.text(`${month} ${year} Purchase List`, 14, 15);

  //   // Prepare the data for the table
  //   const tableData = groupedRows[`${year}-${month}`].map((item: any) => [
  //     item.no,
  //     item.billName,
  //     item.mobileNumber,
  //     item.partnerName,
  //     item.partnerMobileNumber,
  //     item.date,
  //     item.productName,
  //     item.quantity,
  //     item.rate,
  //     item.startingDate,
  //     item.endingDate,
  //     item.dayCount,
  //     item.amount,
  //   ]);

  //   // Add the table to PDF
  //   doc.autoTable({
  //     head: [
  //       [
  //         'No', 'Bill Name', 'Mobile Number', 'Partner Name', 'Partner MobileNumber',
  //         'Date', 'Product Name', 'Quantity', 'Rate', 'Starting Date', 'Ending Date', 'Day Count', 'Amount'
  //       ]
  //     ],
  //     body: tableData,
  //     startY: 25,
  //     styles: { fontSize: 8 },
  //     headStyles: { fillColor: [123, 78, 255] },
  //   });

  //   // Save the PDF
  //   doc.save(`${month}_${year}_purchases_list.pdf`);
  // };
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

  const CustomToolbar = () => {
    const handleExport = (type: string) => {
      if (type === 'pdf') {
        const visibleColumns = columns.filter(col => {
          return columnVisibility[col.field] !== false && col.field !== 'actions';
        });
        downloadPDF(visibleColumns);
      }
    };

    const handleShareClick = () => {
      // Generate the PDF content using jsPDF
      const visibleColumns = columns.filter(col => {
        return columnVisibility[col.field] !== false && col.field !== 'actions';
      });
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
                  pageTotals[key] = pageData.reduce((sum : any, row: any) => {
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
  
      // WhatsApp URL format for sharing files
      const shareText = `Check out my bill for ${month} ${year}. Please find the attached PDF.`;
      const whatsappUrl = `https://wa.me/${customerPhoneNumber}?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(pdfBase64)}`;
  
      // Open WhatsApp in a new window/tab with the prefilled message
      window.open(whatsappUrl, '_blank');
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

  return (
    <Box>
      {/* Loop through each month and create a separate table */}
      {Object.keys(groupedRows).map((key) => {
        const [year, month] = key.split('-');
        return (
          <Box key={key} sx={{ marginBottom: 3 }}>
            <Paper sx={{ padding: 2 }}>
              <CustomToolbar month={month} year={parseInt(year)} downloadPDF={() => downloadPDF(month, parseInt(year))} />
              {/* <DataGrid
                rows={groupedRows[key]}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                {{
                  Toolbar: () => <CustomToolbar month={month} year={Number(year)} downloadPDF={downloadPDF} />
                }}
                componentsProps={{
                  toolbar: {
                    month,
                    year,
                    downloadPDF
                  }
                }}
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
                filterModel={gridFilterModel as any}
                onFilterModelChange={(model) => setGridFilterModel(model)}
                onColumnVisibilityModelChange={(newModel) => {
                  setColumnVisibility(newModel);
                }}
                disableColumnFilter={false}
                disableDensitySelector={true}
                disableColumnSelector={false}
                slots={{
                  loadingOverlay: () => (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress color="primary" />
                    </Box>
                  ),
                }}
              /> */}
              <DataGrid
                ref={gridRef}
                rows={bill}
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
      })}
    </Box>
  );
};

export default CommonDataTable;
