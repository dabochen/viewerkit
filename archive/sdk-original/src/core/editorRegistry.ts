import * as vscode from 'vscode';
import { getBridge } from './runtime/bridge';

/**
 * Supported editor types
 */
export type EditorType = 'vscode' | 'cursor' | 'windsurf' | 'kiro' | 'unknown';

/**
 * Webview panel configuration manifest
 */
export interface EditorManifest {
  /** Unique identifier for the webview panel */
  viewType: string;
  /** Display title for the panel */
  title: string;
  /** HTML content for the webview */
  htmlContent: string;
  /** Whether to enable scripts in webview */
  enableScripts?: boolean;
  /** Whether to enable forms in webview */
  enableForms?: boolean;
  /** Whether to retain context when hidden */
  retainContextWhenHidden?: boolean;
  /** Local resource roots for webview */
  localResourceRoots?: vscode.Uri[];
  /** CSP directive for webview security */
  contentSecurityPolicy?: string;
}

/**
 * Editor-specific capabilities and metadata
 */
interface EditorInfo {
  type: EditorType;
  version: string;
  capabilities: {
    webviewPanels: boolean;
    fileSystemWatcher: boolean;
    themeDetection: boolean;
    diagnostics: boolean;
  };
}

/**
 * Editor Registry class that handles universal registration across different editors
 */
export class EditorRegistry {
  private static instance: EditorRegistry | null = null;
  private editorInfo: EditorInfo;
  private registeredPanels = new Map<string, vscode.WebviewPanel>();

  private constructor() {
    this.editorInfo = this.detectEditor();
  }

  /**
   * Get singleton instance of EditorRegistry
   */
  public static getInstance(): EditorRegistry {
    if (!EditorRegistry.instance) {
      EditorRegistry.instance = new EditorRegistry();
    }
    return EditorRegistry.instance;
  }

  /**
   * Register a webview panel with the editor
   */
  public registerWebviewPanel(
    context: vscode.ExtensionContext,
    manifest: EditorManifest
  ): vscode.WebviewPanel {
    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
      manifest.viewType,
      manifest.title,
      vscode.ViewColumn.One,
      {
        enableScripts: manifest.enableScripts ?? true,
        enableForms: manifest.enableForms ?? false,
        retainContextWhenHidden: manifest.retainContextWhenHidden ?? true,
        localResourceRoots: manifest.localResourceRoots ?? [
          vscode.Uri.joinPath(context.extensionUri, 'out'),
          vscode.Uri.joinPath(context.extensionUri, 'webview-ui')
        ],
      }
    );

    // Set HTML content
    panel.webview.html = this.processHtmlContent(manifest.htmlContent, panel.webview, context.extensionUri);

    // Setup bridge communication
    const bridge = getBridge();
    bridge.setWebviewPanel(panel);

    // Handle panel disposal
    panel.onDidDispose(() => {
      this.registeredPanels.delete(manifest.viewType);
    });

    // Track the panel
    this.registeredPanels.set(manifest.viewType, panel);

