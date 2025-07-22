import * as vscode from 'vscode';
import { getBridge } from '../../core/runtime/bridge';
import { getDebugConsole } from '../../core/debugConsole';

/**
 * VS Code theme information
 */
export interface ThemeInfo {
  kind: vscode.ColorThemeKind;
  name: string;
  colors: Record<string, string>;
  semanticTokenColors?: Record<string, any>;
  uiColors: Record<string, string>;
  timestamp: number;
}

/**
 * CSS variable mapping for ViewerKit
 */
export interface ViewerKitCSSVariables {
  // Background colors
  '--vk-bg-primary': string;
  '--vk-bg-secondary': string;
  '--vk-bg-tertiary': string;
  
  // Text colors
  '--vk-text-primary': string;
  '--vk-text-secondary': string;
  '--vk-text-muted': string;
  
  // Border colors
  '--vk-border-primary': string;
  '--vk-border-secondary': string;
  
  // Accent colors
  '--vk-accent-primary': string;
  '--vk-accent-secondary': string;
  
  // Status colors
  '--vk-success': string;
  '--vk-warning': string;
  '--vk-error': string;
  '--vk-info': string;
  
  // Interactive colors
  '--vk-hover': string;
  '--vk-active': string;
  '--vk-focus': string;
  '--vk-disabled': string;
}

/**
 * Theme synchronization manager
 * Watches for VS Code theme changes and synchronizes with webviews
 */
export class ThemeSyncManager {
  private static instance: ThemeSyncManager | null = null;
  private disposables: vscode.Disposable[] = [];
  private currentTheme: ThemeInfo | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ThemeSyncManager {
    if (!ThemeSyncManager.instance) {
      ThemeSyncManager.instance = new ThemeSyncManager();
    }
    return ThemeSyncManager.instance;
  }

  /**
   * Initialize theme synchronization
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Listen for theme changes
    const themeChangeDisposable = vscode.window.onDidChangeActiveColorTheme((theme) => {
      this.handleThemeChange(theme);
    });

    this.disposables.push(themeChangeDisposable);

    // Get initial theme
    this.handleThemeChange(vscode.window.activeColorTheme);

    this.isInitialized = true;
    getDebugConsole().logError('Theme sync manager initialized');
  }

  /**
   * Handle theme change events
   */
  private async handleThemeChange(theme: vscode.ColorTheme): Promise<void> {
    try {
      const themeInfo = await this.extractThemeInfo(theme);
      this.currentTheme = themeInfo;

      // Generate CSS variables
      const cssVariables = this.generateCSSVariables(themeInfo);

      // Send theme update to webviews
      const bridge = getBridge();
      await bridge.sendMessage({
        type: 'theme-changed',
        payload: {
          themeInfo,
          cssVariables,
        },
      });

      getDebugConsole().logError(`Theme changed: ${theme.kind} - ${themeInfo.name}`);
    } catch (error) {
      getDebugConsole().logError(
        error instanceof Error ? error : new Error(String(error)),
        'handleThemeChange'
      );
    }
  }

