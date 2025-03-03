import { Box, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface CustomerListProps {
  customers: any[];
  loading: boolean;
  onEdit: (customer: any) => void;
  onDelete: (id: string) => void;
}

export const CustomerList = ({ customers, loading, onEdit, onDelete }: CustomerListProps) => {
  return (
    <Box sx={{ 
      height: 'calc(100vh - 200px)',
      width: '100%',
      bgcolor: 'var(--surface-light)',
      borderRadius: '8px',
      p: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <DataGrid
        rows={customers}
        loading={loading}
        disableRowSelectionOnClick
        autoPageSize
        pageSizeOptions={[10, 25, 50]}
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderColor: 'var(--border-color)'
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'var(--background-light)',
            borderColor: 'var(--border-color)'
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: 'var(--primary-bg-light)'
          }
        }}
        columns={[
          { field: 'no', headerName: 'No', width: 70 },
          { field: 'customerName', headerName: 'Customer Name', flex: 1 },
          { field: 'mobileNumber', headerName: 'Mobile', width: 130 },
          { field: 'residentAddress', headerName: 'Address', flex: 1 },
          { field: 'aadharNo', headerName: 'Aadhar', width: 130 },
          { field: 'pancardNo', headerName: 'PAN', width: 130 },
          { field: 'GSTnumber', headerName: 'GST', width: 130 },
          {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params) => (
              <Box 
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }} 
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }} 
              >
                <EditIcon
                  fontSize="small"
                  onClick={() => onEdit(params.row)}
                  sx={{ color: 'var(--primary-color)', cursor: 'pointer' }}
                />
                <DeleteIcon
                  fontSize="small"
                  onClick={() => onDelete(params.row._id)}
                  sx={{ color: 'var(--error-color)', cursor: 'pointer' }}
                />
              </Box>
            )
          }
        ]}
      />
    </Box>
  );
}; 