/**
 * WebViewerKit - Webview-compatible ViewerKit utilities
 * 
 * This module provides a webview-safe subset of ViewerKit functionality
 * without Node.js dependencies that cause "require is not defined" errors.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// VS Code webview message types
interface VSCodeMessage {
  type: string;
  content?: string;
  filePath?: string;
  fileName?: string;
}

// Theme information from VS Code
interface WebThemeInfo {
  kind: 'light' | 'dark' | 'high-contrast';
  cssVariables: Record<string, string>;
}

// File watching hook for webview context with conflict resolution
export function useWatchedFile(initialFilePath?: string) {
  const [filePath, setFilePath] = useState<string>(initialFilePath || '');
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [conflictResolution, setConflictResolution] = useState<'none' | 'external' | 'local'>('none');
  
  // Refs to track editing state
  const isUserEditingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExternalUpdateRef = useRef<string>('');

  // Handle VS Code messages with conflict resolution
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as VSCodeMessage;
      
      if (message.type === 'update') {
        const incomingContent = message.content || '';
        const currentContent = data;
        
        // Initial load or file path change
        if (!filePath || message.filePath !== filePath) {
          setData(incomingContent);
          setFilePath(message.filePath || '');
          setLastSavedContent(incomingContent);
          setHasUnsavedChanges(false);
          setLoading(false);
          setError(null);
          lastExternalUpdateRef.current = incomingContent;
          return;
        }
        
        // Check if this is an external change (not from our save)
        const isExternalChange = incomingContent !== lastExternalUpdateRef.current;
        
        if (isExternalChange) {
          // Handle conflict resolution
          if (hasUnsavedChanges && currentContent !== incomingContent) {
            // There's a conflict: user has unsaved changes + external changes
            console.log('Conflict detected: external changes while user has unsaved edits');
            setConflictResolution('external');
            // For now, prioritize user changes but show notification
            // In a more sophisticated implementation, you could show a merge dialog
          } else if (!isUserEditingRef.current && currentContent !== incomingContent) {
            // No conflict and content is different: update content in-place
            setData(incomingContent);
            setLastSavedContent(incomingContent);
            setHasUnsavedChanges(false);
          }
          // If user is actively editing or content is the same, defer the update
        }
        
        lastExternalUpdateRef.current = incomingContent;
        setLoading(false);
        setError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data, filePath, hasUnsavedChanges]);

  // Enhanced save functionality with conflict detection
  const save = useCallback(async (content: string) => {
    setLoading(true);
    setHasUnsavedChanges(false);
    
    // Send save request to VS Code extension
    if (window.vscode) {
      window.vscode.postMessage({
        type: 'save',
        content: content,
        filePath: filePath
      });
    }
    
    setLastSavedContent(content);
    lastExternalUpdateRef.current = content;
    
    // Simulate save delay
    setTimeout(() => {
      setLoading(false);
    }, 200);
  }, [filePath]);

  // Enhanced setData with conflict tracking
  const setDataWithTracking = useCallback((newData: string) => {
    // Only update if the content actually changed
    if (newData === data) return;
    
    setData(newData);
    setHasUnsavedChanges(newData !== lastSavedContent);
    isUserEditingRef.current = true;
    
    // Clear the "user is editing" flag after a short delay
    setTimeout(() => {
      isUserEditingRef.current = false;
    }, 1000);
  }, [data, lastSavedContent]);

  // Debounced auto-save with enhanced logic
  useEffect(() => {
    if (!data || !filePath || data === lastSavedContent) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      save(data);
    }, 400); // 400ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, filePath, lastSavedContent, save]);

  // Conflict resolution actions
  const resolveConflict = useCallback((resolution: 'keep-local' | 'accept-external') => {
    if (resolution === 'accept-external') {
      setData(lastExternalUpdateRef.current);
      setLastSavedContent(lastExternalUpdateRef.current);
      setHasUnsavedChanges(false);
    }
    setConflictResolution('none');
  }, []);

  return {
    data,
    setData: setDataWithTracking,
    loading,
    error,
    save,
    filePath,
    hasUnsavedChanges,
    conflictResolution,
    resolveConflict
  };
}

// Theme hook for webview context
export function useTheme() {
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get CSS variables from VS Code
    const updateTheme = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const variables: Record<string, string> = {};
      
      // Common VS Code CSS variables
      const commonVars = [
        '--vscode-editor-background',
        '--vscode-editor-foreground',
        '--vscode-input-background',
        '--vscode-input-foreground',
        '--vscode-input-border',
        '--vscode-button-background',
        '--vscode-button-foreground',
        '--vscode-errorForeground',
        '--vscode-textSeparator-foreground'
      ];

      commonVars.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName);
        if (value) {
          variables[varName] = value;
        }
      });

      setCssVariables(variables);
    };

    updateTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => observer.disconnect();
  }, []);

  return { cssVariables };
}

// Declare vscode API for TypeScript
declare global {
  interface Window {
    vscode?: {
      postMessage: (message: any) => void;
    };
  }
}
