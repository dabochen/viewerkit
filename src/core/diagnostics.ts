import * as vscode from 'vscode';

/**
 * Diagnostic statistics for files and operations
 */
export interface DiagnosticStats {
  wordCount?: number;
  lineCount?: number;
  characterCount?: number;
  fileSize?: number;
  lastModified?: number;
  errors?: DiagnosticError[];
  performance?: PerformanceStats;
}

/**
 * Individual diagnostic error entry
 */
export interface DiagnosticError {
  message: string;
  severity: vscode.DiagnosticSeverity;
  line?: number;
  column?: number;
  source?: string;
  code?: string | number;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  operationTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  messageCount?: number;
}

/**
 * Diagnostics manager that handles error reporting and statistics collection
 * Integrates with VS Code's Problems panel for error display
 */
export class DiagnosticsManager {
  private static instance: DiagnosticsManager | null = null;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private stats = new Map<string, DiagnosticStats>();

  private constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('viewerkit');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DiagnosticsManager {
    if (!DiagnosticsManager.instance) {
      DiagnosticsManager.instance = new DiagnosticsManager();
    }
    return DiagnosticsManager.instance;
  }

  /**
   * Report diagnostics for a specific URI
   * This is the main public API for reporting issues
   */
  public reportDiagnostics(uri: vscode.Uri, stats: DiagnosticStats): void {
    // Store stats for later retrieval
    this.stats.set(uri.toString(), stats);

    // Convert errors to VS Code diagnostics
    if (stats.errors && stats.errors.length > 0) {
      const diagnostics = stats.errors.map(error => this.createDiagnostic(error));
      this.diagnosticCollection.set(uri, diagnostics);
    } else {
      // Clear diagnostics if no errors
      this.diagnosticCollection.delete(uri);
    }
  }

  /**
   * Clear diagnostics for a specific URI
   */
  public clearDiagnostics(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
    this.stats.delete(uri.toString());
  }

