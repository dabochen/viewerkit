# ViewerKit SDK

A powerful TypeScript SDK for building VS Code and Cursor extensions with minimal setup. ViewerKit provides a unified API for file operations, hot reload, autosave, theming, and React integration.

## 🚀 Features

- **Universal File Operations**: Cross-platform file API that works in VS Code, Cursor, and web environments
- **Hot Reload**: Automatic file watching with 100ms debounce and conflict resolution
- **Smart Autosave**: Intelligent autosave with backup creation and metadata extraction
- **Theme Integration**: Seamless VS Code theme synchronization using CSS variables
- **React Hooks**: Pre-built hooks for file watching, autosave, and state management
- **UI Components**: Ready-to-use React components with theme adaptation
- **TypeScript First**: Full type safety with comprehensive .d.ts files

## 📦 Installation

```bash
npm install viewerkit
```

**Requirements:**
- Node.js ≥18
- VS Code ≥1.85.0 (includes Cursor)
- React ≥18 (for React features)

## 🎯 Quick Start

### Basic File Operations

```typescript
import { Features } from 'viewerkit';

// Read a file with metadata
const result = await Features.fileOps.readFile('path/to/file.txt');
if (result.success) {
  console.log(result.content);
  console.log(`Lines: ${result.metadata.lines}, Words: ${result.metadata.words}`);
}

// Write a file
await Features.fileOps.writeFile('output.txt', 'Hello ViewerKit!');
```

### React Integration

```typescript
import { Hooks } from 'viewerkit';

function MyComponent() {
  // Watch a file for changes
  const fileData = Hooks.useWatchedFile('config.json');
  
  // Auto-save with conflict resolution
  const { save, isSaving } = Hooks.useAutosave('draft.md');
  
  return (
    <div>
      <p>File status: {fileData.isLoading ? 'Loading...' : 'Ready'}</p>
      <button onClick={() => save('New content')} disabled={isSaving}>
        Save
      </button>
    </div>
  );
}
```

### Extension Development

```typescript
import { createExtension, Features } from 'viewerkit';

// Create a new extension
const extension = createExtension({
  name: 'my-extension',
  features: [
    Features.autosave(),
    Features.hotReload(),
    Features.fileOps()
  ]
});

export function activate(context: vscode.ExtensionContext) {
  extension.activate(context);
}
```

## 🏗️ Architecture

ViewerKit follows a clean architectural pattern:

- **Core**: Stable foundation (runtime, bridge, registry)
- **Features**: Backend services (autosave, hotReload, fileOps)
- **Hooks**: React wrappers for all functionality
- **UI**: Pre-built React components

## 📚 API Reference

### Core Exports

- `Features.*` - All backend functionality
- `Hooks.*` - React hooks for state management
- `UI.*` - Pre-built React components
- Bridge and runtime utilities

### Key Features

| Feature | Description | React Hook |
|---------|-------------|------------|
| `fileOps` | Universal file operations | `useFileOps` |
| `autosave` | Smart autosave with backups | `useAutosave` |
| `hotReload` | File watching and hot reload | `useWatchedFile` |
| `theme` | VS Code theme integration | `useTheme` |

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

## 📖 Documentation

- [API Documentation](https://viewerkit.dev/docs) (Generated with TypeDoc)
- [Getting Started Guide](https://viewerkit.dev/guide)
- [Examples Repository](https://github.com/viewerkit/examples)

## 🛠️ CLI Tool

Scaffold new projects with the ViewerKit CLI:

```bash
npx create-viewerkit-project my-extension
```

## 🤝 Contributing

ViewerKit is open source and contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

MIT © ViewerKit Team

---

**Need help?** Check out our [documentation](https://viewerkit.dev) or open an issue on GitHub. 