/**
 * React hook for file watching with autosave and conflict resolution
 * Maintains the same API as the original WebViewerKit implementation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FileWatcher, FileWatcherCallbacks } from '../core/fileWatcher';
import { ConflictState } from '../core/conflictResolver';
import { FileState, ConflictResolutionAction, FileWatcherConfig } from '../utils/types';

export interface UseWatchedFileReturn {
  data: string;
  setData: (data: string) => void;
  error: string | null;
  save: (content?: string) => Promise<void>;
  filePath: string;
  hasUnsavedChanges: boolean;
  conflictResolution: 'none' | 'external' | 'local';
  resolveConflict: (action: ConflictResolutionAction) => void;
}

/**
 * Hook for watching files with autosave and conflict resolution
 * @param initialFilePath Optional initial file path
 * @param config Optional configuration
 */
export function useWatchedFile(
  initialFilePath?: string,
  config?: FileWatcherConfig
): UseWatchedFileReturn {
  // React state that mirrors the FileWatcher state
  const [state, setState] = useState<FileState>({
    filePath: initialFilePath || '',
    data: '',
    error: null,
    hasUnsavedChanges: false,
    lastSavedContent: '',
    conflictResolution: 'none'
  });

  // Store conflict state for the resolveConflict callback
  const [, setCurrentConflict] = useState<ConflictState | null>(null);

  // FileWatcher instance ref
  const fileWatcherRef = useRef<FileWatcher | null>(null);

  // Initialize FileWatcher
  useEffect(() => {
    const callbacks: FileWatcherCallbacks = {
      onStateChange: (newState: FileState) => {
        setState(newState);
      },
      onConflictDetected: (conflict: ConflictState) => {
        setCurrentConflict(conflict);
      }
    };

    const fileWatcher = new FileWatcher(callbacks, config);
    fileWatcherRef.current = fileWatcher;
    
    fileWatcher.start();

    return () => {
      fileWatcher.stop();
      fileWatcherRef.current = null;
    };
  }, [config]);

  // Update content function (user editing)
  const setData = useCallback((newData: string) => {
    if (fileWatcherRef.current) {
      fileWatcherRef.current.updateContent(newData);
    }
  }, []);

  // Save function
  const save = useCallback(async (content?: string) => {
    if (fileWatcherRef.current) {
      await fileWatcherRef.current.saveContent(content);
    }
  }, []);

  // Resolve conflict function
  const resolveConflict = useCallback((action: ConflictResolutionAction) => {
    if (fileWatcherRef.current) {
      fileWatcherRef.current.resolveConflict(action);
    }
    setCurrentConflict(null);
  }, []);

  return {
    data: state.data,
    setData,
    error: state.error,
    save,
    filePath: state.filePath,
    hasUnsavedChanges: state.hasUnsavedChanges,
    conflictResolution: state.conflictResolution,
    resolveConflict
  };
}
