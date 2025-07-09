/**
 * Universal File Operations - Public API
 * 
 * Provides universal file I/O operations without format assumptions.
 * Users can bring their own parsing libraries while ViewerKit handles
 * file operations, metadata extraction, and error management.
 * 
 * Philosophy: Stay format-agnostic, let users choose parsing libraries.
 */

// Host-side exports (for VS Code extension context)
export type {
  FileMetadata,
  FileOperationResult,
  FileOperationOptions,
} from './host';

export {
  FileOperationsHost,
  getFileOperationsManager,
  readFile,
  writeFile,
  getFileInfo,
  validateFile,
} from './host';

// Web-side exports (for webview context)
export type {
  WebFileMetadata,
  WebFileOperationResult,
  WebFileOperationOptions,
} from './web';

export {
  WebFileOperationsManager,
  getWebFileOperationsManager,
  readFile as webReadFile,
  writeFile as webWriteFile,
  getFileInfo as webGetFileInfo,
  validateFile as webValidateFile,
  useFileOperations,
} from './web';

/**
 * Context-aware file operations
 * Automatically detects whether running in host or webview context
 */
export function createFileOperations() {
  // Check if we're in a webview context
  const isWebview = typeof (globalThis as any).acquireVsCodeApi !== 'undefined';
  
  if (isWebview) {
    // Return web-based operations
    const {
      readFile,
      writeFile,
      getFileInfo,
      validateFile,
      extractContentMetadata,
      getFileExtension,
    } = require('./web');
    
    return {
      readFile,
      writeFile,
      getFileInfo,
      validateFile,
      extractContentMetadata,
      getFileExtension,
      context: 'web' as const,
    };
  } else {
    // Return host-based operations
    const {
      readFile,
      writeFile,
      getFileInfo,
      validateFile,
    } = require('./host');
    
    return {
      readFile,
      writeFile,
      getFileInfo,
      validateFile,
      context: 'host' as const,
    };
  }
} 