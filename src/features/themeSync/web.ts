import { getBridge } from '../../core/runtime/bridge';
import { getDebugConsole } from '../../core/debugConsole';

/**
 * Simplified theme info for webview (without vscode types)
 */
export interface WebThemeInfo {
  kind: 'light' | 'dark' | 'high-contrast' | 'high-contrast-light';
  name: string;
  colors: Record<string, string>;
  uiColors: Record<string, string>;
  timestamp: number;
}

/**
 * CSS variables for ViewerKit theming
 */
export interface WebViewerKitCSSVariables {
  '--vk-bg-primary': string;
  '--vk-bg-secondary': string;
  '--vk-bg-tertiary': string;
  '--vk-text-primary': string;
  '--vk-text-secondary': string;
  '--vk-text-muted': string;
  '--vk-border-primary': string;
  '--vk-border-secondary': string;
  '--vk-accent-primary': string;
  '--vk-accent-secondary': string;
  '--vk-success': string;
  '--vk-warning': string;
  '--vk-error': string;
  '--vk-info': string;
  '--vk-hover': string;
  '--vk-active': string;
  '--vk-focus': string;
  '--vk-disabled': string;
}

/**
 * Theme change event handler
 */
export type ThemeChangeHandler = (theme: WebThemeInfo, cssVariables: WebViewerKitCSSVariables) => void;

/**
 * Theme synchronization manager for webview
 * Handles incoming theme updates and applies CSS variables
 */
export class WebThemeSyncManager {
  private static instance: WebThemeSyncManager | null = null;
  private handlers = new Set<ThemeChangeHandler>();
  private currentTheme: WebThemeInfo | null = null;
  private currentCSSVariables: WebViewerKitCSSVariables | null = null;
  private isInitialized = false;
  private styleElement: HTMLStyleElement | null = null;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WebThemeSyncManager {
    if (!WebThemeSyncManager.instance) {
      WebThemeSyncManager.instance = new WebThemeSyncManager();
    }
    return WebThemeSyncManager.instance;
  }

  /**
   * Initialize theme synchronization
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Create style element for CSS variables
    this.createStyleElement();

    // Listen for theme change messages
    const bridge = getBridge();
    bridge.onMessage('theme-changed', (message) => {
      this.handleThemeUpdate(message.payload as { themeInfo: any; cssVariables: WebViewerKitCSSVariables });
    });

    // Apply default theme classes to body
    this.applyThemeClasses();

    this.isInitialized = true;
    getDebugConsole().logError('Web theme sync manager initialized');
  }

  /**
   * Create style element for CSS variables
   */
  private createStyleElement(): void {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'viewerkit-theme-variables';
    document.head.appendChild(this.styleElement);
  }

