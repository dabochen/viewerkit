/**
 * Generic status bar component for showing save status
 */

import React from 'react';

export interface StatusBarProps {
  hasUnsavedChanges: boolean;
  isSaving?: boolean;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusBar({ 
  hasUnsavedChanges, 
  isSaving = false, 
  error, 
  className,
  style 
}: StatusBarProps) {
  const getStatusText = () => {
    if (error) return `❌ Error: ${error}`;
    if (isSaving) return '💾 Saving...';
    if (hasUnsavedChanges) return '⚠️ Unsaved changes';
    return '✅ Saved';
  };

  const getStatusColor = () => {
    if (error) return 'var(--vscode-errorForeground, #f14c4c)';
    if (isSaving) return 'var(--vscode-textSeparator-foreground, #6a6a6a)';
    if (hasUnsavedChanges) return 'var(--vscode-errorForeground, #f14c4c)';
    return 'var(--vscode-textSeparator-foreground, #6a6a6a)';
  };

  return (
    <div
      className={className}
      style={{
        padding: '4px 8px',
        fontSize: '12px',
        color: getStatusColor(),
        borderTop: '1px solid var(--vscode-input-border, #3c3c3c)',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style
      }}
    >
      <span>{getStatusText()}</span>
    </div>
  );
}
