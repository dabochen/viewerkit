import * as vscode from 'vscode';
import { flagInternalWrite } from '../hotReload/host';
import { getDebugConsole } from '../../core/debugConsole';
import { reportError, reportDiagnostics } from '../../core/diagnostics';
import { writeFile as fileOpsWriteFile, readFile as fileOpsReadFile } from '../fileOps/host';

/**
 * Autosave options
 */
export interface AutosaveOptions {
  /** Debounce time in milliseconds (default: 400ms) */
  debounceMs?: number;
  /** Whether to create backup before saving */
  createBackup?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to flag writes as internal for hot reload */
  flagInternalWrites?: boolean;
}

/**
 * Autosave operation result
 */
export interface AutosaveResult {
  success: boolean;
  error?: string;
  bytesWritten?: number;
  timestamp: number;
}

/**
 * Pending autosave operation
 */
interface PendingOperation {
  timer: ReturnType<typeof setTimeout>;
  content: string;
  options: AutosaveOptions;
  resolve: (result: AutosaveResult) => void;
  reject: (error: Error) => void;
}

/**
 * Autosave manager that handles debounced file writing
 * Integrates with hot reload system to prevent loops
 */
export class AutosaveManager {
  private static instance: AutosaveManager | null = null;
  private pendingOperations = new Map<string, PendingOperation>();
  private isDisposed = false;

  private constructor() {
    // Empty constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AutosaveManager {
    if (!AutosaveManager.instance) {
      AutosaveManager.instance = new AutosaveManager();
    }
    return AutosaveManager.instance;
  }

