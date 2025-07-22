import React, { useState, useEffect, useRef } from 'react';
import { useWatchedFile, useTheme } from './WebViewerKit';

interface MarkdownViewerProps {
  // Props can be added here as needed
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = () => {
  console.log('[MODULAR-TEST] 🔄 MarkdownViewer component rendering - using existing WebViewerKit');
  
  const [filePath, setFilePath] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Refs for cursor position preservation
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // ViewerKit hooks for file watching and theme with conflict resolution
  const { 
    data: markdownContent, 
    setData: setMarkdownContent, 
    error, 
    hasUnsavedChanges, 
    conflictResolution, 
    resolveConflict 
  } = useWatchedFile(filePath);
  
  const { cssVariables } = useTheme();

  // Handle VS Code messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[MODULAR-TEST] 📨 Received message:', message.type, message);
      
      switch (message.type) {
        case 'update':
          if (message.filePath) {
            console.log('[MODULAR-TEST] 🚀 Initializing with file:', message.filePath);
            setFilePath(message.filePath);
            setFileName(message.fileName || 'Untitled');
            setIsInitialized(true);
          }
          break;
        default:
          console.log('[MODULAR-TEST] ❓ Unknown message type:', message.type);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request initial content
    if (window.vscode) {
      window.vscode.postMessage({ type: 'ready' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle textarea content changes
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    console.log('[MODULAR-TEST] ⌨️ User typed - content length:', newContent.length);
    setMarkdownContent(newContent);
  };

  const getStatusText = () => {
    if (error) return `❌ Error: ${error}`;
    if (hasUnsavedChanges) return '⚠️ Unsaved changes';
    return '✅ Saved';
  };

  const getStatusColor = () => {
    if (error) return 'var(--vscode-errorForeground, #f14c4c)';
    if (hasUnsavedChanges) return 'var(--vscode-errorForeground, #f14c4c)';
    return 'var(--vscode-textSeparator-foreground, #6a6a6a)';
  };

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        color: 'var(--vscode-editor-foreground, #d4d4d4)',
        fontSize: '14px'
      }}>
        Loading ViewerKit (Modular Test)...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
      color: 'var(--vscode-editor-foreground, #d4d4d4)'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--vscode-input-border, #3c3c3c)',
        fontSize: '13px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{fileName} (Modular Test)</span>
        <span style={{ fontSize: '11px', opacity: 0.7 }}>
          {conflictResolution === 'external' && '⚠️ Conflict detected'}
        </span>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={markdownContent || ''}
          onChange={handleContentChange}
          placeholder="Start typing your markdown content..."
          style={{
            width: '100%',
            height: '100%',
            padding: '16px',
            border: 'none',
            backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
            color: 'var(--vscode-input-foreground, #cccccc)',
            fontSize: '14px',
            fontFamily: 'var(--vscode-editor-font-family, "Consolas", "Courier New", monospace)',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none'
          }}
        />
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '4px 8px',
        fontSize: '12px',
        color: getStatusColor(),
        borderTop: '1px solid var(--vscode-input-border, #3c3c3c)',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{getStatusText()}</span>
        <span>Modular Core Integration Test</span>
      </div>

      {/* Conflict Resolution Dialog */}
      {conflictResolution === 'external' && (
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
                onClick={() => {
                  console.log('[MODULAR-TEST] 🔄 User chose to keep local changes');
                  resolveConflict('keep-local');
                }}
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
                onClick={() => {
                  console.log('[MODULAR-TEST] 🔄 User chose to accept external changes');
                  resolveConflict('accept-external');
                }}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
