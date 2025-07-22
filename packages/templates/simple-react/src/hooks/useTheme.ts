import { useState, useEffect, useCallback, useRef } from 'react';
import { Features, getDebugConsole } from '@viewerkit/sdk';
import type { WebThemeInfo, WebViewerKitCSSVariables } from '@viewerkit/sdk';

const {
  onThemeChange,
  webGetCurrentTheme: getCurrentTheme,
  getCurrentCSSVariables,
  getWebThemeSyncManager
} = Features.ThemeSync;

/**
 * Options for useTheme hook
 */
export interface UseThemeOptions {
  /** Whether to automatically apply CSS variables to DOM (default: true) */
  autoApply?: boolean;
  /** Whether to apply theme classes to body element (default: true) */
  applyBodyClasses?: boolean;
  /** Custom CSS selector for theme variables (default: ':root') */
  cssTarget?: string;
  /** Called when theme changes */
  onThemeChange?: (theme: WebThemeInfo, variables: WebViewerKitCSSVariables) => void;
  /** Whether to request initial theme on mount (default: true) */
  loadOnMount?: boolean;
}

/**
 * Return type for useTheme hook
 */
export interface UseThemeResult {
  /** Current theme information */
  theme: WebThemeInfo | null;
  /** Current CSS variables */
  cssVariables: WebViewerKitCSSVariables | null;
  /** Whether current theme is dark */
  isDark: boolean;
  /** Whether current theme is light */
  isLight: boolean;
  /** Whether current theme is high contrast */
  isHighContrast: boolean;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh theme from VS Code */
  refresh: () => Promise<void>;
  /** Generate CSS string for current variables */
  generateCSS: () => string;
  /** Apply custom CSS variables temporarily */
  applyCustomVariables: (variables: Partial<WebViewerKitCSSVariables>) => void;
  /** Reset to original theme variables */
  resetVariables: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * React hook for VS Code theme synchronization
 * 
 * This hook provides automatic theme synchronization with VS Code, including CSS variable
 * injection and theme change detection. It integrates with ViewerKit's theme sync system
 * to ensure the webview UI automatically adapts to VS Code's current theme.
 * 
 * @param options - Configuration options
 * @returns Hook result with theme information and controls
 * 
 * @example
 * ```tsx
 * function ThemedComponent() {
 *   const { 
 *     theme, 
 *     cssVariables, 
 *     isDark, 
 *     loading,
 *     refresh 
 *   } = useTheme({
 *     onThemeChange: (theme) => console.log('Theme changed:', theme.name)
 *   });
 * 
 *   if (loading) return <div>Loading theme...</div>;
 * 
 *   return (
 *     <div style={{ 
 *       backgroundColor: cssVariables?.['--vk-bg-primary'],
 *       color: cssVariables?.['--vk-text-primary'] 
 *     }}>
 *       <h1>Current theme: {theme?.name}</h1>
 *       <p>Theme type: {isDark ? 'Dark' : 'Light'}</p>
 *       <button onClick={refresh}>Refresh Theme</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeResult {
  const {
    autoApply = true,
    applyBodyClasses = true,
    cssTarget = ':root',
    onThemeChange: onThemeChangeCallback,
    loadOnMount = true,
  } = options;

  // State management
  const [theme, setTheme] = useState<WebThemeInfo | null>(null);
  const [cssVariables, setCssVariables] = useState<WebViewerKitCSSVariables | null>(null);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing side effects
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const originalVariablesRef = useRef<WebViewerKitCSSVariables | null>(null);

  /**
   * Apply CSS variables to DOM
   */
  const applyCSSVariables = useCallback((variables: WebViewerKitCSSVariables): void => {
    if (!autoApply) return;

    try {
      const targetElement = cssTarget === ':root' ? document.documentElement : document.querySelector(cssTarget);
      
      if (!targetElement) {
        getDebugConsole().logError(new Error(`CSS target not found: ${cssTarget}`));
        return;
      }

      // Apply CSS variables
      Object.entries(variables).forEach(([key, value]) => {
        (targetElement as HTMLElement).style.setProperty(key, value);
      });

      getDebugConsole().logError(`CSS variables applied to ${cssTarget}`);
    } catch (cssError) {
      const errorMessage = cssError instanceof Error ? cssError.message : String(cssError);
      getDebugConsole().logError(new Error(`Failed to apply CSS variables: ${errorMessage}`));
    }
  }, [autoApply, cssTarget]);

  /**
   * Apply theme classes to body
   */
  const applyThemeClasses = useCallback((themeInfo: WebThemeInfo): void => {
    if (!applyBodyClasses) return;

    try {
      // Remove existing theme classes
      document.body.classList.remove('vk-theme-light', 'vk-theme-dark', 'vk-theme-hc', 'vk-theme-hc-light');

      // Add new theme class
      const themeClass = `vk-theme-${themeInfo.kind === 'high-contrast' ? 'hc' : 
                                     themeInfo.kind === 'high-contrast-light' ? 'hc-light' : 
                                     themeInfo.kind}`;
      document.body.classList.add(themeClass);

      getDebugConsole().logError(`Theme class applied: ${themeClass}`);
    } catch (classError) {
      const errorMessage = classError instanceof Error ? classError.message : String(classError);
      getDebugConsole().logError(new Error(`Failed to apply theme classes: ${errorMessage}`));
    }
  }, [applyBodyClasses]);

  /**
   * Handle theme change events
   */
  const handleThemeChange = useCallback((newTheme: WebThemeInfo, newVariables: WebViewerKitCSSVariables): void => {
    try {
      setTheme(newTheme);
      setCssVariables(newVariables);
      setError(null);

      // Store original variables if this is the first time
      if (!originalVariablesRef.current) {
        originalVariablesRef.current = { ...newVariables };
      }

      // Apply CSS variables and classes
      applyCSSVariables(newVariables);
      applyThemeClasses(newTheme);

      // Call user callback
      onThemeChangeCallback?.(newTheme, newVariables);

      getDebugConsole().logError(`Theme updated: ${newTheme.name} (${newTheme.kind})`);
    } catch (handleError) {
      const errorMessage = handleError instanceof Error ? handleError.message : String(handleError);
      setError(`Theme update failed: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Theme change handling failed: ${errorMessage}`));
    }
  }, [applyCSSVariables, applyThemeClasses, onThemeChangeCallback]);

  /**
   * Load current theme information
   */
  const loadTheme = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const currentTheme = getCurrentTheme();
      const currentVariables = getCurrentCSSVariables();

      if (currentTheme && currentVariables) {
        handleThemeChange(currentTheme, currentVariables);
      } else {
        // Request theme refresh from host
        const manager = getWebThemeSyncManager();
        await manager.requestThemeRefresh();
      }
    } catch (loadError) {
      const errorMessage = loadError instanceof Error ? loadError.message : String(loadError);
      setError(`Failed to load theme: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Theme loading failed: ${errorMessage}`));
    } finally {
      setLoading(false);
    }
  }, [handleThemeChange]);

  /**
   * Refresh theme from VS Code
   */
  const refresh = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const manager = getWebThemeSyncManager();
      await manager.requestThemeRefresh();
      getDebugConsole().logError('Theme refresh requested');
    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError);
      setError(`Theme refresh failed: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Theme refresh failed: ${errorMessage}`));
    }
  }, []);

  /**
   * Generate CSS string for current variables
   */
  const generateCSS = useCallback((): string => {
    if (!cssVariables) return '';

    const cssRules = Object.entries(cssVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    return `:root {\n${cssRules}\n}`;
  }, [cssVariables]);

  /**
   * Apply custom CSS variables temporarily
   */
  const applyCustomVariables = useCallback((customVariables: Partial<WebViewerKitCSSVariables>): void => {
    if (!cssVariables) {
      setError('No theme available for custom variables');
      return;
    }

    try {
      const mergedVariables = { ...cssVariables, ...customVariables };
      setCssVariables(mergedVariables);
      applyCSSVariables(mergedVariables);
      getDebugConsole().logError('Custom CSS variables applied');
    } catch (customError) {
      const errorMessage = customError instanceof Error ? customError.message : String(customError);
      setError(`Failed to apply custom variables: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Custom variables failed: ${errorMessage}`));
    }
  }, [cssVariables, applyCSSVariables]);

  /**
   * Reset to original theme variables
   */
  const resetVariables = useCallback((): void => {
    if (!originalVariablesRef.current) {
      setError('No original variables to reset to');
      return;
    }

    try {
      setCssVariables(originalVariablesRef.current);
      applyCSSVariables(originalVariablesRef.current);
      setError(null);
      getDebugConsole().logError('Theme variables reset to original');
    } catch (resetError) {
      const errorMessage = resetError instanceof Error ? resetError.message : String(resetError);
      setError(`Failed to reset variables: ${errorMessage}`);
      getDebugConsole().logError(new Error(`Variable reset failed: ${errorMessage}`));
    }
  }, [applyCSSVariables]);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Derived state
  const isDark = theme?.kind === 'dark' || theme?.kind === 'high-contrast';
  const isLight = theme?.kind === 'light' || theme?.kind === 'high-contrast-light';
  const isHighContrast = theme?.kind === 'high-contrast' || theme?.kind === 'high-contrast-light';

  // Effect: Setup theme change listener
  useEffect(() => {
    const unsubscribe = onThemeChange(handleThemeChange);
    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [handleThemeChange]);

  // Effect: Initial theme load
  useEffect(() => {
    if (loadOnMount) {
      loadTheme();
    }
  }, [loadOnMount, loadTheme]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    theme,
    cssVariables,
    isDark,
    isLight,
    isHighContrast,
    loading,
    error,
    refresh,
    generateCSS,
    applyCustomVariables,
    resetVariables,
    clearError,
  };
}

/**
 * Convenience hook for simple theme detection
 * 
 * A lightweight version of useTheme that only provides theme type detection
 * without CSS variable management or DOM manipulation.
 * 
 * @example
 * ```tsx
 * function SimpleThemedComponent() {
 *   const { isDark, isLight, themeName } = useSimpleTheme();
 *   
 *   return (
 *     <div className={isDark ? 'dark-theme' : 'light-theme'}>
 *       Current theme: {themeName}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSimpleTheme(): {
  isDark: boolean;
  isLight: boolean;
  isHighContrast: boolean;
  themeName: string | null;
  refresh: () => Promise<void>;
} {
  const { theme, isDark, isLight, isHighContrast, refresh } = useTheme({
    autoApply: false,
    applyBodyClasses: false,
    loadOnMount: true,
  });

  return {
    isDark,
    isLight,
    isHighContrast,
    themeName: theme?.name || null,
    refresh,
  };
} 