  /**
   * Extract comprehensive theme information
   */
  private async extractThemeInfo(theme: vscode.ColorTheme): Promise<ThemeInfo> {
    // Get color customizations from settings
    const config = vscode.workspace.getConfiguration('workbench');
    const colorCustomizations = config.get<Record<string, string>>('colorCustomizations') || {};

    // Common VS Code color tokens we want to track
    const importantColors = [
      'editor.background',
      'editor.foreground',
      'sideBar.background',
      'sideBar.foreground',
      'activityBar.background',
      'activityBar.foreground',
      'statusBar.background',
      'statusBar.foreground',
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      'panel.background',
      'panel.border',
      'button.background',
      'button.foreground',
      'input.background',
      'input.foreground',
      'input.border',
      'dropdown.background',
      'dropdown.foreground',
      'dropdown.border',
      'list.hoverBackground',
      'list.activeSelectionBackground',
      'focusBorder',
      'textLink.foreground',
      'textLink.activeForeground',
      'errorForeground',
      'warningForeground',
      'successForeground',
      'infoForeground',
    ];

    // Extract available colors
    const colors: Record<string, string> = {};
    const uiColors: Record<string, string> = {};

    // Try to get colors from various sources
    for (const colorKey of importantColors) {
      try {
        // Try configuration first
        if (colorCustomizations[colorKey]) {
          colors[colorKey] = colorCustomizations[colorKey];
          uiColors[colorKey] = colorCustomizations[colorKey];
        }
      } catch {
        // Color not available
      }
    }

    return {
      kind: theme.kind,
      name: 'Unknown Theme', // theme.label doesn't exist on ColorTheme
      colors,
      uiColors,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate ViewerKit CSS variables from theme
   */
  private generateCSSVariables(themeInfo: ThemeInfo): ViewerKitCSSVariables {
    const { colors, kind } = themeInfo;
    
    // Default fallback colors based on theme kind
    const isDark = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
    
    const defaults = isDark ? {
      primaryBg: '#1e1e1e',
      secondaryBg: '#252526',
      tertiaryBg: '#2d2d30',
      primaryText: '#cccccc',
      secondaryText: '#969696',
      mutedText: '#6c6c6c',
      primaryBorder: '#3c3c3c',
      secondaryBorder: '#2d2d30',
      accent: '#007acc',
      accentSecondary: '#0e639c',
      success: '#89d185',
      warning: '#ffcc02',
      error: '#f14c4c',
      info: '#75beff',
      hover: '#3c3c3c',
      active: '#094771',
      focus: '#007fd4',
      disabled: '#6c6c6c',
    } : {
      primaryBg: '#ffffff',
      secondaryBg: '#f3f3f3',
      tertiaryBg: '#e8e8e8',
      primaryText: '#333333',
      secondaryText: '#666666',
      mutedText: '#999999',
      primaryBorder: '#d4d4d4',
      secondaryBorder: '#e8e8e8',
      accent: '#0078d4',
      accentSecondary: '#106ebe',
      success: '#107c10',
      warning: '#ffcc02',
      error: '#d13438',
      info: '#0078d4',
      hover: '#f0f0f0',
      active: '#cde6f7',
      focus: '#0078d4',
      disabled: '#999999',
    };

    // Map VS Code colors to ViewerKit variables
    const cssVariables: ViewerKitCSSVariables = {
      '--vk-bg-primary': colors['editor.background'] || defaults.primaryBg,
      '--vk-bg-secondary': colors['sideBar.background'] || defaults.secondaryBg,
      '--vk-bg-tertiary': colors['panel.background'] || defaults.tertiaryBg,
      
      '--vk-text-primary': colors['editor.foreground'] || defaults.primaryText,
      '--vk-text-secondary': colors['sideBar.foreground'] || defaults.secondaryText,
      '--vk-text-muted': colors['descriptionForeground'] || defaults.mutedText,
      
      '--vk-border-primary': colors['panel.border'] || colors['focusBorder'] || defaults.primaryBorder,
      '--vk-border-secondary': colors['input.border'] || defaults.secondaryBorder,
      
      '--vk-accent-primary': colors['textLink.foreground'] || colors['button.background'] || defaults.accent,
      '--vk-accent-secondary': colors['textLink.activeForeground'] || defaults.accentSecondary,
      
      '--vk-success': colors['successForeground'] || defaults.success,
      '--vk-warning': colors['warningForeground'] || defaults.warning,
      '--vk-error': colors['errorForeground'] || defaults.error,
      '--vk-info': colors['infoForeground'] || defaults.info,
      
      '--vk-hover': colors['list.hoverBackground'] || defaults.hover,
      '--vk-active': colors['list.activeSelectionBackground'] || defaults.active,
      '--vk-focus': colors['focusBorder'] || defaults.focus,
      '--vk-disabled': defaults.disabled,
    };

    return cssVariables;
  }

  /**
   * Get current theme information
   */
  public getCurrentTheme(): ThemeInfo | null {
    return this.currentTheme;
  }

  /**
   * Force theme refresh
   */
  public async refreshTheme(): Promise<void> {
    if (vscode.window.activeColorTheme) {
      await this.handleThemeChange(vscode.window.activeColorTheme);
    }
  }

  /**
   * Generate CSS string from variables
   */
  public generateCSSString(variables?: ViewerKitCSSVariables): string {
    const cssVars = variables || (this.currentTheme ? this.generateCSSVariables(this.currentTheme) : null);
    
    if (!cssVars) {
      return '';
    }

    const cssRules = Object.entries(cssVars)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    return `:root {\n${cssRules}\n}`;
  }

  /**
   * Dispose the theme sync manager
   */
  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    this.isInitialized = false;
    getDebugConsole().logError('Theme sync manager disposed');
  }
}

/**
 * Global theme sync manager instance
 */
let globalManager: ThemeSyncManager | null = null;

/**
 * Get or create the global theme sync manager
 */
export function getThemeSyncManager(): ThemeSyncManager {
  if (!globalManager) {
    globalManager = ThemeSyncManager.getInstance();
  }
  return globalManager;
}

/**
 * Get current theme information
 */
export function getCurrentTheme(): ThemeInfo | null {
  const manager = getThemeSyncManager();
  return manager.getCurrentTheme();
}

/**
 * Force theme refresh
 */
export function refreshTheme(): Promise<void> {
  const manager = getThemeSyncManager();
  return manager.refreshTheme();
} 