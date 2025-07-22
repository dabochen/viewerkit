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
  // Removed loading state - it caused unnecessary re-renders and wasn't used in UI
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [conflictResolution, setConflictResolution] = useState<'none' | 'external' | 'local'>('none');
  
  // Refs to track editing state
  const isUserEditingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExternalUpdateRef = useRef<string>('');
  const isInitializedRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<string | null>(null);
  const lastWebviewSaveRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>(''); // Track last saved content to avoid dependency loop

  // Handle VS Code messages with conflict resolution
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as VSCodeMessage;
      
      if (message.type === 'update') {
        const incomingContent = message.content || '';
        const currentContent = data;
        
        // Initial load or file path change
        if (!isInitializedRef.current || !filePath || message.filePath !== filePath) {
          console.log('Initial load:', message.filePath);
          setData(incomingContent);
          setFilePath(message.filePath || '');
          setLastSavedContent(incomingContent);
          lastSavedContentRef.current = incomingContent; // Keep ref in sync
          setHasUnsavedChanges(false);
          // Removed setLoading to prevent unnecessary re-renders
          setError(null);
          lastExternalUpdateRef.current = incomingContent;
          lastWebviewSaveRef.current = incomingContent;
          isInitializedRef.current = true;
          return;
        }
        
        // Check if this update is from our own webview save
        const isOurSave = incomingContent === lastWebviewSaveRef.current;
        
        if (isOurSave) {
          // This is feedback from our own save - DON'T overwrite user input!
          console.log('[AUTO-SAVE] 📥 Received feedback from our own save - updating tracking only');
          
          // Only update tracking variables, NOT the actual data
          // The user may have continued typing since the save was initiated
          console.log('[AUTO-SAVE] 🔄 Updating lastSavedContent state (POTENTIAL RELOAD POINT)');
          setLastSavedContent(incomingContent);
          lastSavedContentRef.current = incomingContent; // Keep ref in sync
          lastExternalUpdateRef.current = incomingContent;
          
          // Check if current content matches saved content
          const currentContent = data;
          const hasChanges = currentContent !== incomingContent;
          console.log('[AUTO-SAVE] 🔍 Checking unsaved changes:');
          console.log('[AUTO-SAVE] 📝 Current content length:', currentContent.length);
          console.log('[AUTO-SAVE] 💾 Saved content length:', incomingContent.length);
          console.log('[AUTO-SAVE] ⚖️ Contents match:', currentContent === incomingContent);
          console.log('[AUTO-SAVE] 🚨 Setting hasUnsavedChanges to:', hasChanges);
          console.log('[AUTO-SAVE] 🔄 Updating hasUnsavedChanges state (POTENTIAL RELOAD POINT)');
          setHasUnsavedChanges(hasChanges);
          
          console.log('[AUTO-SAVE] ✅ Autosave feedback processing complete');
          return;
        }
        
        // This is a genuine external change
        console.log('External change detected');
        
        // Handle conflict resolution
        if (hasUnsavedChanges && currentContent !== incomingContent) {
          // There's a conflict: user has unsaved changes + external changes
          console.log('Conflict detected: external changes while user has unsaved edits');
          setConflictResolution('external');
          // Store the external content but don't apply it yet
          lastExternalUpdateRef.current = incomingContent;
        } else if (!isUserEditingRef.current && currentContent !== incomingContent) {
          // No conflict and user not actively editing: update content in-place
          console.log('Applying external change in-place');
          setData(incomingContent);
          setLastSavedContent(incomingContent);
          lastSavedContentRef.current = incomingContent; // Keep ref in sync
          setHasUnsavedChanges(false);
          lastExternalUpdateRef.current = incomingContent;
        } else {
          // User is actively editing - defer the update
          console.log('Deferring external change - user is editing');
          lastExternalUpdateRef.current = incomingContent;
        }
        
        // Removed setLoading to prevent unnecessary re-renders
        setError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data, filePath, hasUnsavedChanges]);

  // Enhanced save functionality with conflict detection
  const save = useCallback(async (content: string) => {
    console.log('[AUTO-SAVE] 💾 Starting save process:', content.substring(0, 50) + '...');
    // Removed loading state to prevent unnecessary re-renders
    
    // Track this as our own save to prevent feedback loop
    console.log('[AUTO-SAVE] 🏷️ Tracking save to prevent feedback loop');
    lastWebviewSaveRef.current = content;
    pendingSaveRef.current = content;
    
    // Send save request to VS Code extension
    console.log('[AUTO-SAVE] 📤 Sending save request to VS Code extension');
    if (window.vscode) {
      window.vscode.postMessage({
        type: 'save',
        content: content,
        filePath: filePath
      });
    }
    
    // DON'T update state immediately - let the feedback mechanism handle it
    // This prevents multiple re-renders and uses the same smooth update as hot reload
    console.log('[AUTO-SAVE] ⏳ Waiting for feedback from extension (no immediate state update)');
    
    // Clear pending save after a delay
    setTimeout(() => {
      console.log('[AUTO-SAVE] 🧹 Clearing pending save and loading state');
      pendingSaveRef.current = null;
      console.log('[AUTO-SAVE] 🔄 Setting loading false (POTENTIAL RELOAD POINT)');
      // Removed setLoading to prevent unnecessary re-renders
    }, 200);
  }, [filePath]);

  // Enhanced setData with conflict tracking
  const setDataWithTracking = useCallback((newData: string) => {
    console.log('[AUTO-SAVE] 📝 setDataWithTracking called');
    // Only update if the content actually changed
    if (newData === data) return;
    
    console.log('setDataWithTracking called:', newData.substring(0, 50) + '...');
    
    // Update the data state
    setData(newData);
    
    // Mark as having unsaved changes if content differs from last saved
    const hasChanges = newData !== lastSavedContentRef.current;
    console.log('[AUTO-SAVE] 🔍 User typing - checking unsaved changes:');
    console.log('[AUTO-SAVE] 📝 New content length:', newData.length);
    console.log('[AUTO-SAVE] 💾 Last saved length:', lastSavedContentRef.current.length);
    console.log('[AUTO-SAVE] ⚖️ Contents match:', newData === lastSavedContentRef.current);
    console.log('[AUTO-SAVE] 🚨 Setting hasUnsavedChanges to:', hasChanges);
    setHasUnsavedChanges(hasChanges);
    
    if (hasChanges) {
      // Mark user as actively editing
      isUserEditingRef.current = true;
      
      // Clear the "user is editing" flag after a short delay
      setTimeout(() => {
        isUserEditingRef.current = false;
      }, 1000);
    }
  }, []);

  // Debounced auto-save with enhanced logic
  useEffect(() => {
    console.log('[AUTO-SAVE] 🔄 Autosave useEffect triggered (POTENTIAL RELOAD POINT)');
    
    // Don't autosave if not initialized, no data, no file path
    if (!isInitializedRef.current || !data || !filePath) {
      console.log('[AUTO-SAVE] ⏭️ Skipping autosave - not ready');
      return;
    }
    
    // Don't autosave if content hasn't changed (use ref to avoid dependency)
    if (data === lastSavedContentRef.current) {
      console.log('[AUTO-SAVE] ⏭️ Skipping autosave - content unchanged');
      return;
    }
    
    // Don't autosave if we have a pending save
    if (pendingSaveRef.current === data) {
      console.log('[AUTO-SAVE] ⏭️ Skipping autosave - pending save for same content');
      return;
    }
    
    console.log('[AUTO-SAVE] ⏰ Setting up autosave timer for:', data.substring(0, 50) + '...');
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      console.log('[AUTO-SAVE] 🚀 Autosave triggered');
      save(data);
    }, 400); // 400ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, filePath, save]); // REMOVED lastSavedContent to prevent feedback loop

  // Conflict resolution actions
  const resolveConflict = useCallback((resolution: 'keep-local' | 'accept-external') => {
    if (resolution === 'accept-external') {
      setData(lastExternalUpdateRef.current);
      setLastSavedContent(lastExternalUpdateRef.current);
      lastSavedContentRef.current = lastExternalUpdateRef.current; // Keep ref in sync
      setHasUnsavedChanges(false);
    }
    setConflictResolution('none');
  }, []);

  return {
    data,
    setData: setDataWithTracking,
    // Removed loading - it caused unnecessary re-renders
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
