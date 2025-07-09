import * as vscode from 'vscode';
import { getDebugConsole } from '../../core/debugConsole';
import { reportError } from '../../core/diagnostics';

/**
 * File metadata information
 */
export interface FileMetadata {
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
 * File operation result
 */
export interface FileOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: FileMetadata;
}

/**
 * File operation options
 */
export interface FileOperationOptions {
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
 * Universal file operations service
 * Handles file I/O operations without format assumptions
 * 
 * Rules for using this service:
 * - All operations are format-agnostic
 * - Metadata extraction is automatic
 * - Error handling provides detailed context
 * - Users bring their own parsing libraries
 * - Validation is customizable via options
 */
export class FileOperationsHost {
  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for the file operations host
   */
  private setupEventHandlers(): void {
    getDebugConsole().logError('File operations host initialized');
  }

  /**
   * Read file content with metadata extraction
   * @param filePath - Path to the file to read
   * @param options - File operation options
   * @returns File content and metadata
   */
  public async readFile(
    filePath: string,
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult<string>> {
    const startTime = Date.now();

    try {
      const uri = vscode.Uri.file(filePath);

      // Check file exists
      let stat: vscode.FileStat;
      try {
        stat = await vscode.workspace.fs.stat(uri);
      } catch {
        return {
          success: false,
          error: `File not found: ${filePath}`,
          metadata: this.createEmptyMetadata(filePath, Date.now() - startTime),
        };
      }

      // Check file size
      const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
      if (stat.size > maxSize) {
        return {
          success: false,
          error: `File too large: ${stat.size} bytes (max: ${maxSize})`,
          metadata: this.createEmptyMetadata(filePath, Date.now() - startTime, stat.size),
        };
      }

      // Read file content
      const data = await vscode.workspace.fs.readFile(uri);
      const content = new TextDecoder(options.encoding || 'utf-8').decode(data);

      // Extract metadata
      const metadata = this.extractFileMetadata(filePath, content, stat, Date.now() - startTime);

      // Validate if requested
      if (options.validator) {
        const validationResult = options.validator(content);
        if (validationResult !== true) {
          return {
            success: false,
            error: typeof validationResult === 'string' ? validationResult : 'Validation failed',
            metadata,
          };
        }
      }

      return {
        success: true,
        data: content,
        metadata,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Report error to diagnostics
      try {
        const uri = vscode.Uri.file(filePath);
        reportError(uri, `File read error: ${errorMessage}`);
      } catch {
        // Ignore reporting errors
      }

      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath, Date.now() - startTime),
      };
    }
  }

  /**
   * Write content to file
   * @param filePath - Path to write to
   * @param content - Content to write
   * @param options - File operation options
   * @returns Write operation result
   */
  public async writeFile(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult<number>> {
    const startTime = Date.now();

    try {
      const uri = vscode.Uri.file(filePath);

      // Validate content if requested
      if (options.validator) {
        const validationResult = options.validator(content);
        if (validationResult !== true) {
          return {
            success: false,
            error: typeof validationResult === 'string' ? validationResult : 'Content validation failed',
            metadata: this.createEmptyMetadata(filePath, Date.now() - startTime),
          };
        }
      }

      // Write content to file
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await vscode.workspace.fs.writeFile(uri, data);

      // Get file stats after write
      const stat = await vscode.workspace.fs.stat(uri);
      const metadata = this.extractFileMetadata(filePath, content, stat, Date.now() - startTime);

      getDebugConsole().logError(`File written: ${filePath} (${data.length} bytes)`);

      return {
        success: true,
        data: data.length, // Return bytes written
        metadata,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Report error to diagnostics
      try {
        const uri = vscode.Uri.file(filePath);
        reportError(uri, `File write error: ${errorMessage}`);
      } catch {
        // Ignore reporting errors
      }

      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath, Date.now() - startTime),
      };
    }
  }

  /**
   * Get file information without reading content
   * @param filePath - Path to get info for
   * @returns File metadata
   */
  public async getFileInfo(filePath: string): Promise<FileOperationResult<FileMetadata>> {
    const startTime = Date.now();

    try {
      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);

      const metadata = {
        size: stat.size,
        lines: 0, // Unknown without reading content
        words: 0, // Unknown without reading content
        characters: 0, // Unknown without reading content
        encoding: 'unknown',
        lastModified: stat.mtime,
        extension: this.getFileExtension(filePath),
        processingTime: Date.now() - startTime,
      };

      return {
        success: true,
        data: metadata,
        metadata,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: errorMessage,
        metadata: this.createEmptyMetadata(filePath, Date.now() - startTime),
      };
    }
  }

  /**
   * Validate file content with custom validator
   * @param filePath - Path to validate
   * @param validator - Validation function
   * @returns Validation result
   */
  public async validateFile(
    filePath: string,
    validator: (content: string) => boolean | string
  ): Promise<FileOperationResult<boolean>> {
    const readResult = await this.readFile(filePath, { validator });
    
    const result: FileOperationResult<boolean> = {
      success: readResult.success,
      data: readResult.success,
      metadata: readResult.metadata,
    };
    
    if (readResult.error) {
      result.error = readResult.error;
    }
    
    return result;
  }

  /**
   * Extract metadata from file content
   */
  private extractFileMetadata(
    filePath: string, 
    content: string, 
    stat: vscode.FileStat, 
    processingTime: number
  ): FileMetadata {
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(word => word.length > 0);

    return {
      size: stat.size,
      lines: lines.length,
      words: words.length,
      characters: content.length,
      encoding: 'utf-8',
      lastModified: stat.mtime,
      extension: this.getFileExtension(filePath),
      processingTime,
    };
  }

  /**
   * Create empty metadata for error cases
   */
  private createEmptyMetadata(filePath: string, processingTime: number, size: number = 0): FileMetadata {
    return {
      size,
      lines: 0,
      words: 0,
      characters: 0,
      encoding: 'unknown',
      lastModified: 0,
      extension: this.getFileExtension(filePath),
      processingTime,
    };
  }

  /**
   * Get file extension from path
   */
  private getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext || '';
  }
}

/**
 * Global file operations manager instance
 */
let globalManager: FileOperationsHost | null = null;

/**
 * Get or create the global file operations manager
 */
export function getFileOperationsManager(): FileOperationsHost {
  if (!globalManager) {
    globalManager = new FileOperationsHost();
  }
  return globalManager;
}

/**
 * Convenience function to read a file
 */
export function readFile(filePath: string, options?: FileOperationOptions): Promise<FileOperationResult<string>> {
  const manager = getFileOperationsManager();
  return manager.readFile(filePath, options);
}

/**
 * Convenience function to write a file
 */
export function writeFile(filePath: string, content: string, options?: FileOperationOptions): Promise<FileOperationResult<number>> {
  const manager = getFileOperationsManager();
  return manager.writeFile(filePath, content, options);
}

/**
 * Convenience function to get file info
 */
export function getFileInfo(filePath: string): Promise<FileOperationResult<FileMetadata>> {
  const manager = getFileOperationsManager();
  return manager.getFileInfo(filePath);
}

/**
 * Convenience function to validate a file
 */
export function validateFile(filePath: string, validator: (content: string) => boolean | string): Promise<FileOperationResult<boolean>> {
  const manager = getFileOperationsManager();
  return manager.validateFile(filePath, validator);
} 