  /**
   * Handle theme update from host
   */
  private handleThemeUpdate(payload: { themeInfo: any; cssVariables: WebViewerKitCSSVariables }): void {
    try {
      const { themeInfo, cssVariables } = payload;

      // Convert VS Code theme kind to web-friendly format
      const webThemeInfo: WebThemeInfo = {
        kind: this.convertThemeKind(themeInfo.kind),
        name: themeInfo.name,
        colors: themeInfo.colors,
        uiColors: themeInfo.uiColors,
        timestamp: themeInfo.timestamp,
      };

      this.currentTheme = webThemeInfo;
      this.currentCSSVariables = cssVariables;

      // Apply CSS variables to DOM
      this.applyCSSVariables(cssVariables);

      // Apply theme classes
      this.applyThemeClasses(webThemeInfo.kind);

      // Notify handlers
      this.notifyHandlers(webThemeInfo, cssVariables);

      getDebugConsole().logError(`Theme applied: ${webThemeInfo.kind} - ${webThemeInfo.name}`);
    } catch (error) {
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'handleThemeUpdate'
      );
    }
  }

  /**
   * Convert VS Code theme kind to web format
   */
  private convertThemeKind(kind: number): 'light' | 'dark' | 'high-contrast' | 'high-contrast-light' {
    // VS Code ColorThemeKind values: Light = 1, Dark = 2, HighContrast = 3, HighContrastLight = 4
    switch (kind) {
      case 1: return 'light';
      case 2: return 'dark';
      case 3: return 'high-contrast';
      case 4: return 'high-contrast-light';
      default: return 'dark';
    }
  }

  /**
   * Apply CSS variables to DOM
   */
  private applyCSSVariables(variables: WebViewerKitCSSVariables): void {
    if (!this.styleElement) {
      this.createStyleElement();
    }

    const cssRules = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    const cssContent = `:root {\n${cssRules}\n}`;
    this.styleElement!.textContent = cssContent;
  }

  /**
   * Apply theme classes to body element
   */
  private applyThemeClasses(kind?: string): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('vk-theme-light', 'vk-theme-dark', 'vk-theme-high-contrast', 'vk-theme-high-contrast-light');
    
    // Add current theme class
    const themeKind = kind || this.currentTheme?.kind || 'dark';
    body.classList.add(`vk-theme-${themeKind}`);
  }

  /**
   * Add theme change handler
   */
  public onThemeChange(handler: ThemeChangeHandler): () => void {
    this.handlers.add(handler);

    // Immediately call with current theme if available
    if (this.currentTheme && this.currentCSSVariables) {
      try {
        handler(this.currentTheme, this.currentCSSVariables);
      } catch (error) {
        getDebugConsole().logError(
          error instanceof Error ? error : new Error(String(error)),
          'themeChangeHandler'
        );
      }
    }

    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Remove theme change handler
   */
  public removeThemeHandler(handler: ThemeChangeHandler): void {
    this.handlers.delete(handler);
  }

  /**
   * Notify all handlers of theme change
   */
  private notifyHandlers(theme: WebThemeInfo, cssVariables: WebViewerKitCSSVariables): void {
    this.handlers.forEach(handler => {
      try {
        handler(theme, cssVariables);
      } catch (error) {
        getDebugConsole().logError(
          error instanceof Error ? error : new Error(String(error)),
          'themeChangeHandler'
        );
      }
    });
  }

  /**
   * Get current theme information
   */
  public getCurrentTheme(): WebThemeInfo | null {
    return this.currentTheme;
  }

  /**
   * Get current CSS variables
   */
  public getCurrentCSSVariables(): WebViewerKitCSSVariables | null {
    return this.currentCSSVariables;
  }

  /**
   * Request theme refresh from host
   */
  public async requestThemeRefresh(): Promise<void> {
    try {
      const bridge = getBridge();
      await bridge.sendRequest('refresh-theme', {});
      getDebugConsole().logError('Theme refresh requested');
    } catch (error) {
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'requestThemeRefresh'
      );
    }
  }

  /**
   * Manually apply custom CSS variables
   */
  public applyCustomVariables(variables: Partial<WebViewerKitCSSVariables>): void {
    if (!this.currentCSSVariables) {
      getDebugConsole().logError(new Error('No current theme available for custom variables'));
      return;
    }

    const mergedVariables = { ...this.currentCSSVariables, ...variables };
    this.applyCSSVariables(mergedVariables);
    this.currentCSSVariables = mergedVariables;
  }

  /**
   * Reset to original theme variables
   */
  public resetVariables(): void {
    if (this.currentTheme && this.currentCSSVariables) {
      // Request fresh theme from host
      this.requestThemeRefresh();
    }
  }

  /**
   * Generate CSS string for current variables
   */
  public generateCSSString(): string {
    if (!this.currentCSSVariables) {
      return '';
    }

    const cssRules = Object.entries(this.currentCSSVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    return `:root {\n${cssRules}\n}`;
  }

  /**
   * Check if current theme is dark
   */
  public isDarkTheme(): boolean {
    return this.currentTheme?.kind === 'dark' || this.currentTheme?.kind === 'high-contrast';
  }

  /**
   * Check if current theme is light
   */
  public isLightTheme(): boolean {
    return this.currentTheme?.kind === 'light' || this.currentTheme?.kind === 'high-contrast-light';
  }

  /**
   * Clear all handlers and reset
   */
  public clearAllHandlers(): void {
    this.handlers.clear();
    getDebugConsole().logError('All theme handlers cleared');
  }
}

/**
 * Get the global web theme sync manager
 */
export function getWebThemeSyncManager(): WebThemeSyncManager {
  return WebThemeSyncManager.getInstance();
}

/**
 * Convenience function to register theme change handler
 */
export function onThemeChange(handler: ThemeChangeHandler): () => void {
  const manager = getWebThemeSyncManager();
  return manager.onThemeChange(handler);
}

/**
 * Get current theme information
 */
export function getCurrentTheme(): WebThemeInfo | null {
  const manager = getWebThemeSyncManager();
  return manager.getCurrentTheme();
}

/**
 * Get current CSS variables
 */
export function getCurrentCSSVariables(): WebViewerKitCSSVariables | null {
  const manager = getWebThemeSyncManager();
  return manager.getCurrentCSSVariables();
}

/**
 * Check if current theme is dark
 */
export function isDarkTheme(): boolean {
  const manager = getWebThemeSyncManager();
  return manager.isDarkTheme();
}

/**
 * React hook for theme synchronization
 */
export function useTheme(): {
  theme: WebThemeInfo | null;
  cssVariables: WebViewerKitCSSVariables | null;
  isDark: boolean;
  isLight: boolean;
  refresh: () => Promise<void>;
} {
  const manager = getWebThemeSyncManager();
  
  return {
    theme: manager.getCurrentTheme(),
    cssVariables: manager.getCurrentCSSVariables(),
    isDark: manager.isDarkTheme(),
    isLight: manager.isLightTheme(),
    refresh: () => manager.requestThemeRefresh(),
  };
} 