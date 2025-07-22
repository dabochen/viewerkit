import { useState, useEffect, useCallback, useRef } from 'react';
import { Features, getDebugConsole } from '@viewerkit/sdk';
import type { WebFileChangeEvent } from '@viewerkit/sdk';

const { onFileChange, requestFileContent } = Features.HotReload;
const { webAutosave: autosave } = Features.Autosave;

/**
 * Options for useWatchedFile hook
 */
export interface UseWatchedFileOptions {
  /** Debounce time for autosave in milliseconds (default: 400ms) */
  autosaveDebounce?: number;
  /** Whether to enable automatic saving on changes (default: true) */
  autoSave?: boolean;
  /** Initial content if file doesn't exist */
  initialContent?: string;
  /** Whether to immediately load file content on mount (default: true) */
  loadOnMount?: boolean;
  /** Custom parser function for file content */
  parser?: (content: string) => any;
  /** Custom serializer function for saving content */
  serializer?: (data: any) => string;
}

/**
 * Return type for useWatchedFile hook
 */
export interface UseWatchedFileResult<T = string> {
  /** Current file data */
  data: T | null;
  /** Set new data (triggers autosave if enabled) */
  setData: (newData: T) => void;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Manually save current data */
  save: () => Promise<boolean>;
  /** Manually reload file from disk */
  reload: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Last modified timestamp */
  lastModified: number | null;
  /** Whether file exists on disk */
  exists: boolean;
}

