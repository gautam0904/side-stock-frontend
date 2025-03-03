import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ISite } from "src/DTO/customer.dto";

interface DetailPanelDialogProps {
    productPopupOpen: boolean;
    setProductPopupOpen: (open: boolean) => void;
    selectedProductIndex: number | null;
    customers: any[];
  }

export const DetailPanelDialog : React.FC<DetailPanelDialogProps> = ({
    productPopupOpen,
    setProductPopupOpen,
    selectedProductIndex,
    customers,
  }) => {
    const selectedCustomer = customers.find(p => p._id == selectedProductIndex?.toString());
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
                            {selectedCustomer.prizefix?.map((product: any, index: any) => (
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
                                {selectedCustomer?.sites?.map((site:ISite, index:number) => (
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