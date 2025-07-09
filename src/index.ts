// ViewerKit SDK - Single Public Entry Point
// This file must contain ONLY export statements, no logic

// Core runtime exports
export * from './core/runtime/bridge';
export * from './core/runtime/webviewState';

// Core infrastructure exports
export * from './core/editorRegistry';
export * from './core/debugConsole';
export * from './core/diagnostics';

// Features - All horizontal scaling feature modules
export * as Features from './features';

// React Hooks - React-friendly wrappers for all functionality
export * as Hooks from './hooks';

// UI Components - Pre-built React components with theme integration
export * as UI from './ui';

// Following the horizontal scaling pattern: new feature = new export line