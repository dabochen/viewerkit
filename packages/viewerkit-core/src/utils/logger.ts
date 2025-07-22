/**
 * Logger utility for ViewerKit debugging
 */

export interface LoggerConfig {
  enabled: boolean;
  prefix: string;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = { enabled: true, prefix: '[VIEWERKIT]' }) {
    this.config = config;
  }

  log(message: string, ...args: any[]) {
    if (this.config.enabled) {
      console.log(`${this.config.prefix} ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.config.enabled) {
      console.error(`${this.config.prefix} ❌ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.config.enabled) {
      console.warn(`${this.config.prefix} ⚠️ ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.config.enabled) {
      console.debug(`${this.config.prefix} 🐛 ${message}`, ...args);
    }
  }

  // Specialized loggers for different components
  static createAutosaveLogger(): Logger {
    return new Logger({ enabled: true, prefix: '[AUTO-SAVE]' });
  }

  static createFileWatcherLogger(): Logger {
    return new Logger({ enabled: true, prefix: '[FILE-WATCHER]' });
  }

  static createConflictLogger(): Logger {
    return new Logger({ enabled: true, prefix: '[CONFLICT]' });
  }
}
