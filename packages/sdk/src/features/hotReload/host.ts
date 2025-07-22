import * as vscode from 'vscode';
import { getBridge } from '../../core/runtime/bridge';
import { getDebugConsole } from '../../core/debugConsole';

/**
 * Hot reload watch options
 */
export interface WatchOptions {
  /** Glob pattern for files to watch */
  pattern?: string;
  /** Files/patterns to ignore */
  ignored?: string[];
  /** Debounce time in milliseconds (default: 100ms) */
  debounceMs?: number;
  /** Whether to watch for file creation */
  watchCreate?: boolean;
  /** Whether to watch for file changes */
  watchChange?: boolean;
  /** Whether to watch for file deletion */
  watchDelete?: boolean;
}

/**
 * File change event data
 */
export interface FileChangeEvent {
  type: 'create' | 'change' | 'delete';
  uri: vscode.Uri;
  timestamp: number;
  path: string;
}

/**
 * Hot reload file watcher class
 * Handles file watching with debouncing and loop prevention
 */
export class HotReloadWatcher {
  private watchers = new Map<string, vscode.FileSystemWatcher>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private internalWrites = new Set<string>();
  private isDisposed = false;

  /**
   * Start watching a file or directory
   */
  public watchFile(path: string, options: WatchOptions = {}): vscode.Disposable {
    const {
      pattern = '**/*',
      ignored = ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      debounceMs = 100,
      watchCreate = true,
      watchChange = true,
      watchDelete = true,
    } = options;

    // Create file system watcher
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(path, pattern),
      !watchCreate,  // ignoreCreateEvents
      !watchChange,  // ignoreChangeEvents
      !watchDelete   // ignoreDeleteEvents
    );

    const watcherKey = `${path}:${pattern}`;
    this.watchers.set(watcherKey, watcher);

    // Set up event handlers with debouncing
    if (watchCreate) {
      watcher.onDidCreate(uri => {
        this.handleFileEvent('create', uri, ignored, debounceMs);
      });
    }

    if (watchChange) {
      watcher.onDidChange(uri => {
        this.handleFileEvent('change', uri, ignored, debounceMs);
      });
    }

    if (watchDelete) {
      watcher.onDidDelete(uri => {
        this.handleFileEvent('delete', uri, ignored, debounceMs);
      });
    }

    getDebugConsole().logError(`Hot reload watcher started for: ${path} (pattern: ${pattern})`);

    // Return disposable to stop watching
    return {
      dispose: () => {
        this.stopWatching(watcherKey);
      },
    };
  }

  /**
   * Flag a write operation as internal to prevent loops
   */
  public flagInternalWrite(path: string): void {
    this.internalWrites.add(path);
    
    // Auto-remove after a reasonable timeout
    setTimeout(() => {
      this.internalWrites.delete(path);
    }, 5000);
  }

  /**
   * Check if a path should be ignored
   */
  private shouldIgnore(uri: vscode.Uri, ignored: string[]): boolean {
    const path = uri.fsPath;

    // Check if this is an internal write
    if (this.internalWrites.has(path)) {
      getDebugConsole().logError(`Ignoring internal write: ${path}`);
      return true;
    }

    // Check ignore patterns
    for (const pattern of ignored) {
      // Simple glob pattern matching
      const regex = new RegExp(
        pattern
          .replace(/\*\*/g, '.*')  // ** matches any directory
          .replace(/\*/g, '[^/]*') // * matches any file/directory name
          .replace(/\?/g, '.')     // ? matches any single character
      );

      if (regex.test(path)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle file system events with debouncing
   */
  private handleFileEvent(
    type: 'create' | 'change' | 'delete',
    uri: vscode.Uri,
    ignored: string[],
    debounceMs: number
  ): void {
    if (this.isDisposed) return;

    // Check if we should ignore this file
    if (this.shouldIgnore(uri, ignored)) {
      return;
    }

    const path = uri.fsPath;
    const eventKey = `${type}:${path}`;

    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(eventKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.sendFileChangeEvent(type, uri);
      this.debounceTimers.delete(eventKey);
    }, debounceMs);

    this.debounceTimers.set(eventKey, timer);
  }

  /**
   * Send file change event to webview
   */
  private async sendFileChangeEvent(
    type: 'create' | 'change' | 'delete',
    uri: vscode.Uri
  ): Promise<void> {
    try {
      // Create serializable event (without vscode.Uri)
      const event = {
        type,
        timestamp: Date.now(),
        path: uri.fsPath,
      };

      const bridge = getBridge();
      await bridge.sendMessage({
        type: 'hot-reload-file-change',
        payload: event,
      });

      getDebugConsole().logError(`File ${type}: ${uri.fsPath}`, 'hotReload');
    } catch (error) {
      getDebugConsole().logError(error instanceof Error ? error : new Error(String(error)), 'hotReload');
    }
  }

  /**
   * Stop watching a specific pattern
   */
  private stopWatching(watcherKey: string): void {
    const watcher = this.watchers.get(watcherKey);
    if (watcher) {
      watcher.dispose();
      this.watchers.delete(watcherKey);
      getDebugConsole().logError(`Hot reload watcher stopped: ${watcherKey}`);
    }
  }

  /**
   * Dispose all watchers and cleanup
   */
  public dispose(): void {
    this.isDisposed = true;

    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Dispose all watchers
    this.watchers.forEach(watcher => watcher.dispose());
    this.watchers.clear();

    // Clear internal writes
    this.internalWrites.clear();
  }
}

/**
 * Global hot reload watcher instance
 */
let globalWatcher: HotReloadWatcher | null = null;

/**
 * Get or create the global hot reload watcher
 */
export function getHotReloadWatcher(): HotReloadWatcher {
  if (!globalWatcher) {
    globalWatcher = new HotReloadWatcher();
  }
  return globalWatcher;
}

/**
 * Convenience function to start watching a file
 * This is the main public API for hot reload functionality
 */
export function watchFile(path: string, options?: WatchOptions): vscode.Disposable {
  const watcher = getHotReloadWatcher();
  return watcher.watchFile(path, options);
}

/**
 * Flag an internal write to prevent hot reload loops
 */
export function flagInternalWrite(path: string): void {
  const watcher = getHotReloadWatcher();
  watcher.flagInternalWrite(path);
} 