/**
 * React hook for watching and managing file content
 * 
 * This hook provides automatic file watching, state synchronization, and optional autosave.
 * It integrates with ViewerKit's hot reload system to automatically update when files change
 * on disk, and can automatically save changes back to disk.
 * 
 * @param path - File path to watch
 * @param options - Configuration options
 * @returns Hook result with data, setters, and status
 * 
 * @example
 * ```tsx
 * function MyEditor() {
 *   const { data, setData, loading, error, save } = useWatchedFile('./config.json', {
 *     parser: JSON.parse,
 *     serializer: (data) => JSON.stringify(data, null, 2),
 *     autoSave: true
 *   });
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return (
 *     <textarea 
 *       value={data || ''} 
 *       onChange={(e) => setData(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useWatchedFile<T = string>(
  path: string,
  options: UseWatchedFileOptions = {}
): UseWatchedFileResult<T> {
  const {
    autosaveDebounce = 400,
    autoSave = true,
    initialContent = '',
    loadOnMount = true,
    parser,
    serializer,
  } = options;

  // State management
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<number | null>(null);
  const [exists, setExists] = useState(false);

  // Refs for managing side effects
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalUpdateRef = useRef(false);
  const lastSavedDataRef = useRef<T | null>(null);

  /**
   * Parse raw file content to typed data
   */
  const parseContent = useCallback((content: string): T => {
    try {
      if (parser) {
        return parser(content);
      }
      return content as T;
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      getDebugConsole().logError(new Error(`Parse error for ${path}: ${errorMessage}`));
      throw new Error(`Parse error: ${errorMessage}`);
    }
  }, [parser, path]);

  /**
   * Serialize typed data to string for saving
   */
  const serializeData = useCallback((dataToSerialize: T): string => {
    try {
      if (serializer) {
        return serializer(dataToSerialize);
      }
      return String(dataToSerialize);
    } catch (serializeError) {
      const errorMessage = serializeError instanceof Error ? serializeError.message : String(serializeError);
      getDebugConsole().logError(new Error(`Serialize error for ${path}: ${errorMessage}`));
      throw new Error(`Serialize error: ${errorMessage}`);
    }
  }, [serializer, path]);

  /**
   * Load file content from disk
   */
  const loadFile = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const content = await requestFileContent(path);
      
      if (content) {
        setExists(true);
        const parsedData = parseContent(content);
        
        // Only update state if this isn't an internal update
        if (!isInternalUpdateRef.current) {
          setDataState(parsedData);
          lastSavedDataRef.current = parsedData;
        }
        
        setLastModified(Date.now());
        getDebugConsole().logError(`File loaded: ${path}`);
      } else {
        setExists(false);
        if (!isInternalUpdateRef.current) {
          const defaultData = parseContent(initialContent);
          setDataState(defaultData);
          lastSavedDataRef.current = defaultData;
        }
      }
    } catch (loadError) {
      const errorMessage = loadError instanceof Error ? loadError.message : String(loadError);
      setError(`Failed to load file: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Load error for ${path}: ${errorMessage}`));
    } finally {
      setLoading(false);
    }
  }, [path, parseContent, initialContent]);

  /**
   * Save current data to disk
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (data === null) {
      getDebugConsole().logError(new Error(`Cannot save null data for ${path}`));
      return false;
    }

    try {
      setError(null);
      isInternalUpdateRef.current = true;
      
      const serializedContent = serializeData(data);
      const result = await autosave(path, serializedContent, autosaveDebounce);
      
      if (result.success) {
        lastSavedDataRef.current = data;
        setExists(true);
        setLastModified(Date.now());
        getDebugConsole().logError(`File saved: ${path}`);
        return true;
      } else {
        setError(`Save failed: ${result.error || 'Unknown error'}`);
        return false;
      }
    } catch (saveError) {
      const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
      setError(`Save failed: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Save error for ${path}: ${errorMessage}`));
      return false;
    } finally {
      // Reset internal flag after a brief delay to allow file watcher to process
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 1000);
    }
  }, [data, path, serializeData, autosaveDebounce]);

  /**
   * Set new data with optional autosave
   */
  const setData = useCallback((newData: T): void => {
    setDataState(newData);
    setError(null);

    if (autoSave) {
      // Clear existing autosave timeout
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      // Schedule new autosave
      autosaveTimeoutRef.current = setTimeout(async () => {
        const currentData = newData; // Capture current value
        try {
          isInternalUpdateRef.current = true;
          const serializedContent = serializeData(currentData);
          const result = await autosave(path, serializedContent, autosaveDebounce);
          
          if (result.success) {
            lastSavedDataRef.current = currentData;
            setExists(true);
            setLastModified(Date.now());
          } else {
            setError(`Autosave failed: ${result.error || 'Unknown error'}`);
          }
        } catch (saveError) {
          const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
          setError(`Autosave failed: ${errorMessage}`);
        } finally {
          setTimeout(() => {
            isInternalUpdateRef.current = false;
          }, 1000);
        }
      }, autosaveDebounce);
    }
  }, [autoSave, autosaveDebounce, path, serializeData]);

  /**
   * Handle file change events from hot reload system
   */
  const handleFileChange = useCallback(async (event: WebFileChangeEvent): Promise<void> => {
    // Ignore changes we caused ourselves
    if (isInternalUpdateRef.current) {
      getDebugConsole().logError(`Ignoring internal file change: ${path}`);
      return;
    }

    getDebugConsole().logError(`External file change detected: ${path} (${event.type})`);

    if (event.type === 'delete') {
      setExists(false);
      setLastModified(null);
    } else {
      // File created or changed - reload content
      await loadFile();
    }
  }, [path, loadFile]);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Effect: Setup file watching
  useEffect(() => {
    const unsubscribe = onFileChange(path, handleFileChange);
    
    return () => {
      unsubscribe();
      
      // Clear autosave timeout on unmount
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [path, handleFileChange]);

  // Effect: Initial file load
  useEffect(() => {
    if (loadOnMount) {
      loadFile();
    }
  }, [loadOnMount, loadFile]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    loading,
    error,
    save,
    reload: loadFile,
    clearError,
    lastModified,
    exists,
  };
}

/**
 * Convenience hook for watching JSON files with automatic parsing
 */
export function useWatchedJSONFile<T = any>(
  path: string,
  options?: Omit<UseWatchedFileOptions, 'parser' | 'serializer'>
): UseWatchedFileResult<T> {
  return useWatchedFile<T>(path, {
    ...options,
    parser: JSON.parse,
    serializer: (data) => JSON.stringify(data, null, 2),
  });
}

/**
 * Convenience hook for watching text files
 */
export function useWatchedTextFile(
  path: string,
  options?: UseWatchedFileOptions
): UseWatchedFileResult<string> {
  return useWatchedFile<string>(path, options);
} 