# ViewerKit Extensions

This folder contains example extensions and development projects built with ViewerKit. These are working VS Code extensions that demonstrate different use cases and implementation patterns.

## 🏗️ Architecture Overview

ViewerKit now uses a **template-based architecture**:

- **Template**: `packages/templates/simple-react-extension/` - The official ViewerKit template
- **Extensions**: `extensions/*/` - Custom extensions for development and testing
- **SDK**: `packages/sdk/` - Core ViewerKit functionality

## 📁 Structure

```
extensions/
├── README.md              # This file
└── [extension-name]/      # Individual extension projects
    ├── src/              # Extension TypeScript code
    ├── package.json      # VS Code extension manifest
    └── README.md         # Extension-specific documentation
```

## 🚀 Creating New Extensions

### Option 1: Clone the Official Template
```bash
# Copy the template
cp -r packages/templates/simple-react-extension extensions/my-custom-viewer

# Customize for your needs
cd extensions/my-custom-viewer
# Edit package.json, update file patterns, customize UI
```

### Option 2: Start from Scratch
```bash
# Create extension folder
mkdir extensions/my-extension
cd extensions/my-extension

# Initialize
npm init
# Add ViewerKit dependencies
npm install @viewerkit/sdk
```

## 🛠️ Development Guidelines

### Template Usage
- **Recommended**: Use the official template as your starting point
- **Customization**: Modify the React components for your file type
- **SDK Integration**: Use `@viewerkit/sdk` for core functionality

### Extension Setup
1. **File Patterns**: Configure which files your extension handles
2. **Custom Editor**: Implement VS Code custom editor provider
3. **Webview UI**: Build React interface with ViewerKit hooks
4. **Message Passing**: Set up communication between extension and webview

### Development Workflow
```bash
# Install dependencies
npm install

# Build webview (if using React)
cd webview-ui && npm run build

# Compile extension
npm run compile

# Debug in VS Code
# Press F5 to launch Extension Development Host
```

## 🎯 Template Features

The official template (`packages/templates/simple-react-extension/`) includes:

- ✅ **Advanced File Operations** - Hot reload, autosave, conflict resolution
- ✅ **Sophisticated UX** - Cursor preservation, in-place updates
- ✅ **VS Code Integration** - Theme sync, proper extension lifecycle
- ✅ **React Webview** - Modern UI with comprehensive error handling
- ✅ **Production Ready** - Optimized builds, proper bundling

## 📚 Available Extensions

<!-- Extensions will be added here as they are developed -->

*No custom extensions yet. Use the template to create your first extension!*

## 🤝 Contributing

When adding new extensions:

1. **Naming**: Use descriptive names like `json-viewer`, `csv-editor`
2. **Documentation**: Include comprehensive README with setup instructions
3. **Testing**: Add example files for testing your extension
4. **Template**: Consider if your extension should become a new template

## 🔗 Related

- **Official Template**: `packages/templates/simple-react-extension/`
- **ViewerKit SDK**: `packages/sdk/`
- **Main Documentation**: `README.md` in project root and can be built independently.
