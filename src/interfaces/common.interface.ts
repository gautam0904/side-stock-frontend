import { ReactNode, ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: ErrorInfo | null;
}

export interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface IProducts {
  date?: Date;
  _id?: string;
  productName: string;
  size: string;
  quantity?: number;
  rate?: number;
  amount?: number;
}

export interface IGetParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}