    return panel;
  }

  /**
   * Get information about the current editor
   */
  public getEditorInfo(): EditorInfo {
    return { ...this.editorInfo };
  }

  /**
   * Check if a specific capability is supported
   */
  public hasCapability(capability: keyof EditorInfo['capabilities']): boolean {
    return this.editorInfo.capabilities[capability];
  }

  /**
   * Get a registered panel by view type
   */
  public getPanel(viewType: string): vscode.WebviewPanel | undefined {
    return this.registeredPanels.get(viewType);
  }

  /**
   * Detect the current editor type and capabilities
   */
  private detectEditor(): EditorInfo {
    const version = vscode.version;
    
    // Check for Cursor-specific features
    if (this.isCursor()) {
      return {
        type: 'cursor',
        version,
        capabilities: {
          webviewPanels: true,
          fileSystemWatcher: true,
          themeDetection: true,
          diagnostics: true,
        },
      };
    }

    // Check for Windsurf-specific features
    if (this.isWindsurf()) {
      return {
        type: 'windsurf',
        version,
        capabilities: {
          webviewPanels: true,
          fileSystemWatcher: true,
          themeDetection: true,
          diagnostics: true,
        },
      };
    }

    // Check for Kiro-specific features
    if (this.isKiro()) {
      return {
        type: 'kiro',
        version,
        capabilities: {
          webviewPanels: true,
          fileSystemWatcher: true,
          themeDetection: true,
          diagnostics: true,
        },
      };
    }

    // Default to VS Code
    if (this.isVSCode()) {
      return {
        type: 'vscode',
        version,
        capabilities: {
          webviewPanels: true,
          fileSystemWatcher: true,
          themeDetection: true,
          diagnostics: true,
        },
      };
    }

    // Unknown editor
    return {
      type: 'unknown',
      version,
      capabilities: {
        webviewPanels: false,
        fileSystemWatcher: false,
        themeDetection: false,
        diagnostics: false,
      },
    };
  }

  /**
   * Check if running in VS Code
   */
  private isVSCode(): boolean {
    try {
      // VS Code has specific environment variables and APIs
      return (
        typeof vscode !== 'undefined' &&
        process.env.VSCODE_PID !== undefined
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if running in Cursor
   */
  private isCursor(): boolean {
    try {
      // Cursor-specific detection
      return (
        process.env.CURSOR === 'true' ||
        process.execPath.includes('cursor') ||
        process.env.VSCODE_CWD?.includes('cursor') ||
        false
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if running in Windsurf
   */
  private isWindsurf(): boolean {
    try {
      // Windsurf-specific detection
      return (
        process.env.WINDSURF === 'true' ||
        process.execPath.includes('windsurf') ||
        process.env.VSCODE_CWD?.includes('windsurf') ||
        false
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if running in Kiro
   */
  private isKiro(): boolean {
    try {
      // Kiro-specific detection
      // Based on research: Kiro is an AWS agentic IDE built on Code OSS
      return (
        process.env.KIRO === 'true' ||
        process.execPath.includes('kiro') ||
        process.env.VSCODE_CWD?.includes('kiro') ||
        process.env.AWS_KIRO === 'true' ||
        // Check for Kiro-specific environment variables
        typeof (globalThis as any).acquireKiroApi !== 'undefined' ||
        // Check application name or identifier
        (typeof vscode !== 'undefined' && (vscode as any).env?.appName?.toLowerCase().includes('kiro')) ||
        false
      );
    } catch {
      return false;
    }
  }

  /**
   * Process HTML content for webview, handling CSP and resource paths
   */
  private processHtmlContent(
    htmlContent: string,
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    // Replace resource paths to use webview.asWebviewUri
    let processedHtml = htmlContent.replace(
      /src="\.\/([^"]+)"/g,
      (_, path) => {
        const resourceUri = vscode.Uri.joinPath(extensionUri, path);
        const webviewUri = webview.asWebviewUri(resourceUri);
        return `src="${webviewUri}"`;
      }
    );

    // Also handle href attributes for CSS and other resources
    processedHtml = processedHtml.replace(
      /href="\.\/([^"]+)"/g,
      (_, path) => {
        const resourceUri = vscode.Uri.joinPath(extensionUri, path);
        const webviewUri = webview.asWebviewUri(resourceUri);
        return `href="${webviewUri}"`;
      }
    );

    // Add default CSP if not present - enhanced for Kiro compatibility
    if (!processedHtml.includes('<meta http-equiv="Content-Security-Policy"')) {
      const editorInfo = this.getEditorInfo();
      
      // Enhanced CSP for better compatibility across editors including Kiro
      const defaultCSP = `
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval';
          style-src ${webview.cspSource} 'unsafe-inline';
          img-src ${webview.cspSource} data: blob:;
          font-src ${webview.cspSource} data:;
          connect-src ${webview.cspSource};
          media-src ${webview.cspSource};
          ${editorInfo.type === 'kiro' ? 'worker-src blob:;' : ''}
        ">
      `.replace(/\s+/g, ' ').trim();
      
      processedHtml = processedHtml.replace(
        '<head>',
        `<head>\n    ${defaultCSP}`
      );
    }

    return processedHtml;
  }

  /**
   * Dispose all registered panels and cleanup
   */
  public dispose(): void {
    this.registeredPanels.forEach(panel => panel.dispose());
    this.registeredPanels.clear();
  }
}

/**
 * Convenience function to register an editor with ViewerKit
 * This is the main public API for extension authors
 */
export function registerEditor(
  context: vscode.ExtensionContext,
  manifest: EditorManifest
): vscode.WebviewPanel {
  const registry = EditorRegistry.getInstance();
  return registry.registerWebviewPanel(context, manifest);
}

/**
 * Get the current editor information
 */
export function getEditorInfo(): EditorInfo {
  const registry = EditorRegistry.getInstance();
  return registry.getEditorInfo();
}

/**
 * Check if a specific capability is supported in the current editor
 */
export function hasEditorCapability(capability: keyof EditorInfo['capabilities']): boolean {
  const registry = EditorRegistry.getInstance();
  return registry.hasCapability(capability);
} 