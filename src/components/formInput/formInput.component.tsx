import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import './formInput.css';
import { TextField } from '@mui/material';

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  value?: string | null | number | Date;
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  validate?: (field: string, value: string) => string | undefined;
  autoComplete?: string;
  autoFocus?: boolean;
  fullWidth?: boolean;
  sx?: React.CSSProperties | any;
  disabled?: boolean;
  min?: number; 
  max?: number; 
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  InputProps?: React.ComponentProps<typeof TextField>['InputProps'];
  [key: string]: any; 
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  containerClassName = '',
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  validate,
  autoComplete,
  autoFocus = false,
  fullWidth = true,
  sx,
  disabled = false,
  min,
  max,
  onClick,
  InputProps,
  ...rest 
}) => {
  const [error, setError] = React.useState<string | undefined>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);

    // Validation
    if (validate) {
      const validationError = validate(name, e.target.value);
      setError(validationError);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) onFocus(e);
  };

  if (type === 'date') {
    return (
      <div className={`form-field-container ${containerClassName} ${fullWidth ? 'full-width' : ''}`}>
        <div className="form-field-wrapper">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => {
                if (onChange) {
                  onChange({
                    target: {
                      name,
                      value: newValue ? newValue.format('YYYY-MM-DD') : ''
                    }
                  });
                }
              }}
              disabled={disabled}
              slotProps={{
                textField: {
                  required,
                  error: !!error,
                  helperText: error,
                  fullWidth: true,
                  size: "medium",
                  sx: {
                    '& .MuiInputBase-root': {
                      height: '35px',
                      backgroundColor: 'var(--surface-light)',
                    },
                    '& .MuiInputLabel-root': {
                      '&.Mui-focused': {
                        color: 'var(--primary-color)'
                      }
                    },
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                        borderWidth: '2px'
                      }
                    }
                  },
                  disabled
                }
              }}
              {...rest} 
            />
          </LocalizationProvider>
        </div>
      </div>
    );
  }

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    id: name,
    name,
    type,
    placeholder: " ",
    required,
    value: value?.toString() || '',
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown,
    autoComplete,
    autoFocus,
    disabled,
    onClick,
    min, 
    max,
    className: `form-input ${className} ${error ? 'input-error' : ''}`,
    ...rest 
  };

  return (
    <div className={`form-field-container ${containerClassName} ${fullWidth ? 'full-width' : ''}`} >
      <div className="form-field-wrapper">
        <input {...inputProps}  height={'35px'}/>
        <label htmlFor={name} className="floating-label" >
          {label}
          {required && <span className="required-star">*</span>}
        </label>
        {error && <span className="error-message">{error}</span>}
      </div>
    </div>
  );
};

export default FormInput;
