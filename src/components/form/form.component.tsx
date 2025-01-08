import React from 'react';
import { FormProps } from 'react-router-dom';

const Form: React.FC<FormProps> = ({ children, onSubmit, className = '' }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
};

export default Form;
