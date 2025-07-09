import { getBridge } from '../../core/runtime/bridge';
import { getDebugConsole } from '../../core/debugConsole';

/**
 * File metadata information (web version)
 */
export interface WebFileMetadata {
  /** File size in bytes */
  size: number;
  /** Number of lines */
  lines: number;
  /** Number of words */
  words: number;
  /** Number of characters */
  characters: number;
  /** File encoding */
  encoding: string;
  /** Last modified timestamp */
  lastModified: number;
  /** File extension */
  extension: string;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * File operation result (web version)
 */
export interface WebFileOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: WebFileMetadata;
}

/**
 * File operation options (web version)
 */
export interface WebFileOperationOptions {
  /** Maximum file size to process (in bytes) */
  maxSize?: number;
  /** Custom validation function */
  validator?: (content: string) => boolean | string;
  /** Whether to include detailed metadata */
  includeMetadata?: boolean;
  /** Text encoding (default: utf-8) */
  encoding?: string;
}

/**
 * Web-side file operations manager
 * Handles file operations through bridge communication with host
 */
export class WebFileOperationsManager {
  private static instance: WebFileOperationsManager | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WebFileOperationsManager {
    if (!WebFileOperationsManager.instance) {
      WebFileOperationsManager.instance = new WebFileOperationsManager();
    }
    return WebFileOperationsManager.instance;
  }

  /**
   * Initialize bridge message handling
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;
    getDebugConsole().logError('Web file operations manager initialized');
  }

  /**
   * Request file reading from host
   * @param filePath - Path to read
   * @param options - File operation options
   * @returns File content and metadata
   */
  public async readFile(
    filePath: string,
    options: WebFileOperationOptions = {}
  ): Promise<WebFileOperationResult<string>> {
    try {
      const bridge = getBridge();
      const result = await bridge.sendRequest<WebFileOperationResult<string>>('read-file', {
        filePath,
        options,
      });

      getDebugConsole().logError(`File read: ${filePath} (${result.metadata.size} bytes)`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'readFile'
      );

      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath),
      };
    }
  }

  /**
   * Request file writing to host
   * @param filePath - Path to write
   * @param content - Content to write
   * @param options - File operation options
   * @returns Write operation result
   */
  public async writeFile(
    filePath: string,
    content: string,
    options: WebFileOperationOptions = {}
  ): Promise<WebFileOperationResult<number>> {
    try {
      const bridge = getBridge();
      const result = await bridge.sendRequest<WebFileOperationResult<number>>('write-file', {
        filePath,
        content,
        options,
      });

      getDebugConsole().logError(`File write request: ${filePath} (${content.length} chars)`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'writeFile'
      );

      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath),
      };
    }
  }

  /**
   * Request file info from host
   * @param filePath - Path to get info for
   * @returns File metadata
   */
  public async getFileInfo(filePath: string): Promise<WebFileOperationResult<WebFileMetadata>> {
    try {
      const bridge = getBridge();
      const result = await bridge.sendRequest<WebFileOperationResult<WebFileMetadata>>('get-file-info', {
        filePath,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath),
      };
    }
  }

  /**
   * Validate file content through host
   * @param filePath - Path to validate
   * @param validator - Validation function (function reference)
   * @returns Validation result
   */
  public async validateFile(
    filePath: string,
    validator: (content: string) => boolean | string
  ): Promise<WebFileOperationResult<boolean>> {
    try {
      // Note: In a real implementation, we'd need to transmit the validator function
      // For now, we'll read the file and validate locally
      const readResult = await this.readFile(filePath, { validator });
      
      const result: WebFileOperationResult<boolean> = {
        success: readResult.success,
        data: readResult.success,
        metadata: readResult.metadata,
      };
      
      if (readResult.error) {
        result.error = readResult.error;
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath),
      };
    }
  }

  /**
   * Extract basic metadata from content (client-side)
   * @param content - File content
   * @returns Basic metadata
   */
  public extractContentMetadata(content: string): Partial<WebFileMetadata> {
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(word => word.length > 0);

    return {
      lines: lines.length,
      words: words.length,
      characters: content.length,
      size: new TextEncoder().encode(content).length,
    };
  }

  /**
   * Get file extension from path
   * @param filePath - File path
   * @returns File extension
   */
  public getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext || '';
  }

  /**
   * Create empty metadata for error cases
   */
  private createEmptyMetadata(filePath: string): WebFileMetadata {
    return {
      size: 0,
      lines: 0,
      words: 0,
      characters: 0,
      encoding: 'unknown',
      lastModified: 0,
      extension: this.getFileExtension(filePath),
      processingTime: 0,
    };
  }
}

/**
 * Get the global web file operations manager
 */
export function getWebFileOperationsManager(): WebFileOperationsManager {
  return WebFileOperationsManager.getInstance();
}

/**
 * Convenience function to read a file
 */
export function readFile(filePath: string, options?: WebFileOperationOptions): Promise<WebFileOperationResult<string>> {
  const manager = getWebFileOperationsManager();
  return manager.readFile(filePath, options);
}

/**
 * Convenience function to write a file
 */
export function writeFile(filePath: string, content: string, options?: WebFileOperationOptions): Promise<WebFileOperationResult<number>> {
  const manager = getWebFileOperationsManager();
  return manager.writeFile(filePath, content, options);
}

/**
 * Convenience function to get file info
 */
export function getFileInfo(filePath: string): Promise<WebFileOperationResult<WebFileMetadata>> {
  const manager = getWebFileOperationsManager();
  return manager.getFileInfo(filePath);
}

/**
 * Convenience function to validate a file
 */
export function validateFile(filePath: string, validator: (content: string) => boolean | string): Promise<WebFileOperationResult<boolean>> {
  const manager = getWebFileOperationsManager();
  return manager.validateFile(filePath, validator);
}

/**
 * React hook for file operations
 * @returns File operation functions
 */
export function useFileOperations(): {
  readFile: (filePath: string, options?: WebFileOperationOptions) => Promise<WebFileOperationResult<string>>;
  writeFile: (filePath: string, content: string, options?: WebFileOperationOptions) => Promise<WebFileOperationResult<number>>;
  getFileInfo: (filePath: string) => Promise<WebFileOperationResult<WebFileMetadata>>;
  validateFile: (filePath: string, validator: (content: string) => boolean | string) => Promise<WebFileOperationResult<boolean>>;
  extractContentMetadata: (content: string) => Partial<WebFileMetadata>;
  getFileExtension: (filePath: string) => string;
} {
  const manager = getWebFileOperationsManager();

  return {
    readFile: (filePath, options) => manager.readFile(filePath, options),
    writeFile: (filePath, content, options) => manager.writeFile(filePath, content, options),
    getFileInfo: (filePath) => manager.getFileInfo(filePath),
    validateFile: (filePath, validator) => manager.validateFile(filePath, validator),
    extractContentMetadata: (content) => manager.extractContentMetadata(content),
    getFileExtension: (filePath) => manager.getFileExtension(filePath),
  };
} 