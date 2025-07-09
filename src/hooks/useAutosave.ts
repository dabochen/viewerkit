import { useCallback, useRef, useEffect, useState } from 'react';
import { webAutosave, type WebAutosaveResult } from '../features/autosave';
import { getDebugConsole } from '../core/debugConsole';

/**
 * Options for useAutosave hook
 */
export interface UseAutosaveOptions {
  /** Debounce time in milliseconds (default: 400ms) */
  debounceMs?: number;
  /** Whether to create backup before saving (default: true) */
  createBackup?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Called when autosave succeeds */
  onSuccess?: (result: WebAutosaveResult) => void;
  /** Called when autosave fails */
  onError?: (error: string) => void;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useAutosave hook
 */
export interface UseAutosaveResult {
  /** Trigger autosave with specific content */
  save: (content: string) => Promise<WebAutosaveResult>;
  /** Cancel pending autosave */
  cancel: () => void;
  /** Whether autosave is currently pending */
  isPending: boolean;
  /** Force immediate save without debouncing */
  saveNow: (content: string) => Promise<WebAutosaveResult>;
  /** Update autosave options */
  updateOptions: (newOptions: Partial<UseAutosaveOptions>) => void;
}

/**
 * React hook for debounced autosave functionality
 * 
 * This hook provides automatic debounced saving with error handling and state management.
 * It integrates with ViewerKit's autosave system to provide a React-friendly interface
 * for automatically saving content changes.
 * 
 * @param path - File path to save to
 * @param options - Configuration options
 * @returns Hook result with save functions and status
 * 
 * @example
 * ```tsx
 * function MyEditor({ filePath }: { filePath: string }) {
 *   const [content, setContent] = useState('');
 *   const { save, isPending, cancel } = useAutosave(filePath, {
 *     debounceMs: 500,
 *     onSuccess: () => console.log('Saved!'),
 *     onError: (error) => console.error('Save failed:', error)
 *   });
 * 
 *   const handleContentChange = (newContent: string) => {
 *     setContent(newContent);
 *     save(newContent); // Automatically debounced
 *   };
 * 
 *   return (
 *     <div>
 *       <textarea 
 *         value={content} 
 *         onChange={(e) => handleContentChange(e.target.value)}
 *       />
 *       {isPending && <span>Saving...</span>}
 *       <button onClick={cancel}>Cancel Save</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutosave(
  path: string,
  options: UseAutosaveOptions = {}
): UseAutosaveResult {
  const {
    debounceMs = 400,
  } = options;

  // Refs for managing state and side effects
  const optionsRef = useRef(options);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  const isPendingRef = useRef(false);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Update autosave options dynamically
   */
  const updateOptions = useCallback((newOptions: Partial<UseAutosaveOptions>): void => {
    optionsRef.current = { ...optionsRef.current, ...newOptions };
  }, []);

