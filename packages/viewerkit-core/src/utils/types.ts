/**
 * Core types for ViewerKit
 */

// VS Code webview message types
export interface VSCodeMessage {
  type: string;
  content?: string;
  filePath?: string;
  fileName?: string;
}

// Theme information from VS Code
export interface WebThemeInfo {
  kind: 'light' | 'dark' | 'high-contrast';
  cssVariables: Record<string, string>;
}

// Conflict resolution states
export type ConflictResolution = 'none' | 'external' | 'local';

// File state interface
export interface FileState {
  filePath: string;
  data: string;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSavedContent: string;
  conflictResolution: ConflictResolution;
}

// File watcher configuration
export interface FileWatcherConfig {
  debounceMs?: number;
  enableLogging?: boolean;
}

// Conflict resolution actions
export type ConflictResolutionAction = 'keep-local' | 'accept-external';

// VS Code API declaration
declare global {
  interface Window {
    vscode?: {
      postMessage: (message: any) => void;
    };
  }
}
