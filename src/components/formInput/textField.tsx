import { useFormContext } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import { styled } from '@mui/material/styles';

interface FormFieldProps extends Omit<TextFieldProps, 'name'> {
  name: string;
}

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'var(--border-color)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--primary-light)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--primary-color)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-dark)',
    '&.Mui-focused': {
      color: 'var(--primary-color)',
    },
  },
  '& .MuiInputBase-input': {
    color: 'var(--text-dark)',
  },
});

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ name, ...props }, ref) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name];

    return (
      <StyledTextField
        {...register(name)}
        {...props}
        error={!!error}
        helperText={error?.message?.toString()}
        ref={ref}
        fullWidth
        size="small"
      />
    );
  }
);