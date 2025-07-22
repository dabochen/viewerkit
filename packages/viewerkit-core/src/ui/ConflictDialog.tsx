/**
 * Generic conflict resolution dialog
 */


import { ConflictResolutionAction } from '../utils/types';

export interface ConflictDialogProps {
  isOpen: boolean;
  onResolve: (action: ConflictResolutionAction) => void;
  onCancel?: () => void;
}

export function ConflictDialog({ isOpen, onResolve, onCancel }: ConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        color: 'var(--vscode-editor-foreground, #d4d4d4)',
        border: '1px solid var(--vscode-input-border, #3c3c3c)',
        borderRadius: '4px',
        padding: '20px',
        minWidth: '400px',
        maxWidth: '600px'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0',
          color: 'var(--vscode-errorForeground, #f14c4c)'
        }}>
          ⚠️ File Conflict Detected
        </h3>
        
        <p style={{ margin: '0 0 20px 0', lineHeight: '1.5' }}>
          The file has been modified externally while you have unsaved changes. 
          How would you like to resolve this conflict?
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => onResolve('keep-local')}
            style={{
              backgroundColor: 'var(--vscode-button-background, #0e639c)',
              color: 'var(--vscode-button-foreground, #ffffff)',
              border: 'none',
              borderRadius: '2px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Keep My Changes
          </button>
          
          <button
            onClick={() => onResolve('accept-external')}
            style={{
              backgroundColor: 'var(--vscode-button-background, #0e639c)',
              color: 'var(--vscode-button-foreground, #ffffff)',
              border: 'none',
              borderRadius: '2px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Accept External Changes
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--vscode-button-foreground, #ffffff)',
                border: '1px solid var(--vscode-input-border, #3c3c3c)',
                borderRadius: '2px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
