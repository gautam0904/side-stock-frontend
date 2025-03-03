import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomerFormData, customerSchema } from '../../validation/customer.types';
import { Button, CircularProgress, Grid, Typography, Box, DialogTitle, DialogContent } from '@mui/material';
import { FormField } from '../../components/formInput/textField';
import { SiteManagement } from './SitesFieldArray';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onClose: () => void;
  products: Array<{ name: string; sizes: string[] }>;
}

const PhotoUploadButton = ({ field, icon, label, onChange }: {
  field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto';
  icon: React.ReactNode;
  label: string;
  onChange: (field: 'aadharPhoto' | 'panCardPhoto' | 'customerPhoto', file: File) => void;
}) => (
  <Box flex={1}>
    <input
      type="file"
      accept="image/*"
      id={`${field}-upload`}
      style={{ display: 'none' }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onChange(field, file);
      }}
    />
    <label htmlFor={`${field}-upload`}>
      <Button
        component="span"
        startIcon={icon}
        variant="outlined"
        fullWidth
        sx={{
          color: 'var(--primary-color)',
          borderColor: 'var(--primary-color)',
          '&:hover': {
            bgcolor: 'var(--primary-bg-light)',
          }
        }}
      >
        {label}
      </Button>
    </label>
  </Box>
);

export const CustomerForm = ({ initialData = {}, onSubmit, onClose, products }: CustomerFormProps) => {
  const methods = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: initialData?.customerName || '',
      mobileNumber: initialData?.mobileNumber || '',
      partnerName: initialData?.partnerName || '',
      partnerMobileNumber: initialData?.partnerMobileNumber || '',
      reference: initialData?.reference || '',
      referenceMobileNumber: initialData?.referenceMobileNumber || '',
      residentAddress: initialData?.residentAddress || '',
      aadharNo: initialData?.aadharNo || '',
      pancardNo: initialData?.pancardNo || '',
      GSTnumber: initialData?.GSTnumber || '',
      sites: initialData?.sites || [{
        siteName: '',
        siteAddress: '',
        siteSuperwiserName: '',
        siteSuperwiserNumber: '',
        challanNumber: 'S1C1',
        prizefix: []
      }]
    }
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  return (
    <FormProvider {...methods}>
      <DialogTitle sx={{ 
        color: 'var(--primary-color)',
        fontWeight: 500
      }}>
        {initialData ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>
      <DialogContent>
        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 2 }}
        >
          <Grid container spacing={3}>
            {/* Customer Details Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2,
                color: 'var(--text-dark)',
                fontWeight: 500
              }}>
                Customer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Customer Name"
                    {...methods.register('customerName')}
                    error={!!methods.formState.errors.customerName}
                    helperText={methods.formState.errors.customerName?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Mobile Number"
                    {...methods.register('mobileNumber')}
                    error={!!methods.formState.errors.mobileNumber}
                    helperText={methods.formState.errors.mobileNumber?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    name="partnerName"
                    label="Partner Name"
                    autoComplete="off"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    name="partnerMobileNumber"
                    label="Partner Mobile Number"
                    autoComplete="off"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormField
                    name="residentAddress"
                    label="Address"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    name="aadharNo"
                    label="Aadhar Number"
                    autoComplete="off"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    name="pancardNo"
                    label="PAN Card Number"
                    autoComplete="off"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    name="GSTnumber"
                    label="GST Number"
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Document Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Document Upload
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <PhotoUploadButton
                  field="aadharPhoto"
                  icon={<CreditCardIcon />}
                  label="Upload Aadhar"
                  onChange={(field, file) => {
                    // Handle file upload
                  }}
                />
                <PhotoUploadButton
                  field="panCardPhoto"
                  icon={<CreditCardIcon />}
                  label="Upload PAN"
                  onChange={(field, file) => {
                    // Handle file upload
                  }}
                />
                <PhotoUploadButton
                  field="customerPhoto"
                  icon={<PersonIcon />}
                  label="Upload Photo"
                  onChange={(field, file) => {
                    // Handle file upload
                  }}
                />
              </Box>
            </Grid>

            {/* Sites Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2,
                color: 'var(--text-dark)',
                fontWeight: 500
              }}>
                Sites Information
              </Typography>
              <SiteManagement 
                products={products} 
                formContext={true}
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'flex-end',
                mt: 2 
              }}>
                <Button
                  onClick={onClose}
                  variant="outlined"
                  sx={{
                    color: 'var(--text-dark)',
                    borderColor: 'var(--border-color)',
                    '&:hover': {
                      borderColor: 'var(--primary-color)',
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: 'var(--primary-color)',
                    color: 'var(--text-light)',
                    '&:hover': {
                      bgcolor: 'var(--primary-light)',
                    }
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </FormProvider>
  );
};
