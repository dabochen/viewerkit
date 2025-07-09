// Theme Sync Public API
// This file exports the public interface for the theme synchronization feature

// Host-side exports (for extension authors)
export { 
  getCurrentTheme as hostGetCurrentTheme,
  refreshTheme as hostRefreshTheme,
  getThemeSyncManager,
  type ThemeInfo,
  type ViewerKitCSSVariables 
} from './host';

// Web-side exports (for webview developers)
export { 
  onThemeChange,
  getCurrentTheme as webGetCurrentTheme,
  getCurrentCSSVariables,
  isDarkTheme,
  useTheme,
  getWebThemeSyncManager,
  type WebThemeInfo,
  type WebViewerKitCSSVariables,
  type ThemeChangeHandler 
} from './web'; 