import { Message } from './runtime/bridge';

/**
 * Performance metrics tracking
 */
interface PerformanceMetrics {
  messagesPerSecond: number;
  averageResponseTime: number;
  totalMessages: number;
  errorCount: number;
  lastUpdate: number;
}

/**
 * Debug console log entry
 */
interface DebugLogEntry {
  timestamp: number;
  type: 'sent' | 'received' | 'error' | 'performance';
  message: Message | string;
  responseTime?: number;
  stack?: string;
}

/**
 * Debug Console class for development-only debugging
 * Shows real-time message traffic and performance metrics
 */
export class DebugConsole {
  private static instance: DebugConsole | null = null;
  private isEnabled = false;
  private logs: DebugLogEntry[] = [];
  private metrics: PerformanceMetrics = {
    messagesPerSecond: 0,
    averageResponseTime: 0,
    totalMessages: 0,
    errorCount: 0,
    lastUpdate: Date.now(),
  };
  private readonly MAX_LOGS = 1000; // Limit memory usage
  private readonly METRICS_UPDATE_INTERVAL = 1000; // 1 second
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private requestTimestamps = new Map<string, number>();

  private constructor() {
    // Only enable in development mode
    this.isEnabled = this.isDevelopmentMode();
    
    if (this.isEnabled) {
      this.startMetricsCollection();
      console.log('ViewerKit Debug Console enabled');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DebugConsole {
    if (!DebugConsole.instance) {
      DebugConsole.instance = new DebugConsole();
    }
    return DebugConsole.instance;
  }

  /**
   * Log a sent message
   */
  public logSentMessage(message: Message): void {
    if (!this.isEnabled) return;

    // Track request timestamp for response time calculation
    if (message.id) {
      this.requestTimestamps.set(message.id, Date.now());
    }

    this.addLog({
      timestamp: Date.now(),
      type: 'sent',
      message,
    });

    this.updateMetrics();
  }

  /**
   * Log a received message
   */
  public logReceivedMessage(message: Message): void {
    if (!this.isEnabled) return;

    let responseTime: number | undefined;

    // Calculate response time for request/response pairs
    if (message.id && message.type.endsWith('_response')) {
      const requestTime = this.requestTimestamps.get(message.id);
      if (requestTime) {
        responseTime = Date.now() - requestTime;
        this.requestTimestamps.delete(message.id);
      }
    }

    const logEntry: DebugLogEntry = {
      timestamp: Date.now(),
      type: 'received',
      message,
    };

    if (responseTime !== undefined) {
      logEntry.responseTime = responseTime;
    }

    this.addLog(logEntry);
    this.updateMetrics();
  }

  /**
   * Log an error
   */
  public logError(error: string | Error, context?: string): void {
    if (!this.isEnabled) return;

    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const logEntry: DebugLogEntry = {
      timestamp: Date.now(),
      type: 'error',
      message: context ? `${context}: ${errorMessage}` : errorMessage,
    };

    if (stack !== undefined) {
      logEntry.stack = stack;
    }

    this.addLog(logEntry);
    this.metrics.errorCount++;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent debug logs
   */
  public getLogs(count = 50): DebugLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs and reset metrics
   */
  public clear(): void {
    if (!this.isEnabled) return;

    this.logs = [];
    this.requestTimestamps.clear();
    this.metrics = {
      messagesPerSecond: 0,
      averageResponseTime: 0,
      totalMessages: 0,
      errorCount: 0,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Generate a performance report
   */
  public generateReport(): string {
    if (!this.isEnabled) {
      return 'Debug console not enabled (not in development mode)';
    }

    const recentLogs = this.getLogs(100);
    const errorLogs = recentLogs.filter(log => log.type === 'error');
    const responseTimes = recentLogs
      .filter(log => log.responseTime !== undefined)
      .map(log => log.responseTime!);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return `
ViewerKit Debug Report
=====================
Total Messages: ${this.metrics.totalMessages}
Messages/Second: ${this.metrics.messagesPerSecond.toFixed(2)}
Average Response Time: ${avgResponseTime.toFixed(2)}ms
Error Count: ${this.metrics.errorCount}
Recent Errors: ${errorLogs.length}

Recent Activity (last ${recentLogs.length} events):
${recentLogs.slice(-10).map(log => 
  `${new Date(log.timestamp).toISOString().substr(11, 12)} [${log.type.toUpperCase()}] ${
    typeof log.message === 'string' ? log.message : JSON.stringify(log.message).substr(0, 100)
  }${log.responseTime ? ` (${log.responseTime}ms)` : ''}`
).join('\n')}
    `.trim();
  }

  /**
   * Check if running in development mode
   */
  private isDevelopmentMode(): boolean {
    try {
      // Check for common development environment indicators
      return (
        process.env.NODE_ENV === 'development' ||
        process.env.VSCODE_DEBUG_MODE === 'true' ||
        process.env.VIEWERKIT_DEBUG === 'true' ||
        // Check if running from source (not bundled)
        __filename.includes('src/') ||
        false
      );
    } catch {
      return false;
    }
  }

  /**
   * Add a log entry
   */
  private addLog(entry: DebugLogEntry): void {
    this.logs.push(entry);

    // Limit memory usage by removing old logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS / 2); // Keep last half
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    this.metrics.totalMessages++;
  }

  /**
   * Start collecting performance metrics
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      const now = Date.now();
      const timeDelta = (now - this.metrics.lastUpdate) / 1000; // seconds
      
      // Calculate messages per second based on recent activity
      const recentLogs = this.logs.filter(log => 
        log.timestamp > now - this.METRICS_UPDATE_INTERVAL &&
        (log.type === 'sent' || log.type === 'received')
      );
      
      this.metrics.messagesPerSecond = recentLogs.length / timeDelta;
      
      // Calculate average response time from recent logs
      const recentResponseTimes = this.logs
        .filter(log => 
          log.timestamp > now - this.METRICS_UPDATE_INTERVAL && 
          log.responseTime !== undefined
        )
        .map(log => log.responseTime!);
      
      if (recentResponseTimes.length > 0) {
        this.metrics.averageResponseTime = 
          recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length;
      }
      
      this.metrics.lastUpdate = now;
    }, this.METRICS_UPDATE_INTERVAL);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    this.logs = [];
    this.requestTimestamps.clear();
  }
}

/**
 * Get the global debug console instance
 */
export function getDebugConsole(): DebugConsole {
  return DebugConsole.getInstance();
}

/**
 * Convenience function to log debug information
 */
export function debugLog(message: string, data?: unknown): void {
  const console = getDebugConsole();
  if (data) {
    console.logError(`${message}: ${JSON.stringify(data)}`);
  } else {
    console.logError(message);
  }
} 