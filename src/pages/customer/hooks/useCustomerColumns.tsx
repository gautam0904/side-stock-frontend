import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export const useCustomerColumns = ({ onEdit, onDelete, onExpand, openModal }: {
  onEdit: (customer: any) => void;
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
  openModal: (open: boolean) => void;
}) => {
  return [
    {
      field: 'expandButton',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View Details">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              // Handle expand action
              onExpand(params.row._id);
              openModal(true);
            }}
            sx={{ 
              color: 'var(--primary-color)',
              '&:hover': {
                bgcolor: 'var(--primary-light)',
                color: 'var(--text-light)',
              }
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Tooltip>
      )
    },
    { 
      field: 'no', 
      headerName: 'No', 
      width: 70,
      align: 'center',
      headerAlign: 'center',
    },
    { 
      field: 'customerName', 
      headerName: 'Customer Name', 
      width: 180,
      flex: 1,
    },
    { 
      field: 'mobileNumber', 
      headerName: 'Mobile Number', 
      width: 130,
      align: 'center',
      headerAlign: 'center',
    },
    { field: 'partnerName', headerName: 'Partner Name', width: 130 },
    { field: 'partnerMobileNumber', headerName: 'Partner Mobile', width: 130 },
    { field: 'reference', headerName: 'Reference', width: 130 },
    { field: 'referenceMobileNumber', headerName: 'Reference Mobile', width: 130 },
    { field: 'residentAddress', headerName: 'Address', width: 130 },
    { field: 'aadharNo', headerName: 'Aadhar No', width: 150 },
    { field: 'pancardNo', headerName: 'Pancard No', width: 150 },
    { field: 'GSTnumber', headerName: 'GST Number', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Customer">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onEdit(params.row);
              }}
              sx={{ 
                color: 'var(--primary-color)',
                '&:hover': {
                  bgcolor: 'var(--primary-light)',
                  color: 'var(--text-light)',
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Customer">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(params.row._id);
              }}
              sx={{ 
                color: 'var(--error-color)',
                '&:hover': {
                  bgcolor: 'var(--error-bg-light)',
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ] as GridColDef[];
};