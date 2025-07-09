import { getBridge } from '../../core/runtime/bridge';
import { getDebugConsole } from '../../core/debugConsole';

/**
 * Simplified file change event for webview (without vscode.Uri)
 */
export interface WebFileChangeEvent {
  type: 'create' | 'change' | 'delete';
  timestamp: number;
  path: string;
}

/**
 * Hot reload event handler callback
 */
export type FileChangeHandler = (event: WebFileChangeEvent) => void | Promise<void>;

/**
 * Hot reload manager for webview side
 * Handles incoming file change messages from the host
 */
export class HotReloadWebManager {
  private static instance: HotReloadWebManager | null = null;
  private handlers = new Map<string, Set<FileChangeHandler>>();
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HotReloadWebManager {
    if (!HotReloadWebManager.instance) {
      HotReloadWebManager.instance = new HotReloadWebManager();
    }
    return HotReloadWebManager.instance;
  }

  /**
   * Add a file change handler for a specific path pattern
   */
  public onFileChange(pathPattern: string, handler: FileChangeHandler): () => void {
    if (!this.handlers.has(pathPattern)) {
      this.handlers.set(pathPattern, new Set());
    }

    const handlers = this.handlers.get(pathPattern)!;
    handlers.add(handler);

    getDebugConsole().logError(`Hot reload handler registered for pattern: ${pathPattern}`);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(pathPattern);
      }
    };
  }

  /**
   * Remove all handlers for a path pattern
   */
  public removeHandlers(pathPattern: string): void {
    this.handlers.delete(pathPattern);
  }

  /**
   * Initialize bridge message handling
   */
  private initialize(): void {
    if (this.isInitialized) return;

    const bridge = getBridge();
    bridge.onMessage('hot-reload-file-change', (message) => {
      this.handleFileChange(message.payload as WebFileChangeEvent);
    });

    this.isInitialized = true;
    getDebugConsole().logError('Hot reload web manager initialized');
  }

  /**
   * Handle incoming file change events
   */
  private async handleFileChange(event: WebFileChangeEvent): Promise<void> {
    try {
      getDebugConsole().logError(`Received file change: ${event.type} - ${event.path}`);

      // Find matching handlers
      const matchingHandlers: FileChangeHandler[] = [];

      for (const [pattern, handlers] of this.handlers.entries()) {
        if (this.matchesPattern(event.path, pattern)) {
          matchingHandlers.push(...Array.from(handlers));
        }
      }

      // Execute all matching handlers
      const promises = matchingHandlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          getDebugConsole().logError(
            error instanceof Error ? error : new Error(String(error)),
            'fileChangeHandler'
          );
        }
      });

      await Promise.all(promises);
    } catch (error) {
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'handleFileChange'
      );
    }
  }

  /**
   * Check if a file path matches a pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')     // ** matches any directory
      .replace(/\*/g, '[^/\\\\]*') // * matches any file/directory name
      .replace(/\?/g, '.')        // ? matches any single character
      .replace(/\./g, '\\.');     // Escape dots

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filePath);
  }

  /**
   * Get current handler count for debugging
   */
  public getHandlerCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    return count;
  }

  /**
   * Get all registered patterns
   */
  public getPatterns(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers
   */
  public clearAllHandlers(): void {
    this.handlers.clear();
    getDebugConsole().logError('All hot reload handlers cleared');
  }
}

/**
 * Get the global hot reload web manager
 */
export function getHotReloadWebManager(): HotReloadWebManager {
  return HotReloadWebManager.getInstance();
}

/**
 * Convenience function to register file change handler
 */
export function onFileChange(pathPattern: string, handler: FileChangeHandler): () => void {
  const manager = getHotReloadWebManager();
  return manager.onFileChange(pathPattern, handler);
}

/**
 * Setup file watcher for automatic state updates
 * This is a convenience function for common use cases
 */
export function setupFileWatcher(
  pathPattern: string,
  updateCallback: (content: string, event: WebFileChangeEvent) => void
): () => void {
  return onFileChange(pathPattern, async (event) => {
    try {
      // For file changes, we could potentially read the file content
      // but that would require bridge communication back to host
      // For now, just call the callback with the event
      updateCallback('', event); // Content would need to be fetched via bridge
    } catch (error) {
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'setupFileWatcher'
      );
    }
  });
}

/**
 * Request file content from host (helper for setupFileWatcher)
 */
export async function requestFileContent(path: string): Promise<string> {
  try {
    const bridge = getBridge();
    const content = await bridge.sendRequest<string>('read-file', { path });
    return content || '';
  } catch (error) {
    getDebugConsole().logError(
      error instanceof Error ? error : new Error(String(error)),
      'requestFileContent'
    );
    return '';
  }
} 