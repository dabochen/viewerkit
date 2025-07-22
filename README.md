# ViewerKit Monorepo

ViewerKit is a robust SDK and template system crafted to enable developers to build extensions for VS Code, Cursor, Windsurf, Trae, Kiro and other VS Code-based editors, transforming AI IDEs into versatile AI agents beyond coding. By providing a unified API and React templates, it allows developers to seamlessly integrate custom viewing and editing experiences into their extensions without dealing with complex backend tasks, enabling them to focus on frontend or user facing features.

## 📁 Monorepo Structure

This monorepo contains multiple packages:

- **`@viewerkit/sdk`** (`packages/sdk/`) - Core backend functionality, framework-agnostic
- **`@viewerkit/template-simple-react`** (`packages/templates/simple-react-extension/`) - Official VS Code extension template with React webview
- **Extensions** (`extensions/`) - Custom extensions for development and testing ViewerKit usage
- **`viewerkit`** (root) - Legacy compatibility layer for gradual migration

## 🚀 Features

### SDK Package (`@viewerkit/sdk`)
- **Universal File Operations**: Cross-platform file API that works in VS Code, Cursor, Windsurf, Trae, Kiro (AWS), and other Code OSS-based editors
- **Hot Reload**: Automatic file watching with 100ms debounce and conflict resolution
- **Smart Autosave**: Intelligent autosave designed to work with hot reload
- **Theme Integration**: Seamless VS Code theme synchronization using CSS variables
- **TypeScript First**: Full type safety with comprehensive .d.ts files
- **Framework Agnostic**: No React dependencies in core SDK

### Template Package (`@viewerkit/template-simple-react`)
- **React Hooks**: Pre-built hooks for file watching, autosave, and state management
- **UI Components**: Theme-aware React components
- **Universal Viewer**: Configurable viewer implementation for different file types
- **SDK Integration**: Built on top of the core SDK

## 📦 Installation

### For New Projects (Recommended)

```bash
# Install SDK for core functionality
npm install @viewerkit/sdk

# Install React template for frontend
npm install @viewerkit/template-simple-react
```

### Legacy Compatibility

```bash
# Still works for existing projects
npm install viewerkit
```

**Requirements:**
- Node.js ≥18
- VS Code ≥1.85.0 (includes Cursor, Windsurf, Trae and Kiro)
- React ≥18 (for template package)

## 🎯 Quick Start

### Using SDK Package (Backend/Core)

```typescript
import { Features } from '@viewerkit/sdk';

// Read a file with metadata
const result = await Features.fileOps.readFile('path/to/file.txt');
if (result.success) {
  console.log(result.content);
  console.log(`Lines: ${result.metadata.lines}, Words: ${result.metadata.words}`);
}

// Write a file with metadata
const result = await Features.fileOps.writeFile('output.txt', 'Hello ViewerKit!');
console.log(`Wrote ${result.data} bytes`);
```

### Using Template Package (React Frontend)

```tsx
import { useWatchedFile, useAutosave, useTheme, BasePanel } from '@viewerkit/template-simple-react';

function MyEditor() {
  // Watch a file for changes (includes content, error state, and auto-reload)
  const fileData = useWatchedFile('/path/to/config.json');
  
  // Auto-save with 400ms debounce and conflict resolution
  const saveFunction = useAutosave('/path/to/draft.md', 400);
  
  // Get current VS Code theme with CSS variables
  const { theme, cssVariables, isDark } = useTheme();
  
  return (
    <BasePanel title="My Editor" subtitle="Edit your configuration">
      <p>File: {fileData.data || 'Loading...'}</p>
      <p>Theme: {isDark ? 'Dark' : 'Light'}</p>
      
      <textarea 
        value={fileData.data || ''}
        onChange={(e) => saveFunction(e.target.value)}
        style={{ 
          backgroundColor: cssVariables?.['--vk-bg-primary'],
          color: cssVariables?.['--vk-text-primary']
        }}
      />
      
      <UI.Button 
        variant="primary" 
        icon="save"
        onClick={() => saveFunction(fileData.data || '')}
      >
        Force Save
      </UI.Button>
    </UI.BasePanel>
  );
}
```

### Extension Development

```typescript
import { registerEditor, Features } from 'viewerkit';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Register a webview panel with ViewerKit
  const panel = registerEditor(context, {
    viewType: 'myExtension.editor',
    title: 'My Custom Editor',
    htmlContent: `<!DOCTYPE html>...`,
    enableScripts: true,
    retainContextWhenHidden: true
  });

  // Use features directly
  Features.watchFile('/path/to/watch', { debounceMs: 100 });
  Features.hostAutosave('/path/to/file.txt', 'content');
}
```

## 🏗️ Architecture

ViewerKit follows a clean architectural pattern:

- **Core**: Stable foundation (runtime, bridge, registry)
- **Features**: Backend services (autosave, hotReload, fileOps)
- **Hooks**: React wrappers for all functionality
- **UI**: Pre-built React components with our templates

## 📚 API Reference

### Core Exports

- `Features.*` - All backend functionality
- `Hooks.*` - React hooks for state management
- `UI.*` - Pre-built React components
- Bridge and runtime utilities

### Key Features

| Feature | Description | React Hook | Default Settings |
|---------|-------------|------------|------------------|
| **File Operations** | Universal file I/O with metadata | `useFileOperations` | Format-agnostic |
| **Hot Reload** | File watching with loop prevention | `useWatchedFile` | 100ms debounce |
| **Autosave** | Smart saving with backup creation | `useAutosave` | 400ms debounce |
| **Theme Sync** | Live CSS variable injection | `useTheme` | Auto CSS variables |
| **Bridge System** | Host-webview communication | `useBridge` | Promise-based |
| **State Persistence** | Cross-session state management | Built into `BasePanel` | Auto save/restore |
| **Diagnostics** | VS Code Problems panel integration | Built-in | Error/warning/info |
| **UI Components** | Theme-aware React components | Direct imports | `BasePanel`, `Button`, `Toolbar` |

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm run build

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```


## 🤝 Contributing

ViewerKit is open source and contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

MIT © ViewerKit Team

---

**Need help?** Check out our [documentation](https://viewerkit.dev) or open an issue on GitHub. 