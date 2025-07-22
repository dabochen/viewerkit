# ViewerKit Simple React Template

The official ViewerKit template for creating VS Code extensions with React webviews. This is a complete, working VS Code extension that demonstrates advanced file viewing and editing capabilities with sophisticated UX features.

## 🚀 What You Get

This template provides:

- **Complete VS Code Extension** - Ready to install and use
- **React Webview UI** - Modern, responsive interface with VS Code theme integration
- **Advanced File Operations** - Hot reload, autosave, conflict resolution
- **Sophisticated UX** - Cursor preservation, in-place updates, no DOM refresh
- **ViewerKit SDK Integration** - Full access to ViewerKit's powerful features

## 🎯 Template Features

### Core Functionality
- ✅ **File Watching** - Real-time updates when files change externally
- ✅ **Autosave** - Debounced saving (400ms) with visual feedback
- ✅ **Hot Reload** - Seamless content updates without page refresh
- ✅ **Theme Sync** - Automatic VS Code theme integration
- ✅ **Conflict Resolution** - Smart handling of concurrent edits

### Advanced UX
- ✅ **Cursor Preservation** - Maintains cursor position during updates
- ✅ **Focus Management** - No interruption during active editing
- ✅ **Visual Feedback** - Save status, unsaved changes indicator
- ✅ **Conflict UI** - User-friendly conflict resolution with action buttons

### Technical Architecture
- ✅ **Dual Build System** - Extension (TypeScript) + Webview (React/Webpack)
- ✅ **Message Passing** - Robust communication between extension and webview
- ✅ **Feedback Loop Prevention** - Smart update logic to avoid DOM refresh
- ✅ **Node.js Isolation** - Webview-safe utilities to prevent bundle issues

## 🛠️ How to Use This Template

### Option 1: Clone and Customize
```bash
# Clone the template
cp -r packages/templates/simple-react-extension my-custom-viewer

# Customize for your file type
cd my-custom-viewer
```

### Option 2: Use as Reference
Study the code structure and patterns to build your own extension.

## 📁 Template Structure

```
simple-react-extension/
├── src/                          # VS Code Extension (TypeScript)
│   ├── extension.ts             # Extension entry point
│   └── MarkdownViewerProvider.ts # Custom editor provider
├── webview-ui/                  # React Webview App
│   ├── src/
│   │   ├── MarkdownViewer.tsx   # Main React component
│   │   ├── WebViewerKit.ts      # Webview-safe ViewerKit utilities
│   │   └── styles.css           # VS Code theme-aware styles
│   ├── webpack.config.js        # Webview bundling config
│   └── package.json             # React dependencies
├── package.json                 # Extension manifest
└── tsconfig.json               # TypeScript config
```

## 🔧 Customization Guide

### 1. Update Extension Manifest
Edit `package.json`:
```json
{
  "name": "my-custom-viewer",
  "displayName": "My Custom Viewer",
  "description": "Custom file viewer built with ViewerKit",
  "contributes": {
    "customEditors": [{
      "viewType": "mycompany.myViewer",
      "displayName": "My Custom Viewer",
      "selector": [{ "filenamePattern": "*.myext" }]
    }]
  }
}
```

### 2. Customize the React Component
Edit `webview-ui/src/MarkdownViewer.tsx`:
- Replace textarea with your custom editor (Monaco, CodeMirror, etc.)
- Add file type-specific features
- Customize the UI layout and styling

### 3. Update File Processing
Edit `src/MarkdownViewerProvider.ts`:
- Change file processing logic
- Add custom save/load operations
- Implement file type-specific features

### 4. Add Custom Features
- Extend `WebViewerKit.ts` with custom hooks
- Add new message types for extension ↔ webview communication
- Implement file type-specific operations

## 🚀 Development Workflow

### 1. Install Dependencies
```bash
# Install extension dependencies
npm install

# Install webview dependencies
cd webview-ui && npm install
```

### 2. Build the Extension
```bash
# Build webview React app
cd webview-ui && npm run build

# Compile extension TypeScript
npm run compile
```

### 3. Debug the Extension
1. Open in VS Code
2. Press `F5` to launch Extension Development Host
3. Open a file with your custom editor
4. Test all features

### 4. Package for Distribution
```bash
# Install vsce if not already installed
npm install -g vsce

# Package the extension
vsce package
```

## 🎨 Styling and Theming

The template includes comprehensive VS Code theme integration:

```css
/* Automatic theme variables */
--vscode-editor-background
--vscode-editor-foreground
--vscode-button-background
--vscode-input-background
/* ... and many more */
```

All UI elements automatically adapt to:
- Light/Dark themes
- High contrast themes
- Custom VS Code themes

## 🔍 Key Code Patterns

### Message Passing
```typescript
// Extension → Webview
webview.postMessage({
  type: 'update',
  content: fileContent,
  filePath: document.uri.fsPath
});

// Webview → Extension
vscode.postMessage({
  type: 'save',
  content: newContent,
  filePath: currentPath
});
```

### Conflict Resolution
```typescript
// Smart update logic prevents feedback loops
if (isExternalChange && hasUnsavedChanges && currentContent !== incomingContent) {
  setConflictResolution('external'); // Show conflict UI
} else if (!isUserEditingRef.current && currentContent !== incomingContent) {
  setData(incomingContent); // Update in-place
}
```

### Cursor Preservation
```typescript
// Save cursor position during content changes
const cursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

useEffect(() => {
  if (textareaRef.current && document.activeElement === textareaRef.current) {
    const { start, end } = cursorPositionRef.current;
    textareaRef.current.setSelectionRange(start, end);
  }
}, [content]);
```

## 📚 ViewerKit SDK Integration

This template demonstrates full ViewerKit SDK usage:

```typescript
import { fileOps } from '@viewerkit/sdk';

// File operations
const content = await fileOps.readFile(filePath);
await fileOps.writeFile(filePath, newContent);

// Webview-safe utilities
import { useWatchedFile, useTheme } from './WebViewerKit';

const { data, setData, hasUnsavedChanges, conflictResolution } = useWatchedFile();
const { cssVariables } = useTheme();
```

## 🤝 Contributing

This template is part of the ViewerKit project. To contribute:

1. Test the template with different file types
2. Report issues or suggest improvements
3. Submit PRs for new features or bug fixes

## 📄 License

MIT License - see the main ViewerKit project for details.

---

**Built with ViewerKit SDK** - The universal toolkit for VS Code file viewers and editors.
