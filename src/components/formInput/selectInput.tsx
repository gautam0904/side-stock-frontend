import { ReactNode } from 'react';
import { Select, SelectProps, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';

interface FormSelectProps extends Omit<SelectProps, 'name'> {
  name: string;
  label: string;
  children: ReactNode;
  error?: boolean;
  helperText?: string;
}

export const FormSelect = ({ name, label, children, error, helperText, ...props }: FormSelectProps) => {
  const { control, formState: { errors } } = useFormContext();
  const fieldError = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={!!error || !!fieldError} size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            {...props}
            label={label}
          >
            {children}
          </Select>
          {(helperText || fieldError) && (
            <FormHelperText>{helperText || fieldError?.message?.toString()}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};