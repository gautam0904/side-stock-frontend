import { Box, Typography, Grid, IconButton, Button, Card } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FormField } from "../../components/formInput/textField";
import { FormSelect } from "../../components/formInput/selectInput";
import { MenuItem } from "@mui/material";
import { PrizefixData } from "../../validation/customer.types";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

interface PrizefixFieldArrayProps {
  siteIndex: number;
  products: Array<{ name: string; sizes: string[] }>;
}

export const PrizefixFieldArray = ({ siteIndex, products }: PrizefixFieldArrayProps) => {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sites.${siteIndex}.prizefix`
  });

  const selectedProducts = watch(`sites.${siteIndex}.prizefix`);

  const handleAddProduct = () => {
    append({ productName: '', size: '', rate: 0 });
  };

  return (
    <Box sx={{ 
      mt: 3,
      p: 2,
      bgcolor: 'var(--background-light)',
      borderRadius: '8px'
    }}>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          mb: 2,
          color: 'var(--primary-color)',
          fontWeight: 500
        }}
      >
        Products
      </Typography>
      {fields.map((field, index) => (
        <Card
          key={field.id}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormSelect
                name={`sites.${siteIndex}.prizefix.${index}.productName`}
                label="Product Name"
              >
                {products.map((product) => (
                  <MenuItem key={product.name} value={product.name}>
                    {product.name}
                  </MenuItem>
                ))}
              </FormSelect>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormSelect
                name={`sites.${siteIndex}.prizefix.${index}.size`}
                label="Size"
                disabled={!selectedProducts[index]?.productName}
              >
                {products
                  .find(p => p.name === selectedProducts[index]?.productName)
                  ?.sizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
              </FormSelect>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormField
                name={`sites.${siteIndex}.prizefix.${index}.rate`}
                label="Rate"
                type="number"
              />
            </Grid>
            {index > 0 && (
              <Grid item xs={12} sm={1}>
                <IconButton
                  onClick={() => remove(index)}
                  sx={{
                    color: 'var(--error-color)',
                    '&:hover': {
                      bgcolor: 'var(--error-bg-light)',
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            )}
          </Grid>
        </Card>
      ))}
      <Button
        onClick={handleAddProduct}
        startIcon={<AddIcon />}
        variant="outlined"
        size="small"
        sx={{
          color: 'var(--primary-color)',
          borderColor: 'var(--primary-color)',
          '&:hover': {
            bgcolor: 'var(--primary-color)',
            color: 'var(--text-light)',
          }
        }}
      >
        Add Product
      </Button>
    </Box>
  );
};

const prizefixSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  size: z.string().min(1, 'Size is required'),
  rate: z.number().min(0, 'Rate must be positive'),
});

interface PrizefixFormProps {
  siteId: string;
  initialData?: {
    productName: string;
    size: string;
    rate: number;
  } | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  availableProducts?: Array<{ name: string; sizes: string[] }>;
}

export const PrizefixForm = ({ 
  siteId, 
  initialData, 
  onClose, 
  onSubmit,
  availableProducts = []
}: PrizefixFormProps) => {
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(prizefixSchema),
    defaultValues: initialData || {
      productName: '',
      size: '',
      rate: 0
    }
  });

  const selectedProduct = watch('productName');
  const sizes = availableProducts.find(p => p.name === selectedProduct)?.sizes || [];

  return (
    <Box>
      <DialogTitle sx={{ 
        color: 'var(--primary-color)',
        fontWeight: 500
      }}>
        {initialData ? 'Edit Product Rate' : 'Add Product Rate'}
      </DialogTitle>
      <DialogContent>
        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 2 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormSelect
                label="Product Name"
                {...register('productName')}
                error={!!errors.productName}
                helperText={errors.productName?.message}
              >
                {availableProducts.map(product => (
                  <MenuItem key={product.name} value={product.name}>
                    {product.name}
                  </MenuItem>
                ))}
              </FormSelect>
            </Grid>
            <Grid item xs={12}>
              <FormSelect
                label="Size"
                {...register('size')}
                error={!!errors.size}
                helperText={errors.size?.message}
                disabled={!selectedProduct}
              >
                {sizes.map(size => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </FormSelect>
            </Grid>
            <Grid item xs={12}>
              <FormField
                label="Rate"
                type="number"
                {...register('rate', { valueAsNumber: true })}
                error={!!errors.rate}
                helperText={errors.rate?.message}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
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
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Box>
  );
};