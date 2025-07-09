import * as vscode from 'vscode';
import { getDebugConsole } from '../debugConsole';

/**
 * Base message interface for all bridge communications
 * All messages must extend this interface for type safety
 */
export interface Message {
  type: string;
  payload?: unknown;
  id?: string;
  error?: string;
}

/**
 * Bridge class that handles bidirectional communication between host and webview
 * Provides unified postMessage handling, error capture, and promise-based patterns
 */
export class Bridge {
  private webviewPanel: vscode.WebviewPanel | null = null;
  private messageHandlers = new Map<string, (message: Message) => void | Promise<void>>();
  private pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private requestIdCounter = 0;

  constructor(webviewPanel?: vscode.WebviewPanel) {
    if (webviewPanel) {
      this.setWebviewPanel(webviewPanel);
    }
  }

  /**
   * Set the webview panel for communication
   */
  setWebviewPanel(panel: vscode.WebviewPanel): void {
    this.webviewPanel = panel;
    
    // Listen for messages from webview
    panel.webview.onDidReceiveMessage(
      (message: Message) => this.handleMessage(message),
      undefined,
      []
    );

    // Clean up pending requests when panel is disposed
    panel.onDidDispose(() => {
      this.cleanup();
    });
  }

  /**
   * Register a message handler for a specific message type
   */
  onMessage<T extends Message>(type: string, handler: (message: T) => void | Promise<void>): void {
    this.messageHandlers.set(type, handler as (message: Message) => void | Promise<void>);
  }

  /**
   * Send a message to the webview
   */
  async sendMessage(message: Message): Promise<void> {
    if (!this.webviewPanel) {
      const error = new Error('Bridge: No webview panel set');
      getDebugConsole().logError(error);
      throw error;
    }

    try {
      await this.webviewPanel.webview.postMessage(message);
      getDebugConsole().logSentMessage(message);
    } catch (error) {
      const bridgeError = new Error(`Bridge: Failed to send message - ${error}`);
      getDebugConsole().logError(bridgeError, 'sendMessage');
      throw bridgeError;
    }
  }

  /**
   * Send a request message and wait for a response (promise-based pattern)
   */
  async sendRequest<TResponse = unknown>(type: string, payload?: unknown): Promise<TResponse> {
    const requestId = `req_${++this.requestIdCounter}`;
    
    const promise = new Promise<TResponse>((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });

    await this.sendMessage({
      type,
      payload,
      id: requestId,
    });

    return promise;
  }

  /**
   * Send a response to a request message
   */
  async sendResponse(originalMessage: Message, payload?: unknown, error?: string): Promise<void> {
    if (!originalMessage.id) {
      throw new Error('Bridge: Cannot send response to message without ID');
    }

    const response: Message = {
      type: `${originalMessage.type}_response`,
      id: originalMessage.id,
    };

    if (payload !== undefined) {
      response.payload = payload;
    }

    if (error !== undefined) {
      response.error = error;
    }

    await this.sendMessage(response);
  }

  /**
   * Handle incoming messages from webview
   */
  private async handleMessage(message: Message): Promise<void> {
    try {
      getDebugConsole().logReceivedMessage(message);

      // Handle responses to requests
      if (message.type.endsWith('_response') && message.id) {
        const pendingRequest = this.pendingRequests.get(message.id);
        if (pendingRequest) {
          this.pendingRequests.delete(message.id);
          
          if (message.error) {
            pendingRequest.reject(new Error(message.error));
          } else {
            pendingRequest.resolve(message.payload);
          }
        }
        return;
      }

      // Handle regular messages
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        await handler(message);
      } else {
        const warning = `Bridge: No handler registered for message type: ${message.type}`;
        console.warn(warning);
        getDebugConsole().logError(warning, 'handleMessage');
      }
    } catch (error) {
      const errorMessage = `Bridge: Error handling message ${message.type}`;
      console.error(errorMessage, error);
      getDebugConsole().logError(error instanceof Error ? error : new Error(String(error)), 'handleMessage');
      
      // Send error response if this was a request
      if (message.id) {
        await this.sendResponse(message, undefined, `Error handling message: ${error}`);
      }
    }
  }

  /**
   * Clean up resources and pending requests
   */
  private cleanup(): void {
    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Bridge: Webview panel disposed'));
    });
    this.pendingRequests.clear();
    
    // Clear message handlers
    this.messageHandlers.clear();
    
    this.webviewPanel = null;
  }

  /**
   * Check if the bridge is ready for communication
   */
  isReady(): boolean {
    return this.webviewPanel !== null;
  }
}

/**
 * Global bridge instance for singleton pattern
 */
let globalBridge: Bridge | null = null;

/**
 * Get or create the global bridge instance
 */
export function getBridge(): Bridge {
  if (!globalBridge) {
    globalBridge = new Bridge();
  }
  return globalBridge;
} 