  /**
   * Clear all diagnostics
   */
  public clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
    this.stats.clear();
  }

  /**
   * Get statistics for a specific URI
   */
  public getStats(uri: vscode.Uri): DiagnosticStats | undefined {
    return this.stats.get(uri.toString());
  }

  /**
   * Get all tracked statistics
   */
  public getAllStats(): Map<string, DiagnosticStats> {
    return new Map(this.stats);
  }

  /**
   * Generate file statistics from content
   */
  public generateFileStats(content: string, uri?: vscode.Uri): DiagnosticStats {
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(word => word.length > 0);
    
    const stats: DiagnosticStats = {
      wordCount: words.length,
      lineCount: lines.length,
      characterCount: content.length,
      fileSize: Buffer.byteLength(content, 'utf8'),
      lastModified: Date.now(),
    };

    // Store stats if URI provided
    if (uri) {
      this.stats.set(uri.toString(), stats);
    }

    return stats;
  }

  /**
   * Add an error to existing diagnostics
   */
  public addError(uri: vscode.Uri, error: DiagnosticError): void {
    const existingStats = this.stats.get(uri.toString()) || {};
    const errors = existingStats.errors || [];
    
    errors.push(error);
    
    this.reportDiagnostics(uri, {
      ...existingStats,
      errors,
    });
  }

  /**
   * Add performance metrics to diagnostics
   */
  public addPerformanceStats(uri: vscode.Uri, performance: PerformanceStats): void {
    const existingStats = this.stats.get(uri.toString()) || {};
    
    this.reportDiagnostics(uri, {
      ...existingStats,
      performance: {
        ...existingStats.performance,
        ...performance,
      },
    });
  }

  /**
   * Create a VS Code diagnostic from a diagnostic error
   */
  private createDiagnostic(error: DiagnosticError): vscode.Diagnostic {
    const range = new vscode.Range(
      error.line || 0,
      error.column || 0,
      error.line || 0,
      error.column || 0
    );

    const diagnostic = new vscode.Diagnostic(range, error.message, error.severity);
    diagnostic.source = error.source || 'ViewerKit';
    
    if (error.code) {
      diagnostic.code = error.code;
    }

    return diagnostic;
  }

  /**
   * Generate a diagnostic report for a specific URI
   */
  public generateReport(uri: vscode.Uri): string {
    const stats = this.stats.get(uri.toString());
    
    if (!stats) {
      return `No diagnostic data available for ${uri.fsPath}`;
    }

    const errors = stats.errors || [];
    const errorsByLevel = {
      error: errors.filter(e => e.severity === vscode.DiagnosticSeverity.Error).length,
      warning: errors.filter(e => e.severity === vscode.DiagnosticSeverity.Warning).length,
      info: errors.filter(e => e.severity === vscode.DiagnosticSeverity.Information).length,
      hint: errors.filter(e => e.severity === vscode.DiagnosticSeverity.Hint).length,
    };

    return `
ViewerKit Diagnostic Report for ${uri.fsPath}
================================================

File Statistics:
- Words: ${stats.wordCount || 'N/A'}
- Lines: ${stats.lineCount || 'N/A'}
- Characters: ${stats.characterCount || 'N/A'}
- File Size: ${stats.fileSize ? `${stats.fileSize} bytes` : 'N/A'}
- Last Modified: ${stats.lastModified ? new Date(stats.lastModified).toISOString() : 'N/A'}

Error Summary:
- Errors: ${errorsByLevel.error}
- Warnings: ${errorsByLevel.warning}
- Info: ${errorsByLevel.info}
- Hints: ${errorsByLevel.hint}

Performance:
- Operation Time: ${stats.performance?.operationTime ? `${stats.performance.operationTime}ms` : 'N/A'}
- Memory Usage: ${stats.performance?.memoryUsage ? `${stats.performance.memoryUsage} MB` : 'N/A'}
- Message Count: ${stats.performance?.messageCount || 'N/A'}

Recent Errors:
${errors.slice(-5).map(error => 
  `- [${this.severityToString(error.severity)}] ${error.message} ${error.line ? `(Line ${error.line})` : ''}`
).join('\n') || 'No recent errors'}
    `.trim();
  }

  /**
   * Convert severity enum to string
   */
  private severityToString(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error: return 'ERROR';
      case vscode.DiagnosticSeverity.Warning: return 'WARNING';
      case vscode.DiagnosticSeverity.Information: return 'INFO';
      case vscode.DiagnosticSeverity.Hint: return 'HINT';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
    this.stats.clear();
  }
}

/**
 * Get the global diagnostics manager instance
 */
export function getDiagnosticsManager(): DiagnosticsManager {
  return DiagnosticsManager.getInstance();
}

/**
 * Convenience function to report diagnostics
 * This is the main public API that will be called by hooks and features
 */
export function reportDiagnostics(uri: vscode.Uri, stats: DiagnosticStats): void {
  const manager = getDiagnosticsManager();
  manager.reportDiagnostics(uri, stats);
}

/**
 * Convenience function to add an error
 */
export function reportError(uri: vscode.Uri, message: string, line?: number, column?: number): void {
  const manager = getDiagnosticsManager();
  const error: DiagnosticError = {
    message,
    severity: vscode.DiagnosticSeverity.Error,
    source: 'ViewerKit',
  };

  if (line !== undefined) {
    error.line = line;
  }

  if (column !== undefined) {
    error.column = column;
  }

  manager.addError(uri, error);
}

/**
 * Convenience function to add a warning
 */
export function reportWarning(uri: vscode.Uri, message: string, line?: number, column?: number): void {
  const manager = getDiagnosticsManager();
  const error: DiagnosticError = {
    message,
    severity: vscode.DiagnosticSeverity.Warning,
    source: 'ViewerKit',
  };

  if (line !== undefined) {
    error.line = line;
  }

  if (column !== undefined) {
    error.column = column;
  }

  manager.addError(uri, error);
} 