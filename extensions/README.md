# ViewerKit Extensions

This directory contains VS Code extensions that demonstrate and utilize the ViewerKit SDK and templates.

## Structure

Each extension should be in its own subdirectory and follow the pattern:

```
extensions/
├── example-viewer/           # Example VS Code extension
│   ├── package.json         # VS Code extension manifest
│   ├── src/
│   │   ├── extension.ts     # Extension entry point
│   │   └── webview/         # Webview implementation using template
│   └── README.md           # Extension-specific documentation
└── README.md               # This file
```

## Development Guidelines

1. **Template Usage**: Extensions should use `@viewerkit/template-simple-react` for webview UI
2. **SDK Integration**: Use `@viewerkit/sdk` for core functionality
3. **File Types**: Each extension can target specific file types or use cases
4. **Configuration**: Extensions should be configurable and follow VS Code best practices

## Getting Started

To create a new extension:

1. Create a new directory in `extensions/`
2. Initialize with `yo code` or copy from an existing extension
3. Add dependencies on `@viewerkit/sdk` and `@viewerkit/template-simple-react`
4. Implement webview using the template package
5. Test and document your extension

## Building Extensions

Extensions are not part of the main monorepo build process. Each extension should have its own build configuration and can be built independently.
