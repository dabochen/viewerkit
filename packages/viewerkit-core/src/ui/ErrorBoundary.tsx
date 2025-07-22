/**
 * Generic error boundary component
 */

import React, { Component, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ViewerKit Error Boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
          color: 'var(--vscode-errorForeground, #f14c4c)',
          border: '1px solid var(--vscode-input-border, #3c3c3c)',
          borderRadius: '4px',
          margin: '10px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>❌ Something went wrong</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            An error occurred in the ViewerKit component.
          </p>
          {this.state.error && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
                Error Details
              </summary>
              <pre style={{
                backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
                padding: '10px',
                borderRadius: '2px',
                fontSize: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
