/**
 * Generic loading spinner component
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function LoadingSpinner({ size = 16, className, style }: LoadingSpinnerProps) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid var(--vscode-input-border, #3c3c3c)`,
        borderTop: `2px solid var(--vscode-button-background, #0e639c)`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        ...style
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
