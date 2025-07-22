import { useState, useEffect, useCallback, useRef } from 'react';
import { getBridge, getDebugConsole, type Message } from '@viewerkit/sdk';

/**
 * Options for useBridge hook
 */
export interface UseBridgeOptions {
  /** Whether to automatically handle bridge initialization (default: true) */
  autoInit?: boolean;
  /** Called when bridge connection state changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Called when unhandled messages are received */
  onUnhandledMessage?: (message: Message) => void;
  /** Whether to log bridge activity (default: false) */
  debug?: boolean;
}

/**
 * Message handler function type
 */
export type MessageHandler = (message: Message) => void | Promise<void>;

/**
 * Return type for useBridge hook
 */
export interface UseBridgeResult {
  /** Whether bridge is connected and ready */
  connected: boolean;
  /** Send a one-way message to host */
  sendMessage: (type: string, payload?: any) => Promise<void>;
  /** Send a request and wait for response */
  sendRequest: <T = any>(type: string, payload?: any) => Promise<T>;
  /** Register a message handler for a specific type */
  onMessage: (type: string, handler: MessageHandler) => () => void;
  /** Remove a message handler */
  offMessage: (type: string, handler: MessageHandler) => void;
  /** Remove all handlers for a message type */
  clearHandlers: (type: string) => void;
  /** Remove all message handlers */
  clearAllHandlers: () => void;
  /** Current error state */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
  /** Get bridge statistics */
  getStats: () => {
    messagesSent: number;
    messagesReceived: number;
    requestsInFlight: number;
    handlersRegistered: number;
  };
}

