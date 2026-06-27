'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error.message);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error stack:', error.stack?.split('\n').slice(0, 15).join('\n'));
    // Store component stack on error object for display in render
    (error as any).componentStack = errorInfo.componentStack;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] p-8">
          <div className="max-w-lg w-full p-6 rounded-xl border border-[var(--error)] bg-[var(--error)]/10">
            <h1 className="text-lg font-bold text-[var(--error)] mb-2">Something went wrong</h1>
            <pre className="text-xs text-[var(--text)] whitespace-pre-wrap break-all bg-[var(--bg)] p-4 rounded-lg max-h-60 overflow-auto">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack?.split('\n').slice(0, 20).join('\n')}
              {'\n\nComponent Stack:\n'}
              {(this.state.error as any)?.componentStack || 'N/A'}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
