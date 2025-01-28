// import React from 'react';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import dayjs from 'dayjs';
// import './formInput.css';
// import { TextField } from '@mui/material';

// interface FormInputProps {
//   name: string;
//   label?: string;
//   type?: string;
//   placeholder?: string;
//   required?: boolean;
//   className?: string;
//   containerClassName?: string;
//   value?: string | null | number | Date;
//   onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
//   onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
//   onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
//   onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
//   validate?: (field: string, value: string) => string | undefined;
//   autoComplete?: string;
//   autoFocus?: boolean;
//   fullWidth?: boolean;
//   sx?: React.CSSProperties | any;
//   disabled?: boolean;
//   min:number;
//   max:number;
//   onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
//   InputProps?: React.ComponentProps<typeof TextField>['InputProps'];
// }

// export const FormInput: React.FC<FormInputProps> = ({
//   name,
//   label,
//   type = 'text',
//   placeholder,
//   required = false,
//   className = '',
//   containerClassName = '',
//   value,
//   onChange,
//   onBlur,
//   onFocus,
//   onKeyDown,
//   validate,
//   autoComplete,
//   autoFocus = false,
//   fullWidth = true,
//   sx,
//   disabled = false,
//   InputProps,
//   onClick
// }) => {
//   const [error, setError] = React.useState<string | undefined>();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (onChange) onChange(e);
    
//     // Validation
//     if (validate) {
//       const validationError = validate(name, e.target.value);
//       setError(validationError);
//     }
//   };

//   const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
//     if (onBlur) onBlur(e);
//   };

//   const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
//     if (onFocus) onFocus(e);
//   };

//   if (type === 'date') {
//     return (
//       <div className={`form-field-container ${containerClassName} ${fullWidth ? 'full-width' : ''}`}>
//         <div className="form-field-wrapper">
//           <LocalizationProvider dateAdapter={AdapterDayjs}>
//             <DatePicker
//               label={label}
//               value={value ? dayjs(value) : null}
//               onChange={(newValue) => {
//                 if (onChange) {
//                   onChange({
//                     target: {
//                       name,
//                       value: newValue ? newValue.format('YYYY-MM-DD') : ''
//                     }
//                   });
//                 }
//               }}
//               disabled={disabled}
//               slotProps={{
//                 textField: {
//                   required,
//                   error: !!error,
//                   helperText: error,
//                   fullWidth: true,
//                   size: "medium",
//                   sx: {
//                     '& .MuiInputBase-root': {
//                       height: '56px',
//                       backgroundColor: 'var(--surface-light)',
//                     },
//                     '& .MuiInputLabel-root': {
//                       '&.Mui-focused': {
//                         color: 'var(--primary-color)'
//                       }
//                     },
//                     '& .MuiOutlinedInput-root': {
//                       '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                         borderColor: 'var(--primary-color)',
//                         borderWidth: '2px'
//                       }
//                     }
//                   },
//                   disabled  
//                 }
//               }}
//             />
//           </LocalizationProvider>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`form-field-container ${containerClassName} ${fullWidth ? 'full-width' : ''}`}>
//       <div className="form-field-wrapper">
//         <input
//           id={name}
//           name={name}
//           type={type}
//           placeholder=" "
//           required={required}
//           className={`form-input ${className} ${error ? 'input-error' : ''}`}
//           value={value?.toLocaleString() || ''}
//           onChange={handleChange}
//           onBlur={handleBlur}
//           onFocus={handleFocus}
//           onKeyDown={onKeyDown}
//           autoComplete={autoComplete}
//           autoFocus={autoFocus}
//           disabled={disabled}
          
//         />
//         <label htmlFor={name} className="floating-label">
//           {label}
//           {required && <span className="required-star">*</span>}
//         </label>
//         <label htmlFor={name} className="floating-label">
//       {error && <span className="error-message">{error}</span>}
//           {label}
//           {required && <span className="required-star">*</span>}
//         </label>
//       </div>
//     </div>
//   );
// };

// export default FormInput;

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
  min?: number; // min value for number type
  max?: number; // max value for number type
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  InputProps?: React.ComponentProps<typeof TextField>['InputProps'];
  [key: string]: any; // Allow other extra props to be passed in
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
  ...rest // capture extra props
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
                      height: '56px',
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
              {...rest} // Pass any extra props for the DatePicker
            />
          </LocalizationProvider>
        </div>
      </div>
    );
  }

  // Number type handling
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
    min, // Pass min and max for number input
    max,
    className: `form-input ${className} ${error ? 'input-error' : ''}`,
    ...rest // Pass any other props
  };

  return (
    <div className={`form-field-container ${containerClassName} ${fullWidth ? 'full-width' : ''}`}>
      <div className="form-field-wrapper">
        <input {...inputProps} />
        <label htmlFor={name} className="floating-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
        {error && <span className="error-message">{error}</span>}
      </div>
    </div>
  );
};

export default FormInput;
