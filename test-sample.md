# ViewerKit Extension Demo

Welcome to the **ViewerKit Markdown Viewer** extension! This is a demonstration of the ViewerKit monorepo architecture.

## Features

- ✅ **Monorepo Structure**: SDK backend + React template frontend
- ✅ **VS Code Integration**: Custom editor for markdown files
- ✅ **Theme Support**: Automatically adapts to VS Code theme
- ✅ **Markdown Rendering**: Uses `marked` library for HTML conversion

## Architecture

### SDK Package (`@viewerkit/sdk`)
- Core runtime bridge
- File operations API
- Theme synchronization
- Hot reload functionality
- **React-free backend**

### Template Package (`@viewerkit/template-simple-react`)
- React hooks (`useTheme`, `useBridge`, `useWatchedFile`, `useAutosave`)
- UI components (`BasePanel`, `Button`, `Toolbar`)
- **Universal React frontend**

## Code Example

```typescript
import { useWatchedFile, useTheme } from '@viewerkit/template-simple-react';

const MyComponent = () => {
  const { data, setData, loading } = useWatchedFile('/path/to/file.md');
  const { theme, cssVariables } = useTheme();
  
  return (
    <div style={{ color: cssVariables['--vk-text-primary'] }}>
      {loading ? 'Loading...' : data}
    </div>
  );
};
```

## Testing Instructions

1. **Create `.vscode/launch.json`** (see instructions below)
2. **Press F5** to launch extension development host
3. **Open this file** in the new VS Code window
4. **Right-click** → "Open with ViewerKit Markdown Viewer"
5. **Verify** the extension renders this markdown content

---

**Status**: ✅ Extension setup complete and ready for testing!
