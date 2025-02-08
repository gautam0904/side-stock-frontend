import React, { ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../../interfaces/common.interface';


class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorInfo: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info });
    // Optionally log the error to an external service
    console.error('Error caught by Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          {/* Optionally render error details for dev */}
          <details>
            <summary>Click for error details</summary>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
