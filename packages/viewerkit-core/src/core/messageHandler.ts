/**
 * VS Code message handler for webview communication
 */

import { VSCodeMessage } from '../utils/types';
import { Logger } from '../utils/logger';

const logger = Logger.createFileWatcherLogger();

export interface MessageHandlerCallbacks {
  onFileUpdate: (content: string, filePath: string) => void;
  onError: (error: string) => void;
}

export class MessageHandler {
  private callbacks: MessageHandlerCallbacks;
  private cleanup: (() => void) | null = null;

  constructor(callbacks: MessageHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start listening for VS Code messages
   */
  start(): void {
    if (this.cleanup) {
      logger.warn('Message handler already started');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as VSCodeMessage;
      
      if (message.type === 'update') {
        const content = message.content || '';
        const filePath = message.filePath || '';
        
        logger.log('📨 Received update message:', {
          filePath,
          contentLength: content.length
        });
        
        this.callbacks.onFileUpdate(content, filePath);
      } else if (message.type === 'error') {
        const error = message.content || 'Unknown error';
        logger.error('Received error message:', error);
        this.callbacks.onError(error);
      }
    };

    window.addEventListener('message', handleMessage);
    this.cleanup = () => window.removeEventListener('message', handleMessage);
    
    logger.log('🎧 Message handler started');
  }

  /**
   * Stop listening for VS Code messages
   */
  stop(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
      logger.log('🛑 Message handler stopped');
    }
  }

  /**
   * Send a message to VS Code
   */
  sendMessage(message: VSCodeMessage): void {
    if (window.vscode) {
      logger.log('📤 Sending message to VS Code:', message.type);
      window.vscode.postMessage(message);
    } else {
      logger.error('VS Code API not available');
    }
  }

  /**
   * Send a save request to VS Code
   */
  sendSaveRequest(content: string, filePath: string): void {
    this.sendMessage({
      type: 'save',
      content,
      filePath
    });
  }
}
