// ViewerKit SDK - Backward Compatibility Layer
// This file maintains backward compatibility during monorepo migration

// NEW MONOREPO EXPORTS (recommended)
// Re-export from new packages for modern usage
// TODO: Uncomment after packages are built
// export * from '@viewerkit/sdk';
// export * from '@viewerkit/template-simple-react';

// LEGACY EXPORTS (deprecated but maintained for backward compatibility)
// These will be removed in a future major version

// Core runtime exports - now from SDK package
export * from '../packages/sdk/src/core/runtime/bridge';
export * from '../packages/sdk/src/core/runtime/webviewState';

// Core infrastructure exports - now from SDK package
export * from '../packages/sdk/src/core/editorRegistry';
export * from '../packages/sdk/src/core/debugConsole';
export * from '../packages/sdk/src/core/diagnostics';

// Features - now from SDK package
export * as Features from '../packages/sdk/src/features';

// React Hooks - now from template package
export * as Hooks from '../packages/templates/simple-react/src/hooks';

// UI Components - now from template package
export * as UI from '../packages/templates/simple-react/src/ui';

// Following the horizontal scaling pattern: new feature = new export line