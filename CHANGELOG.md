# Changelog

All notable changes to ViewerKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-16

### Added
- Kiro IDE compatibility support (AWS agentic AI IDE)
- Enhanced editor detection for Code OSS-based editors
- Improved webview CSP configuration for better cross-editor compatibility
- React 19 compatibility support
- Updated peer dependencies to support both React 18 and 19

### Fixed
- Regex syntax error in hot reload pattern matching that caused issues in some webview environments
- Enhanced error handling in file pattern matching
- TypeScript compatibility issues with React 19's stricter type system in ButtonGroup component


## [1.0.0] - 2025-07-15

### Added
- Initial release of ViewerKit SDK
- Universal File Operations API with cross-platform support
- Hot Reload system with 100ms debounce
- Smart Autosave with backup creation
- Theme synchronization using CSS variables
- React hooks for file operations and state management
- TypeScript declarations and JSDoc documentation
- Full ESM and CommonJS support
- Comprehensive test coverage
- MIT License

### Changed
- Migrated from direct VS Code API calls to universal fileOps
- Improved architectural consistency across all features

### Developer Experience
- Complete TypeScript type definitions
- Extensive JSDoc comments for better IDE integration
- Example code in documentation
- Source maps for debugging 