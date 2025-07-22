import { getBridge } from '../../core/runtime/bridge';
import { getDebugConsole } from '../../core/debugConsole';

/**
 * Autosave request options for webview
 */
export interface WebAutosaveOptions {
  /** Debounce time in milliseconds (default: 400ms) */
  debounceMs?: number;
  /** Whether to create backup before saving */
  createBackup?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Autosave result from host
 */
export interface WebAutosaveResult {
  success: boolean;
  error?: string;
  bytesWritten?: number;
  timestamp: number;
}

/**
 * Pending autosave request
 */
interface PendingRequest {
  timer: ReturnType<typeof setTimeout>;
  resolve: (result: WebAutosaveResult) => void;
  reject: (error: Error) => void;
  content: string;
  options: WebAutosaveOptions;
}

/**
 * Webview autosave manager
 * Manages debounced autosave requests to the host
 */
export class WebAutosaveManager {
  private static instance: WebAutosaveManager | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WebAutosaveManager {
    if (!WebAutosaveManager.instance) {
      WebAutosaveManager.instance = new WebAutosaveManager();
    }
    return WebAutosaveManager.instance;
  }

  /**
   * Request autosave for a file with debouncing
   */
  public async autosave(
    path: string,
    content: string,
    options: WebAutosaveOptions = {}
  ): Promise<WebAutosaveResult> {
    const { debounceMs = 400 } = options;

    return new Promise<WebAutosaveResult>((resolve, reject) => {
      // Cancel existing request for this path
      const existing = this.pendingRequests.get(path);
      if (existing) {
        clearTimeout(existing.timer);
        existing.reject(new Error('Autosave cancelled due to newer request'));
      }

      // Create new debounced request
      const timer = setTimeout(async () => {
        try {
          const result = await this.performAutosaveRequest(path, content, options);
          this.pendingRequests.delete(path);
          resolve(result);
        } catch (error) {
          this.pendingRequests.delete(path);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }, debounceMs);

      // Store pending request
      this.pendingRequests.set(path, {
        timer,
        resolve,
        reject,
        content,
        options,
      });

      getDebugConsole().logError(`Autosave request scheduled: ${path} (debounce: ${debounceMs}ms)`);
    });
  }

  /**
   * Perform the actual autosave request to host
   */
  private async performAutosaveRequest(
    path: string,
    content: string,
    options: WebAutosaveOptions
  ): Promise<WebAutosaveResult> {
    try {
      const bridge = getBridge();
      const result = await bridge.sendRequest<WebAutosaveResult>('autosave', {
        path,
        content,
        options,
      });

      getDebugConsole().logError(`Autosave request completed: ${path}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'autosaveRequest'
      );

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Cancel pending autosave request for a path
   */
  public cancelAutosave(path: string): boolean {
    const pending = this.pendingRequests.get(path);
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Autosave cancelled'));
      this.pendingRequests.delete(path);
      getDebugConsole().logError(`Autosave request cancelled: ${path}`);
      return true;
    }
    return false;
  }

  /**
   * Get paths with pending autosave requests
   */
  public getPendingPaths(): string[] {
    return Array.from(this.pendingRequests.keys());
  }

  /**
   * Force immediate autosave for all pending requests
   */
  public async flushAll(): Promise<WebAutosaveResult[]> {
    const pending = Array.from(this.pendingRequests.entries());
    const results: WebAutosaveResult[] = [];

    for (const [path, request] of pending) {
      try {
        clearTimeout(request.timer);
        const result = await this.performAutosaveRequest(path, request.content, request.options);
        results.push(result);
        request.resolve(result);
      } catch (error) {
        const errorResult: WebAutosaveResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        };
        results.push(errorResult);
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
      this.pendingRequests.delete(path);
    }

    return results;
  }

  /**
   * Initialize bridge message handling
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Note: In this case, we're primarily sending requests to host
    // We don't need to listen for messages unless we want status updates
    
    this.isInitialized = true;
    getDebugConsole().logError('Web autosave manager initialized');
  }

  /**
   * Clear all pending requests
   */
  public clearAllRequests(): void {
    for (const [, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timer);
      request.reject(new Error('All requests cleared'));
    }
    this.pendingRequests.clear();
    getDebugConsole().logError('All autosave requests cleared');
  }

  /**
   * Get request count for debugging
   */
  public getRequestCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * Get the global web autosave manager
 */
export function getWebAutosaveManager(): WebAutosaveManager {
  return WebAutosaveManager.getInstance();
}

/**
 * Convenience function to request autosave
 */
export function autosave(
  path: string,
  content: string,
  debounceMs?: number
): Promise<WebAutosaveResult> {
  const manager = getWebAutosaveManager();
  const options: WebAutosaveOptions = {};
  if (debounceMs !== undefined) {
    options.debounceMs = debounceMs;
  }
  return manager.autosave(path, content, options);
}

/**
 * Cancel pending autosave for a path
 */
export function cancelAutosave(path: string): boolean {
  const manager = getWebAutosaveManager();
  return manager.cancelAutosave(path);
}

/**
 * Setup autosave for text content with React integration
 * Returns a function to trigger autosave
 */
export function useAutosave(
  path: string,
  debounceMs: number = 400
): (content: string) => Promise<WebAutosaveResult> {
  const manager = getWebAutosaveManager();
  
  return (content: string) => {
    return manager.autosave(path, content, { debounceMs });
  };
} 