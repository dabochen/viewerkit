// ViewerKit React Hooks
// Centralized exports for all React hooks

// File watching and management hooks
export {
  useWatchedFile,
  useWatchedJSONFile,
  useWatchedTextFile,
  type UseWatchedFileOptions,
  type UseWatchedFileResult,
} from './useWatchedFile';

// Autosave hooks
export {
  useAutosave,
  useAutosaveState,
  type UseAutosaveOptions,
  type UseAutosaveResult,
} from './useAutosave';

// Theme synchronization hooks
export {
  useTheme,
  useSimpleTheme,
  type UseThemeOptions,
  type UseThemeResult,
} from './useTheme';

// Bridge communication hooks
export {
  useBridge,
  useMessageListener,
  type UseBridgeOptions,
  type UseBridgeResult,
  type MessageHandler,
} from './useBridge';

// Re-export commonly used types from features for convenience
export type { WebFileChangeEvent } from '../features/hotReload';
export type { WebAutosaveResult, WebAutosaveOptions } from '../features/autosave';
export type { 
  WebThemeInfo, 
  WebViewerKitCSSVariables, 
  ThemeChangeHandler 
} from '../features/themeSync';
export type { Message } from '../core/runtime/bridge'; 