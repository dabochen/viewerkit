// ViewerKit Simple React Template - Universal React Frontend
// This template provides React components and hooks built on top of @viewerkit/sdk

// React Hooks - React-friendly wrappers for SDK functionality
export * as Hooks from './hooks';

// UI Components - Pre-built React components with theme integration
export * as UI from './ui';

// Re-export commonly used hooks for convenience
export { useAutosave } from './hooks/useAutosave';
export { useBridge } from './hooks/useBridge';
export { useTheme } from './hooks/useTheme';
export { useWatchedFile } from './hooks/useWatchedFile';

// Re-export commonly used UI components for convenience
export { BasePanel } from './ui/BasePanel';
export { Button } from './ui/Button';
export { Toolbar } from './ui/Toolbar';