  /**
   * Cancel pending autosave
   */
  const cancel = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingContentRef.current = null;
      isPendingRef.current = false;
      getDebugConsole().logError(`Autosave cancelled for: ${path}`);
    }
  }, [path]);

  /**
   * Perform immediate save without debouncing
   */
  const saveNow = useCallback(async (content: string): Promise<WebAutosaveResult> => {
    const currentOptions = optionsRef.current;
    
    if (!currentOptions.enabled) {
      return {
        success: false,
        error: 'Autosave is disabled',
        timestamp: Date.now(),
      };
    }

    try {
      getDebugConsole().logError(`Performing immediate save: ${path}`);
      
      const result = await webAutosave(path, content, 0); // No debouncing for immediate save

      if (result.success) {
        currentOptions.onSuccess?.(result);
        getDebugConsole().logError(`Immediate save successful: ${path}`);
      } else {
        const errorMessage = result.error || 'Unknown error';
        currentOptions.onError?.(errorMessage);
        getDebugConsole().logError(new Error(`Immediate save failed for ${path}: ${errorMessage}`));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result: WebAutosaveResult = {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };

      currentOptions.onError?.(errorMessage);
      getDebugConsole().logError(new Error(`Immediate save error for ${path}: ${errorMessage}`));
      
      return result;
    }
  }, [path]);

  /**
   * Trigger debounced autosave
   */
  const save = useCallback(async (content: string): Promise<WebAutosaveResult> => {
    const currentOptions = optionsRef.current;
    
    if (!currentOptions.enabled) {
      return {
        success: false,
        error: 'Autosave is disabled',
        timestamp: Date.now(),
      };
    }

    // Cancel any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store the content for the pending save
    pendingContentRef.current = content;
    isPendingRef.current = true;

    return new Promise<WebAutosaveResult>((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const contentToSave = pendingContentRef.current;
          if (contentToSave === null) {
            reject(new Error('No content to save'));
            return;
          }

          getDebugConsole().logError(`Performing debounced save: ${path} (${currentOptions.debounceMs}ms)`);
          
          const result = await webAutosave(path, contentToSave, 0); // We handle debouncing here

          // Clear pending state
          isPendingRef.current = false;
          pendingContentRef.current = null;
          timeoutRef.current = null;

          if (result.success) {
            currentOptions.onSuccess?.(result);
            getDebugConsole().logError(`Debounced save successful: ${path}`);
            resolve(result);
          } else {
            const errorMessage = result.error || 'Unknown error';
            currentOptions.onError?.(errorMessage);
            getDebugConsole().logError(new Error(`Debounced save failed for ${path}: ${errorMessage}`));
            resolve(result); // Resolve with error result rather than reject
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const result: WebAutosaveResult = {
            success: false,
            error: errorMessage,
            timestamp: Date.now(),
          };

          // Clear pending state
          isPendingRef.current = false;
          pendingContentRef.current = null;
          timeoutRef.current = null;

          currentOptions.onError?.(errorMessage);
          getDebugConsole().logError(new Error(`Debounced save error for ${path}: ${errorMessage}`));
          resolve(result); // Resolve with error result rather than reject
        }
      }, currentOptions.debounceMs || debounceMs);
    });
  }, [path, debounceMs]);

  /**
   * Check if autosave is currently pending
   */
  const isPending = useCallback((): boolean => {
    return isPendingRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    cancel,
    isPending: isPending(),
    saveNow,
    updateOptions,
  };
}

/**
 * Convenience hook that combines state management with autosave
 * 
 * This hook provides a complete solution for managing stateful content with automatic
 * saving. It's similar to useState but with automatic persistence to disk.
 * 
 * @param path - File path to save to
 * @param initialContent - Initial content value
 * @param options - Autosave configuration options
 * @returns State value, setter, and autosave status
 * 
 * @example
 * ```tsx
 * function ConfigEditor() {
 *   const [config, setConfig, { isPending, cancel }] = useAutosaveState(
 *     './config.json',
 *     '{}',
 *     { debounceMs: 300 }
 *   );
 * 
 *   return (
 *     <div>
 *       <textarea 
 *         value={config} 
 *         onChange={(e) => setConfig(e.target.value)}
 *       />
 *       {isPending && <span>Saving...</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutosaveState(
  path: string,
  initialContent: string = '',
  options: UseAutosaveOptions = {}
): [string, (content: string) => void, { isPending: boolean; cancel: () => void; saveNow: () => Promise<WebAutosaveResult> }] {
  const [content, setContentState] = useState(initialContent);
  const { save, cancel, isPending, saveNow } = useAutosave(path, options);
  
  const setContent = useCallback((newContent: string): void => {
    setContentState(newContent);
    save(newContent);
  }, [save]);

  const saveCurrentContent = useCallback((): Promise<WebAutosaveResult> => {
    return saveNow(content);
  }, [saveNow, content]);

  return [
    content,
    setContent,
    {
      isPending,
      cancel,
      saveNow: saveCurrentContent,
    }
  ];
}

 