import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { PrizefixForm } from './PrizefixFieldArray';

interface Prizefix {
  productName: string;
  size: string;
  rate: number;
}

interface Site {
  _id: string;
  siteName: string;
  siteAddress: string;
  siteSuperwiserName: string;
  siteSuperwiserNumber: string;
  challanNumber: string;
  prizefix: Prizefix[];
}

interface SiteManagementProps {
  products: Array<{ name: string; sizes: string[] }>;
  formContext?: boolean; // To determine if it's used within a form
}

export const SiteManagement = ({ products, formContext = false }: SiteManagementProps) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [isPrizefixFormOpen, setIsPrizefixFormOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [editingPrizefix, setEditingPrizefix] = useState<Prizefix | null>(null);

  const handleAddPrizefix = (siteId: string) => {
    setSelectedSite(sites.find(site => site._id === siteId) || null);
    setEditingPrizefix(null);
    setIsPrizefixFormOpen(true);
  };

  const handleEditPrizefix = (siteId: string, prizefix: Prizefix) => {
    setSelectedSite(sites.find(site => site._id === siteId) || null);
    setEditingPrizefix(prizefix);
    setIsPrizefixFormOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {sites.map(site => (
        <Card 
          key={site._id}
          sx={{
            mb: 2,
            bgcolor: 'var(--surface-light)',
            borderRadius: '8px',
            boxShadow: expandedSiteId === site._id ? 
              '0 4px 12px rgba(0,0,0,0.15)' : 
              '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Box 
            onClick={() => setExpandedSiteId(
              expandedSiteId === site._id ? null : site._id
            )}
            sx={{ 
              p: 2,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: expandedSiteId === site._id ? 
                '1px solid var(--border-color)' : 
                'none'
            }}
          >
            <Box>
              <Typography variant="h6">{site.siteName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {site.siteAddress}
              </Typography>
            </Box>
            <IconButton>
              <KeyboardArrowDownIcon 
                sx={{ 
                  transform: expandedSiteId === site._id ? 
                    'rotate(180deg)' : 
                    'none',
                  transition: '0.3s'
                }}
              />
            </IconButton>
          </Box>

          {expandedSiteId === site._id && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Supervisor
                  </Typography>
                  <Typography>{site.siteSuperwiserName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography>{site.siteSuperwiserNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Challan Number
                  </Typography>
                  <Typography>{site.challanNumber}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'var(--primary-color)',
                    fontWeight: 500
                  }}
                >
                  Product Rates
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  sx={{
                    color: 'var(--primary-color)',
                    '&:hover': {
                      bgcolor: 'var(--primary-bg-light)',
                    }
                  }}
                  onClick={() => handleAddPrizefix(site._id)}
                >
                  Add Rate
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {site.prizefix.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell align="right">{item.rate}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditPrizefix(site._id, item)}
                            sx={{ 
                              color: 'var(--primary-color)',
                              '&:hover': {
                                bgcolor: 'var(--primary-bg-light)',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Card>
      ))}

      <Dialog 
        open={isPrizefixFormOpen} 
        onClose={() => setIsPrizefixFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <PrizefixForm 
          siteId={selectedSite?._id || ''}
          initialData={editingPrizefix}
          onClose={() => setIsPrizefixFormOpen(false)}
          onSubmit={async () => {
            // Handle prizefix submit
            setIsPrizefixFormOpen(false);
          }}
        />
      </Dialog>
    </Box>
  );
};