/**
 * React hook for advanced bridge communication
 * 
 * This hook provides low-level access to ViewerKit's bridge communication system,
 * allowing for custom message handling and advanced communication patterns between
 * the host extension and webview.
 * 
 * @param options - Configuration options
 * @returns Hook result with bridge communication functions
 * 
 * @example
 * ```tsx
 * function CustomCommunicationComponent() {
 *   const { 
 *     connected, 
 *     sendMessage, 
 *     sendRequest, 
 *     onMessage 
 *   } = useBridge({
 *     debug: true,
 *     onConnectionChange: (connected) => console.log('Bridge:', connected ? 'connected' : 'disconnected')
 *   });
 * 
 *   useEffect(() => {
 *     // Register custom message handler
 *     const unsubscribe = onMessage('custom-notification', (message) => {
 *       console.log('Received notification:', message.payload);
 *     });
 * 
 *     return unsubscribe;
 *   }, [onMessage]);
 * 
 *   const handleCustomRequest = async () => {
 *     try {
 *       const result = await sendRequest('custom-request', { data: 'test' });
 *       console.log('Request result:', result);
 *     } catch (error) {
 *       console.error('Request failed:', error);
 *     }
 *   };
 * 
 *   if (!connected) return <div>Connecting to host...</div>;
 * 
 *   return (
 *     <div>
 *       <button onClick={() => sendMessage('ping', { timestamp: Date.now() })}>
 *         Send Ping
 *       </button>
 *       <button onClick={handleCustomRequest}>
 *         Send Custom Request
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBridge(options: UseBridgeOptions = {}): UseBridgeResult {
  const {
    autoInit = true,
    onConnectionChange,
    onUnhandledMessage,
    debug = false,
  } = options;

  // State management
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing state and handlers
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const statsRef = useRef({
    messagesSent: 0,
    messagesReceived: 0,
    requestsInFlight: 0,
  });
  const bridgeRef = useRef<ReturnType<typeof getBridge> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Initialize bridge connection
   */
  const initializeBridge = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const bridge = getBridge();
      bridgeRef.current = bridge;
      
      // Set up connection state monitoring
      setConnected(true);
      onConnectionChange?.(true);
      
      if (debug) {
        getDebugConsole().logError('Bridge initialized successfully');
      }
    } catch (initError) {
      const errorMessage = initError instanceof Error ? initError.message : String(initError);
      setError(`Bridge initialization failed: ${errorMessage}`);
      setConnected(false);
      onConnectionChange?.(false);
      getDebugConsole().logError(new Error(`Bridge initialization failed: ${errorMessage}`));
    }
  }, [onConnectionChange, debug]);

  /**
   * Send a one-way message to host
   */
  const sendMessage = useCallback(async (type: string, payload?: any): Promise<void> => {
    if (!bridgeRef.current) {
      throw new Error('Bridge not initialized');
    }

    try {
      setError(null);
      
      await bridgeRef.current.sendMessage({ type, payload });
      statsRef.current.messagesSent++;
      
      if (debug) {
        getDebugConsole().logError(`Message sent: ${type}`, 'bridge');
      }
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
      setError(`Failed to send message: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Message send failed (${type}): ${errorMessage}`));
      throw sendError;
    }
  }, [debug]);

  /**
   * Send a request and wait for response
   */
  const sendRequest = useCallback(async <T = any>(
    type: string, 
    payload?: any
  ): Promise<T> => {
    if (!bridgeRef.current) {
      throw new Error('Bridge not connected');
    }

    try {
      if (debug) {
        getDebugConsole().logError(`Sending request: ${type}`, 'bridge');
      }
      
      setError(null);
      statsRef.current.requestsInFlight++;
      
      const result = await bridgeRef.current.sendRequest<T>(type, payload);
      statsRef.current.messagesSent++;
      statsRef.current.messagesReceived++;
      
      if (debug) {
        getDebugConsole().logError(`Request completed: ${type}`, 'bridge');
      }
      
      return result;
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : String(requestError);
      setError(`Request failed: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Request failed (${type}): ${errorMessage}`));
      throw requestError;
    } finally {
      statsRef.current.requestsInFlight--;
    }
  }, [debug]);

  /**
   * Register a message handler for a specific type
   */
  const onMessage = useCallback((type: string, handler: MessageHandler): (() => void) => {
    const handlers = handlersRef.current;
    
    if (!handlers.has(type)) {
      handlers.set(type, new Set());
    }
    
    const typeHandlers = handlers.get(type)!;
    typeHandlers.add(handler);
    
    // Set up bridge message listener if this is the first handler for this type
    if (typeHandlers.size === 1 && bridgeRef.current) {
      bridgeRef.current.onMessage(type, async (message: Message) => {
        statsRef.current.messagesReceived++;
        
        const currentHandlers = handlersRef.current.get(type);
        if (currentHandlers && currentHandlers.size > 0) {
          // Execute all handlers for this message type
          const promises = (Array.from(currentHandlers) as MessageHandler[]).map(async (h) => {
            try {
              await h(message);
            } catch (handlerError) {
              getDebugConsole().logError(
                handlerError instanceof Error ? handlerError : new Error(String(handlerError)),
                'messageHandler'
              );
            }
          });
          
          await Promise.all(promises);
        } else {
          // No handlers registered - call unhandled message callback
          onUnhandledMessage?.(message);
        }
      });
    }
    
    if (debug) {
      getDebugConsole().logError(`Message handler registered for: ${type}`);
    }
    
    // Return unsubscribe function
    return () => {
      typeHandlers.delete(handler);
      if (typeHandlers.size === 0) {
        handlers.delete(type);
      }
    };
  }, [onUnhandledMessage, debug]);

  /**
   * Remove a specific message handler
   */
  const offMessage = useCallback((type: string, handler: MessageHandler): void => {
    const handlers = handlersRef.current;
    const typeHandlers = handlers.get(type);
    
    if (typeHandlers) {
      typeHandlers.delete(handler);
      if (typeHandlers.size === 0) {
        handlers.delete(type);
      }
    }
  }, []);

  /**
   * Remove all handlers for a message type
   */
  const clearHandlers = useCallback((type: string): void => {
    const handlers = handlersRef.current;
    handlers.delete(type);
    
    if (debug) {
      getDebugConsole().logError(`All handlers cleared for: ${type}`);
    }
  }, [debug]);

  /**
   * Remove all message handlers
   */
  const clearAllHandlers = useCallback((): void => {
    handlersRef.current.clear();
    
    if (debug) {
      getDebugConsole().logError('All message handlers cleared');
    }
  }, [debug]);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /**
   * Get bridge statistics
   */
  const getStats = useCallback(() => {
    const handlers = handlersRef.current;
    let totalHandlers = 0;
    handlers.forEach((typeHandlers: Set<MessageHandler>) => {
      totalHandlers += typeHandlers.size;
    });

    return {
      messagesSent: statsRef.current.messagesSent,
      messagesReceived: statsRef.current.messagesReceived,
      requestsInFlight: statsRef.current.requestsInFlight,
      handlersRegistered: totalHandlers,
    };
  }, []);

  // Effect: Initialize bridge on mount
  useEffect(() => {
    if (autoInit) {
      initializeBridge();
    }
  }, [autoInit, initializeBridge]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      clearAllHandlers();
    };
  }, [clearAllHandlers]);

  return {
    connected,
    sendMessage,
    sendRequest,
    onMessage,
    offMessage,
    clearHandlers,
    clearAllHandlers,
    error,
    clearError,
    getStats,
  };
}

/**
 * Convenience hook for simple message listening
 * 
 * A lightweight version of useBridge that only provides message listening
 * capabilities without the full bridge API.
 * 
 * @param messageType - The message type to listen for
 * @param handler - Function to handle received messages
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * function NotificationListener() {
 *   useMessageListener('notification', (message) => {
 *     console.log('Notification received:', message.payload);
 *   });
 * 
 *   return <div>Listening for notifications...</div>;
 * }
 * ```
 */
export function useMessageListener(
  messageType: string,
  handler: MessageHandler,
  options: { debug?: boolean } = {}
): void {
  const { onMessage } = useBridge({ 
    debug: options.debug ?? false,
    autoInit: true 
  });

  useEffect(() => {
    const unsubscribe = onMessage(messageType, handler);
    return unsubscribe;
  }, [messageType, handler, onMessage]);
} 