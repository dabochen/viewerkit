// ViewerKit SDK - Core Backend Functionality Only
// This package contains NO React dependencies

// Core runtime exports
export * from './core/runtime/bridge';
export * from './core/runtime/webviewState';

// Core infrastructure exports
export * from './core/editorRegistry';
export * from './core/debugConsole';
export * from './core/diagnostics';

// Features - All horizontal scaling feature modules
export * as Features from './features';

// Type exports for template packages
export type { WebThemeInfo, WebViewerKitCSSVariables, ThemeChangeHandler } from './features/themeSync';
export type { WebFileChangeEvent, FileChangeHandler } from './features/hotReload';
export type { WebAutosaveResult } from './features/autosave';
export type { Message } from './core/runtime/bridge';

// Following the horizontal scaling pattern: new feature = new export line
// Note: React hooks and UI components are now in @viewerkit/template-simple-react
