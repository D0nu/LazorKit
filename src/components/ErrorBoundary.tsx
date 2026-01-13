'use client';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Wallet Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
          <h3 className="text-red-400 font-semibold">Wallet Error</h3>
          <p className="text-sm text-gray-400 mt-1">
            {this.state.error?.message || 'Something went wrong'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-sm text-red-300 hover:text-red-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}