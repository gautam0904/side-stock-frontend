import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GridColDef } from '@mui/x-data-grid';

export const useCustomerExport = (customers: any[], columns: GridColDef[]) => {
  const handleExport = () => {
    const doc = new jsPDF();
    const visibleColumns = columns.filter(col => 
      col.field !== 'actions' && col.field !== 'expandButton'
    );

    doc.setFontSize(16);
    doc.setTextColor("var(--primary-color)"); // var(--primary-color)
    // doc.setTextColor(123, 78, 255); // var(--primary-color)
    doc.text('Customer List', 14, 15);

    doc.autoTable({
      head: [visibleColumns.map(col => col.headerName)],
      body: customers.map(row => 
        visibleColumns.map(col => row[col.field]?.toString() || '')
      ),
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [123, 78, 255],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
    });

    doc.save('customer-list.pdf');
  };

  return { handleExport };
};
