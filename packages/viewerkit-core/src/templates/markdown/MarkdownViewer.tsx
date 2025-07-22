/**
 * Complete markdown viewer component using modular ViewerKit core
 */

import React from 'react';
import { useWatchedFile, useTheme } from '../../hooks';
import { ConflictDialog, StatusBar, ErrorBoundary } from '../../ui';
import { MarkdownEditor } from './MarkdownEditor';

export interface MarkdownViewerProps {
  initialFilePath?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MarkdownViewer({ 
  initialFilePath, 
  className,
  style 
}: MarkdownViewerProps) {
  const { 
    data, 
    setData, 
    error, 
    hasUnsavedChanges, 
    conflictResolution, 
    resolveConflict 
  } = useWatchedFile(initialFilePath);
  
  const { cssVariables } = useTheme();

  // Apply CSS variables to document root for theming
  React.useEffect(() => {
    Object.entries(cssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [cssVariables]);

  return (
    <ErrorBoundary>
      <div 
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
          color: 'var(--vscode-editor-foreground, #d4d4d4)',
          ...style
        }}
      >
        {/* Main editor area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MarkdownEditor
            value={data}
            onChange={setData}
            placeholder="Start typing your markdown content..."
          />
        </div>

        {/* Status bar */}
        <StatusBar
          hasUnsavedChanges={hasUnsavedChanges}
          error={error}
        />

        {/* Conflict resolution dialog */}
        <ConflictDialog
          isOpen={conflictResolution === 'external'}
          onResolve={resolveConflict}
        />
      </div>
    </ErrorBoundary>
  );
}
