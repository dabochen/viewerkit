import * as vscode from 'vscode';

/**
 * Interface for serializable webview state
 */
export interface WebviewState {
  scrollPosition?: { x: number; y: number };
  selection?: unknown;
  customData?: Record<string, unknown>;
  timestamp?: number;
}

/**
 * WebviewState class handles automatic save/restore of webview state across sessions
 * Integrates with VS Code's state API for persistence
 */
export class WebviewStateManager {
  private context: vscode.ExtensionContext;
  private stateKey: string;
  private currentState: WebviewState = {};
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DEBOUNCE_MS = 500;

  constructor(context: vscode.ExtensionContext, stateKey: string) {
    this.context = context;
    this.stateKey = stateKey;
  }

  /**
   * Load previously saved state
   */
  loadState(): WebviewState {
    const savedState = this.context.globalState.get<WebviewState>(this.stateKey);
    this.currentState = savedState || {};
    return { ...this.currentState };
  }

  /**
   * Update current state (debounced save)
   */
  updateState(newState: Partial<WebviewState>): void {
    this.currentState = {
      ...this.currentState,
      ...newState,
      timestamp: Date.now(),
    };

    // Debounce saves to avoid excessive writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveState();
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Get current state
   */
  getState(): WebviewState {
    return { ...this.currentState };
  }

  /**
   * Save state to VS Code global storage
   */
  private async saveState(): Promise<void> {
    try {
      await this.context.globalState.update(this.stateKey, this.currentState);
    } catch (error) {
      console.error('WebviewState: Failed to save state:', error);
    }
  }

  /**
   * Clear saved state
   */
  async clearState(): Promise<void> {
    this.currentState = {};
    await this.context.globalState.update(this.stateKey, undefined);
  }

  /**
   * Update scroll position
   */
  updateScrollPosition(x: number, y: number): void {
    this.updateState({
      scrollPosition: { x, y },
    });
  }

  /**
   * Update selection state
   */
  updateSelection(selection: unknown): void {
    this.updateState({
      selection,
    });
  }

  /**
   * Set custom data
   */
  setCustomData(key: string, value: unknown): void {
    const customData = { ...this.currentState.customData };
    customData[key] = value;
    
    this.updateState({
      customData,
    });
  }

  /**
   * Get custom data
   */
  getCustomData(key: string): unknown {
    return this.currentState.customData?.[key];
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    // Force save current state before disposal
    this.saveState();
  }
}

/**
 * Create a new webview state manager instance
 */
export function createWebviewStateManager(
  context: vscode.ExtensionContext,
  stateKey: string
): WebviewStateManager {
  return new WebviewStateManager(context, stateKey);
} 