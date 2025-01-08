import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './formInput.css';
import { styled } from '@mui/material/styles';

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  value?: string | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  validate?: (field: string, value: string) => string | undefined;
  autoComplete?: string;
  autoFocus?: boolean;
  fullWidth?: boolean;
  sx?: React.CSSProperties | any;
}

// Custom styled DatePicker
const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  width: '100%',
  
  '& .MuiInputBase-root': {
    height: '40px',
    borderRadius: '4px',
    backgroundColor: '#fff',
    
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    }
  },

  '& .MuiOutlinedInput-input': {
    padding: '10px 14px',
    fontSize: '0.9rem',
  },

  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 11px) scale(1)',
    
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)',
    }
  },

  '& .MuiInputAdornment-root button': {
    padding: '8px',
    marginRight: '2px',
    color: theme.palette.primary.main,
  }
}));

const FormInput: React.FC<FormInputProps> = ({
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
  sx
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
          <DatePicker
            id={name}
            name={name}
            selected={value ? new Date(value) : null}
            onChange={(date: Date | null) => {
              if (onChange) {
                onChange({
                  target: {
                    name,
                    value: date ? date.toISOString().split('T')[0] : ''
                  }
                });
              }
            }}
            className={`form-input ${className} ${error ? 'input-error' : ''}`}
            dateFormat="yyyy-MM-dd"
            placeholderText={placeholder}
            required={required}
            autoComplete={autoComplete}
            onBlur={onBlur}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
          />
          <label htmlFor={name} className="floating-label">
            {label}
            {required && <span className="required-star">*</span>}
          </label>
        </div>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  }

  return (
    <div className={`form-field-container ${containerClassName} ${fullWidth ? 'full-width' : ''}`}>
      <div className="form-field-wrapper">
        <input
          id={name}
          name={name}
          type={type}
          placeholder=" "
          required={required}
          className={`form-input ${className} ${error ? 'input-error' : ''}`}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        <label htmlFor={name} className="floating-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormInput;
