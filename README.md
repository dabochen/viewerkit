# ViewerKit

🚀 **Build powerful VS Code extensions with React webviews in minutes, not hours.**

ViewerKit is a complete source-based toolkit for creating VS Code extensions with sophisticated file viewing and editing capabilities. Instead of wrestling with webview APIs, file I/O, and state management, you get a production-ready template with advanced UX features like autosave, hot reload, and conflict resolution built-in.

## ✨ **Why ViewerKit?**

- **⚡ Get Started Fast**: Clone, customize, and ship - no complex setup
- **🎯 Focus on Your UX**: Core file operations and state management handled for you  
- **🔥 Advanced Features**: Autosave, hot reload, conflict resolution, cursor preservation
- **🎨 Theme Integration**: Automatic VS Code theme synchronization
- **📱 Universal Compatibility**: Works across VS Code, Cursor, Windsurf, and other Code OSS editors
- **🛡️ TypeScript First**: Full type safety throughout

## 🏗️ **Project Structure**

```
viewerkit/
├── packages/
│   ├── viewerkit-core/              # 🧠 Modular core components
│   │   ├── src/core/               # Framework-agnostic logic
│   │   ├── src/hooks/              # React integration hooks
│   │   ├── src/ui/                 # Reusable UI components
│   │   └── src/templates/          # Template-specific components
│   └── templates/
│       └── simple-react-extension/ # 📦 Complete VS Code extension template
│           ├── src/                # Extension host (Node.js)
│           └── webview-ui/         # React webview app (browser)
└── extensions/                      # 🔧 Development & testing extensions
```

## 🚀 **Quick Start**

### **1. Clone and Install**
```bash
git clone https://github.com/dabochen/viewerkit.git
cd viewerkit
pnpm install
```

### **2. Build the Project**
```bash
pnpm run build
```

### **3. Try the Template Extension**
```bash
# Build the template extension
cd packages/templates/simple-react-extension
npm run compile
cd webview-ui && npm run build

# Open in VS Code and press F5 to test
code .
```

### **4. Create Your Own Extension**
```bash
# Copy the template
cp -r packages/templates/simple-react-extension my-awesome-extension
cd my-awesome-extension

# Customize package.json, manifest, and React components
# Build and test with F5 in VS Code
```

## 🎯 **What You Get**

### **📦 Complete Extension Template**
- **VS Code Extension Host**: Handles document management and webview lifecycle
- **React Webview App**: Modern React UI with TypeScript
- **Advanced File I/O**: Autosave, hot reload, conflict resolution
- **Theme Integration**: Automatic VS Code theme synchronization
- **Build System**: Webpack + TypeScript compilation ready

### **🧠 Modular Core Components** (Optional)
- **Framework-Agnostic Logic**: File watching, conflict resolution, debouncing
- **React Hooks**: `useWatchedFile`, `useTheme`, `useFileState`
- **UI Components**: `ConflictDialog`, `StatusBar`, `LoadingSpinner`
- **Template Components**: `MarkdownEditor`, `MarkdownViewer`

## 🛠️ **Development Workflow**

### **Build Commands**
```bash
# Build everything
pnpm run build

# Build specific packages
pnpm -F @viewerkit/core build
pnpm -F simple-react-extension compile

# Development mode
pnpm run dev
```

### **Extension Development**
```bash
# Navigate to template
cd packages/templates/simple-react-extension

# Build extension host (TypeScript)
npm run compile

# Build webview app (React + Webpack)
cd webview-ui && npm run build

# Test in VS Code (press F5)
code .
```

### **Creating Your Extension**
```bash
# Copy and customize the template
cp -r packages/templates/simple-react-extension my-extension
cd my-extension

# Update package.json and manifest
vim package.json
vim webview-ui/package.json

# Customize the React components
vim webview-ui/src/MarkdownViewer.tsx

# Build and test
npm run compile && cd webview-ui && npm run build
```

## 💡 **How It Works**

### **Architecture Overview**
```
VS Code Extension (Node.js)     ↔     React Webview (Browser)
├── Document Management                ├── UI Components
├── File I/O Operations                ├── User Interactions  
├── Webview Lifecycle                  ├── State Management
└── Message Handling                   └── Theme Integration
```

### **Key Features in Action**

**🔄 Simple Integration:**
```tsx
// In your React webview component
import { useWatchedFile, useTheme } from './WebViewerKit';

function MyEditor() {
  const { 
    data: content, 
    setData: setContent, 
    hasUnsavedChanges, 
    conflictResolution, 
    resolveConflict 
  } = useWatchedFile(filePath);
  
  const { cssVariables } = useTheme();
  
  return (
    <textarea 
      value={content || ''}
      onChange={(e) => setContent(e.target.value)}
      style={{ 
        backgroundColor: 'var(--vscode-input-background)',
        color: 'var(--vscode-input-foreground)'
      }}
    />
  );
}
```

**🎨 Theme Integration:**
```css
/* Automatic VS Code theme variables */
.my-component {
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  border: 1px solid var(--vscode-input-border);
}
```

**⚡ Extension Host (Minimal Setup):**
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { MarkdownViewerProvider } from './MarkdownViewerProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new MarkdownViewerProvider(context);
  const registration = vscode.window.registerCustomEditorProvider(
    'viewerkit.markdownViewer',
    provider
  );
  context.subscriptions.push(registration);
}
```

## 📚 **Extension Packaging**

### **Building for Distribution**
```bash
# Build your extension
cd my-extension
npm run compile
cd webview-ui && npm run build

# Package as .vsix
npx vsce package

# Install locally
code --install-extension my-extension-1.0.0.vsix
```

### **Publishing to Marketplace**
```bash
# Login to Visual Studio Marketplace
npx vsce login your-publisher-name

# Publish
npx vsce publish
```

## 🛠️ **Customization Guide**

### **File Type Support**
To add support for new file types, modify:

1. **`package.json`** - Add file associations
2. **`MarkdownViewer.tsx`** - Update UI components
3. **`WebViewerKit.ts`** - Add file-specific logic if needed

### **UI Theming**
ViewerKit automatically syncs with VS Code themes using CSS variables:

```css
/* Available theme variables */
var(--vscode-editor-background)
var(--vscode-editor-foreground)
var(--vscode-input-background)
var(--vscode-input-foreground)
var(--vscode-button-background)
var(--vscode-errorForeground)
/* ... and many more */
```

### **Advanced Features**
- **Conflict Resolution**: Built-in dialog for concurrent edits
- **Cursor Preservation**: Maintains cursor position during external updates
- **Debounced Autosave**: 400ms debounce prevents excessive saves
- **Hot Reload**: Instant updates from external file changes

## 📝 **Requirements**

- **Node.js** ≥18.0.0
- **VS Code** ≥1.85.0 (or compatible editors)
- **pnpm** (recommended) or npm
- **TypeScript** knowledge for customization
- **React** knowledge for UI development

## 🔗 **Compatible Editors**

- ✅ **VS Code** (Microsoft)
- ✅ **Cursor** (Anysphere)
- ✅ **Windsurf** (Codeium)
- ✅ **Other Code OSS-based editors**

## 📜 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🚀 **Get Started Now**

```bash
git clone https://github.com/your-org/viewerkit.git
cd viewerkit
pnpm install && pnpm run build
cd packages/templates/simple-react-extension
code . # Press F5 to test!
```

---

**Ready to build amazing VS Code extensions?** 🎉 