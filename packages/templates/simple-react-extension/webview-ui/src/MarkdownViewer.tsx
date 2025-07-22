import React, { useState, useEffect, useRef } from 'react';
import { useWatchedFile, useTheme } from './WebViewerKit';

interface MarkdownViewerProps {
  // Props can be added here as needed
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = () => {
  console.log('[AUTO-SAVE] 🔄 MarkdownViewer component rendering (POTENTIAL RELOAD POINT)');
  
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
    save, 
    hasUnsavedChanges,
    conflictResolution,
    resolveConflict
  } = useWatchedFile(filePath);
  
  const { cssVariables } = useTheme();



  // Listen for messages from the VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'update':
          if (message.filePath) {
            setFilePath(message.filePath);
            setFileName(message.fileName || '');
            setIsInitialized(true);
          }
          if (message.content && !isInitialized) {
            // Only set initial content, after that let useWatchedFile handle updates
            setMarkdownContent(message.content);
          }
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request initial content
    if (window.vscode) {
      window.vscode.postMessage({
        type: 'ready'
      });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isInitialized, setMarkdownContent]);



  // Track if content change is from user typing vs external update
  const isUserTypingRef = useRef(false);
  
  // Handle textarea content changes with cursor preservation
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    
    console.log('[AUTO-SAVE] ⌨️ User typed - starting autosave chain');
    console.log('[AUTO-SAVE] 📝 Content length:', newContent.length);
    
    // Mark that this change is from user typing
    isUserTypingRef.current = true;
    
    // Save cursor position
    const textarea = event.target;
    cursorPositionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    };
    
    // Update content - this will trigger autosave but NOT cause visual refresh
    // because the textarea already has the new value
    console.log('[AUTO-SAVE] 🔄 Calling setMarkdownContent (POTENTIAL RELOAD POINT)');
    setMarkdownContent(newContent);
    
    // Clear the typing flag after a short delay
    setTimeout(() => {
      console.log('[AUTO-SAVE] ✅ Clearing typing flag');
      isUserTypingRef.current = false;
    }, 100);
  };
  
  // Preserve cursor position ONLY for external updates (not user typing)
  useEffect(() => {
    console.log('[AUTO-SAVE] 🔄 Cursor preservation useEffect triggered (POTENTIAL RELOAD POINT)');
    console.log('[AUTO-SAVE] 📝 markdownContent changed, length:', markdownContent?.length || 0);
    console.log('[AUTO-SAVE] ⌨️ isUserTyping:', isUserTypingRef.current);
    
    // Only restore cursor position if:
    // 1. Textarea is focused
    // 2. This is NOT from user typing (i.e., it's an external update)
    // 3. Content actually changed (to prevent unnecessary calls)
    if (textareaRef.current && 
        document.activeElement === textareaRef.current && 
        !isUserTypingRef.current) {
      const { start, end } = cursorPositionRef.current;
      console.log('[AUTO-SAVE] 🎯 Restoring cursor position for external update:', start, end);
      
      // Use requestAnimationFrame to avoid visual disruption
      requestAnimationFrame(() => {
        if (textareaRef.current && document.activeElement === textareaRef.current) {
          console.log('[AUTO-SAVE] ⚙️ Actually setting cursor selection range (VISUAL EFFECT)');
          textareaRef.current.setSelectionRange(start, end);
        }
      });
    } else {
      console.log('[AUTO-SAVE] ⏭️ Skipping cursor restoration - user is typing or textarea not focused');
    }
  }, [markdownContent]);

  // Apply VS Code theme styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: cssVariables['--vscode-editor-background'] || 'var(--vscode-editor-background)',
    color: cssVariables['--vscode-editor-foreground'] || 'var(--vscode-editor-foreground)',
    fontFamily: cssVariables['--vscode-font-family'] || 'var(--vscode-font-family)',
    fontSize: cssVariables['--vscode-font-size'] || 'var(--vscode-font-size)',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
  };

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--vscode-panel-border)',
    padding: '10px 20px',
    backgroundColor: cssVariables['--vscode-titleBar-activeBackground'] || 'var(--vscode-titleBar-activeBackground)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    width: '100%',
    border: 'none',
    outline: 'none',
    resize: 'none',
    padding: '20px',
    backgroundColor: cssVariables['--vscode-editor-background'] || 'var(--vscode-editor-background)',
    color: cssVariables['--vscode-editor-foreground'] || 'var(--vscode-editor-foreground)',
    fontFamily: cssVariables['--vscode-editor-font-family'] || 'var(--vscode-editor-font-family, monospace)',
    fontSize: cssVariables['--vscode-editor-font-size'] || 'var(--vscode-editor-font-size, 14px)',
    lineHeight: '1.5',
  };

  const statusStyle: React.CSSProperties = {
    padding: '5px 20px',
    backgroundColor: cssVariables['--vscode-statusBar-background'] || 'var(--vscode-statusBar-background)',
    color: cssVariables['--vscode-statusBar-foreground'] || 'var(--vscode-statusBar-foreground)',
    fontSize: '12px',
    borderTop: '1px solid var(--vscode-panel-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  // Removed loading condition - it caused unnecessary re-renders

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: 'var(--vscode-errorForeground)' }}>Error</h2>
          <p style={{ color: 'var(--vscode-errorForeground)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '16px' }}>{fileName || 'Markdown Editor'}</h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '12px' }}>ViewerKit Extension - Live Editing</p>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {!error && hasUnsavedChanges && 'Unsaved changes'}
          {!error && !hasUnsavedChanges && (filePath ? 'Saved' : 'Waiting for file...')}
          {conflictResolution === 'external' && (
            <span style={{ color: 'var(--vscode-notificationsWarningIcon-foreground)' }}>
              ⚠️ External changes detected
            </span>
          )}
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        value={markdownContent || ''}
        onChange={handleContentChange}
        placeholder="Start typing your markdown content here..."
        spellCheck={false}
        onBlur={() => {
          // Save cursor position when losing focus
          if (textareaRef.current) {
            cursorPositionRef.current = {
              start: textareaRef.current.selectionStart,
              end: textareaRef.current.selectionEnd
            };
          }
        }}
      />
      
      {/* Conflict resolution banner */}
      {conflictResolution === 'external' && (
        <div style={{
          backgroundColor: 'var(--vscode-notificationsWarningIcon-foreground)',
          color: 'var(--vscode-editor-background)',
          padding: '8px 12px',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ File was modified externally while you have unsaved changes</span>
          <div>
            <button 
              onClick={() => resolveConflict('keep-local')}
              style={{
                marginRight: '8px',
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'var(--vscode-button-background)',
                color: 'var(--vscode-button-foreground)',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Keep My Changes
            </button>
            <button 
              onClick={() => resolveConflict('accept-external')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'var(--vscode-button-secondaryBackground)',
                color: 'var(--vscode-button-secondaryForeground)',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Accept External Changes
            </button>
          </div>
        </div>
      )}
      
      <div style={statusStyle}>
        <div>
          <span>Path: {filePath || 'No file selected'}</span>
          {error && <span style={{ color: 'var(--vscode-errorForeground)', marginLeft: '20px' }}>Error: {error}</span>}
        </div>
        <div>
          <span>Lines: {(markdownContent || '').split('\n').length}</span>
          <span style={{ marginLeft: '20px' }}>Characters: {(markdownContent || '').length}</span>
          {hasUnsavedChanges && <span style={{ marginLeft: '20px', color: 'var(--vscode-gitDecoration-modifiedResourceForeground)' }}>●</span>}
        </div>
      </div>
    </div>
  );
};