  /**
   * Save content to a file with debouncing
   */
  public async autosave(
    path: string,
    content: string,
    options: AutosaveOptions = {}
  ): Promise<AutosaveResult> {
    if (this.isDisposed) {
      throw new Error('AutosaveManager has been disposed');
    }

    const {
      debounceMs = 400,
      createBackup = false,
      maxRetries = 3,
      flagInternalWrites = true,
    } = options;

    return new Promise<AutosaveResult>((resolve, reject) => {
      // Cancel existing operation for this path
      const existing = this.pendingOperations.get(path);
      if (existing) {
        clearTimeout(existing.timer);
        existing.reject(new Error('Autosave cancelled due to newer operation'));
      }

      // Create new debounced operation
      const timer = setTimeout(async () => {
        try {
          const result = await this.performSave(path, content, {
            createBackup,
            maxRetries,
            flagInternalWrites,
          });
          this.pendingOperations.delete(path);
          resolve(result);
        } catch (error) {
          this.pendingOperations.delete(path);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }, debounceMs);

      // Store pending operation
      this.pendingOperations.set(path, {
        timer,
        content,
        options: { debounceMs, createBackup, maxRetries, flagInternalWrites },
        resolve,
        reject,
      });

      getDebugConsole().logError(`Autosave scheduled for: ${path} (debounce: ${debounceMs}ms)`);
    });
  }

  /**
   * Perform the actual file save operation
   */
  private async performSave(
    path: string,
    content: string,
    options: {
      createBackup: boolean;
      maxRetries: number;
      flagInternalWrites: boolean;
    }
  ): Promise<AutosaveResult> {
    const { createBackup, maxRetries, flagInternalWrites } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const uri = vscode.Uri.file(path);

        // Create backup if requested
        if (createBackup) {
          await this.createBackup(uri);
        }

        // Flag as internal write to prevent hot reload loops
        if (flagInternalWrites) {
          flagInternalWrite(path);
        }

        // Write content to file using universal fileOps
        const writeResult = await fileOpsWriteFile(path, content);
        
        if (!writeResult.success) {
          throw new Error(writeResult.error || 'FileOps write failed');
        }

        const result: AutosaveResult = {
          success: true,
          bytesWritten: writeResult.data || 0,
          timestamp: Date.now(),
        };

        getDebugConsole().logError(`Autosave completed: ${path} (${writeResult.data} bytes)`);

        // Report successful save to diagnostics using fileOps metadata
        reportDiagnostics(uri, {
          fileSize: writeResult.metadata.size,
          lastModified: writeResult.metadata.lastModified,
          characterCount: writeResult.metadata.characters,
          lineCount: writeResult.metadata.lines,
          wordCount: writeResult.metadata.words,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        getDebugConsole().logError(lastError, `autosave-attempt-${attempt}`);

        // Report error to diagnostics
        if (attempt === maxRetries) {
          const uri = vscode.Uri.file(path);
          reportError(uri, `Autosave failed after ${maxRetries} attempts: ${lastError.message}`);
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 100));
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      timestamp: Date.now(),
    };
  }

  /**
   * Create a backup of the existing file using universal fileOps
   */
  private async createBackup(uri: vscode.Uri): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${uri.fsPath}.backup-${timestamp}`;

      // Check if original file exists and read its content
      const readResult = await fileOpsReadFile(uri.fsPath);
      
      if (readResult.success && readResult.data) {
        // File exists, create backup using fileOps
        const backupResult = await fileOpsWriteFile(backupPath, readResult.data);
        
        if (backupResult.success) {
          getDebugConsole().logError(`Backup created: ${backupPath} (${backupResult.data} bytes)`);
        } else {
          getDebugConsole().logError(new Error(`Backup creation failed: ${backupResult.error}`), 'createBackup');
        }
      } else {
        // Original file doesn't exist or can't be read, no backup needed
        getDebugConsole().logError(`No backup needed for: ${uri.fsPath} (file doesn't exist)`);
      }
    } catch (error) {
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'createBackup'
      );
    }
  }

  /**
   * Cancel pending autosave for a specific path
   */
  public cancelAutosave(path: string): boolean {
    const pending = this.pendingOperations.get(path);
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Autosave cancelled'));
      this.pendingOperations.delete(path);
      getDebugConsole().logError(`Autosave cancelled for: ${path}`);
      return true;
    }
    return false;
  }

  /**
   * Get pending autosave operations
   */
  public getPendingOperations(): string[] {
    return Array.from(this.pendingOperations.keys());
  }

  /**
   * Force immediate save for all pending operations
   */
  public async flushAll(): Promise<AutosaveResult[]> {
    const pending = Array.from(this.pendingOperations.entries());
    const results: AutosaveResult[] = [];

    for (const [path, operation] of pending) {
      try {
        clearTimeout(operation.timer);
        const result = await this.performSave(path, operation.content, {
          createBackup: operation.options.createBackup || false,
          maxRetries: operation.options.maxRetries || 3,
          flagInternalWrites: operation.options.flagInternalWrites !== false,
        });
        results.push(result);
        operation.resolve(result);
      } catch (error) {
        const errorResult: AutosaveResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        };
        results.push(errorResult);
        operation.reject(error instanceof Error ? error : new Error(String(error)));
      }
      this.pendingOperations.delete(path);
    }

    return results;
  }

  /**
   * Dispose the autosave manager and cancel all pending operations
   */
  public dispose(): void {
    this.isDisposed = true;

    // Cancel all pending operations
    for (const [, operation] of this.pendingOperations.entries()) {
      clearTimeout(operation.timer);
      operation.reject(new Error('AutosaveManager disposed'));
    }

    this.pendingOperations.clear();
    getDebugConsole().logError('AutosaveManager disposed');
  }
}

/**
 * Global autosave manager instance
 */
let globalManager: AutosaveManager | null = null;

/**
 * Get or create the global autosave manager
 */
export function getAutosaveManager(): AutosaveManager {
  if (!globalManager) {
    globalManager = AutosaveManager.getInstance();
  }
  return globalManager;
}

/**
 * Convenience function to perform autosave
 * This is the main public API for autosave functionality
 */
export function autosave(
  path: string,
  content: string,
  debounceMs?: number
): Promise<AutosaveResult> {
  const manager = getAutosaveManager();
  const options: AutosaveOptions = {};
  if (debounceMs !== undefined) {
    options.debounceMs = debounceMs;
  }
  return manager.autosave(path, content, options);
}

/**
 * Cancel pending autosave for a path
 */
export function cancelAutosave(path: string): boolean {
  const manager = getAutosaveManager();
  return manager.cancelAutosave(path);
} 