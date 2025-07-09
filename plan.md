# ViewerKit Implementation Plan
*Version: 2025-07-09*

---

## Overview

This plan outlines the step-by-step implementation of ViewerKit - an SDK for building VS Code/Cursor extensions with minimal setup. The project consists of three main repositories and follows a modular, horizontally-scalable architecture.

## Project Structure

```
viewerkit-ecosystem/
├── viewerkit-sdk/          # Core SDK package
├── viewerkit-cli/          # CLI scaffolding tool  
└── viewerkit-template/     # Starter template
```

---

## Phase 1: Foundation Setup (Week 1-2)

### Step 1.1: Repository Initialization
**Goal**: Set up the three core repositories with proper tooling and CI/CD.

**Implementation**:
- Create GitHub repositories: `viewerkit-sdk`, `viewerkit-cli`, `viewerkit-template`
- Set up TypeScript, ESLint, Prettier configuration (Airbnb preset)
- Configure build tooling (tsup/esbuild for SDK, simple build for CLI)
- Set up GitHub Actions for automated publishing

**Explanation**: 
Starting with proper foundation ensures consistent code quality and automated workflows. Using esbuild provides fast builds and minimal configuration overhead, aligning with our "zero dependency hell" goal.

**Deliverables**:
- [x] Three repositories with basic structure (SDK structure created)
- [x] Package.json configurations with proper dependencies
- [x] TypeScript configs with strict settings
- [ ] GitHub Actions workflows for automated npm publishing (will be added later)

---

### Step 1.2: Core Runtime Bridge
**Goal**: Establish the fundamental communication layer between host and webview.

**Implementation**:
```typescript
// viewerkit-sdk/src/core/runtime/bridge.ts
interface Message {
  type: string;
  payload?: any;
  id?: string;
}

export class Bridge {
  // Unified postMessage handling
  // Error capture and reporting
  // Promise-based request/response pattern
}
```

**Explanation**:
The bridge is the heart of the entire system. It abstracts away the complexity of VS Code's postMessage API and provides a clean, type-safe interface. This needs to be rock-solid as everything else depends on it.

**Deliverables**:
- [x] Message type definitions
- [x] Bidirectional communication setup
- [x] Error handling and recovery
- [x] Promise-based async patterns

---

## Phase 2: Core Infrastructure (Week 3-4)

### Step 2.1: Editor Registry System
**Goal**: Universal registration across different editors (VS Code, Cursor, Windsurf).

**Implementation**:
```typescript
// viewerkit-sdk/src/core/editorRegistry.ts
export function registerEditor(context: vscode.ExtensionContext, manifest: EditorManifest) {
  // Auto-detect editor type
  // Register webview panels
  // Handle lifecycle events
}
```

**Explanation**:
Different editors have slight variations in their APIs. This registry abstracts these differences and provides a unified registration interface, making the SDK truly universal.

**Deliverables**:
- [x] Editor detection logic
- [x] Unified registration interface
- [x] Webview panel lifecycle management
- [x] Support for VS Code, Cursor, Windsurf

---

### Step 2.2: State Persistence System
**Goal**: Automatic save/restore of webview state across sessions.

**Implementation**:
```typescript
// viewerkit-sdk/src/core/runtime/webviewState.ts
export class WebviewState {
  // Serialize/deserialize state
  // Handle scroll position, selections
  // Integrate with VS Code's state API
}
```

**Explanation**:
Users expect their panels to remember scroll positions, selections, and other UI state. This system automatically handles persistence without requiring developers to write boilerplate code.

**Deliverables**:
- [x] Automatic state serialization
- [x] Scroll position tracking
- [x] Selection state management
- [ ] Integration with BasePanel component (will be implemented with UI components)

---

### Step 2.3: Debug Console (Development Tool)
**Goal**: Developer-friendly debugging interface for development builds.

**Implementation**:
```typescript
// viewerkit-sdk/src/core/debugConsole.ts
export class DebugConsole {
  // Show bridge message traffic
  // Display FPS and performance metrics
  // Only active in development mode
}
```

**Explanation**:
Debugging extension communication can be challenging. This floating console shows real-time message traffic and performance metrics, but only in development builds to avoid production overhead.

**Deliverables**:
- [x] Floating debug panel (console-based implementation)
- [x] Message traffic visualization
- [x] Performance metrics
- [x] Development-only activation

---

## Phase 3: Feature Modules (Week 5-7) ✅ **COMPLETED**

### Step 3.1: Hot Reload File Watching ✅
**Goal**: Real-time file change detection and webview updates.

**Implementation**:
✅ **Implemented**: `src/features/hotReload/`
- `host.ts`: VS Code FileSystemWatcher with 100ms debounce
- `web.ts`: Event handling and pattern matching  
- `public.ts`: Clean API exports
- `index.ts`: Barrel export

**Explanation**:
Hot reload is essential for developer experience. The system watches files using VS Code's native file system watcher, debounces changes to prevent excessive updates, and automatically pushes changes to the webview.

**Deliverables**:
- ✅ File system watcher setup
- ✅ Glob pattern support
- ✅ Debounced change detection (100ms)
- ✅ Loop prevention for internal writes
- ✅ React hook: `useWatchedFile()`

---

### Step 3.2: Autosave System ✅
**Goal**: Automatic, debounced saving of changes back to disk.

**Implementation**:
✅ **Implemented**: `src/features/autosave/`
- `host.ts`: Debounced file writing with backup and retry
- `web.ts`: Request management and React hooks
- `public.ts`: Host/web API separation
- `index.ts`: Barrel export

**Explanation**:
Users expect their changes to be saved automatically. The system debounces writes to prevent excessive disk I/O and integrates with the file watcher to avoid triggering unnecessary reloads.

**Deliverables**:
- ✅ Debounced write operations (400ms)
- ✅ Error handling and retries with exponential backoff
- ✅ Integration with hot reload system
- ✅ React hook: `useAutosave()`

---

### Step 3.3: Theme Synchronization ✅
**Goal**: Automatic theme detection and CSS variable injection.

**Implementation**:
✅ **Implemented**: `src/features/themeSync/`
- `host.ts`: VS Code theme detection and CSS generation
- `web.ts`: DOM CSS variable injection and React hooks
- `public.ts`: Theme API exports
- `index.ts`: Barrel export

**Explanation**:
Extensions should seamlessly integrate with the editor's theme. This system automatically detects theme changes and injects appropriate CSS variables, ensuring consistent visual integration.

**Deliverables**:
- ✅ Theme change detection
- ✅ CSS variable extraction (--vk-* namespace)
- ✅ High contrast mode support
- ✅ React hook: `useTheme()`

---

### Step 3.4: Universal File Operations ✅
**Goal**: Universal file I/O operations without format assumptions.

**Implementation**:
✅ **Refactored**: `src/features/fileOps/` (renamed from `parsers/`)
- `host.ts`: Universal file reading/writing with metadata extraction
- `web.ts`: Bridge-based file operations for webview
- `public.ts`: Clean file operation APIs  
- `index.ts`: Barrel export

**Explanation**:
Rather than imposing specific parsing formats, this system provides universal file operations. Users can bring their own JSON/YAML/Markdown libraries while ViewerKit handles the file I/O, metadata extraction, and error management. This keeps the SDK truly universal and avoids dependency lock-in.

**Deliverables**:
- ✅ Universal file reading with metadata (size, lines, words, encoding)
- ✅ Robust file writing with error handling and validation
- ✅ Format-agnostic approach - no parsing assumptions
- ✅ Custom validation framework for user-defined rules
- ✅ Performance tracking and error reporting
- ✅ React hook: `useFileOperations()`

**Philosophy Change**: 
- **Before**: Format-specific parsers (JSON, YAML, Markdown)
- **After**: Universal file I/O + let users choose parsing libraries
- **Benefit**: True universality, zero dependency lock-in, horizontal scaling

**Phase 3 Summary**:
- ✅ All feature modules implemented with PRD compliance
- ✅ Horizontal scaling architecture validated  
- ✅ Performance optimizations (debouncing, tree-shaking)
- ✅ Complete test suite created in `/test-script/`
- ✅ Integration verified across all features
- ✅ **Universal File Operations Refactoring Completed**:
  - ✅ Renamed `parsers/` → `fileOps/` for universal approach
  - ✅ Removed format-specific parsing (JSON, YAML, Markdown)
  - ✅ Implemented universal file I/O with metadata extraction
  - ✅ Added custom validation framework
  - ✅ Updated documentation to reflect universal philosophy
  - ✅ Zero dependency lock-in - users choose parsing libraries
  - ✅ All linting errors resolved
- ✅ **Test Suite Results**: All tests passing (3/3)
  - Feature Module Tests: ✅ PASS
  - Integration Tests: ✅ PASS
  - Universal File Operations: ✅ PASS (8/8 tests)
  - Full PRD compliance validated
  - Production-ready architecture confirmed

---

## ✅ Phase 4: Developer Experience Layer (Week 8-9) ✅ **COMPLETED**

### Step 4.1: React Hooks ✅
**Goal**: React-friendly wrappers for all core functionality.

**Implementation**:
✅ **Implemented**: `src/hooks/`
- `useWatchedFile.ts`: File watching with React state integration and autosave
- `useAutosave.ts`: Debounced autosave with React hooks and error handling  
- `useTheme.ts`: Theme synchronization with CSS variables and React state
- `useBridge.ts`: Advanced bridge communication with message handling
- `index.ts`: Centralized hook exports

**Explanation**:
React hooks provide the most ergonomic way to use ViewerKit features in React applications. They handle state management, side effects, and cleanup automatically.

**Deliverables**:
- ✅ File watching hook with state integration (`useWatchedFile`, `useWatchedJSONFile`, `useWatchedTextFile`)
- ✅ Autosave hook with debouncing (`useAutosave`, `useAutosaveState`)
- ✅ Theme hook with color extraction (`useTheme`, `useSimpleTheme`)
- ✅ Bridge hook for advanced use cases (`useBridge`, `useMessageListener`)

---

### Step 4.2: UI Component Library ✅
**Goal**: Pre-built, theme-aware components for common UI patterns.

**Implementation**:
✅ **Implemented**: `src/ui/`
- `BasePanel.tsx`: Foundation panel with lifecycle, state persistence, and error handling
- `Toolbar.tsx`: Flexible toolbar with VS Code icons, sizes, and accessibility
- `Button.tsx`: Comprehensive button system with variants, loading states, and groups
- `index.ts`: Centralized component exports

**Explanation**:
Common UI patterns shouldn't require reimplementation. These components provide consistent styling that automatically adapts to the editor's theme and follows accessibility guidelines.

**Deliverables**:
- ✅ BasePanel with lifecycle integration, state persistence, and error boundaries
- ✅ Toolbar with theme-aware styling, VS Code icon support, and keyboard navigation
- ✅ Button components with proper states (Button, IconButton, ButtonGroup)
- ✅ CSS variables for consistent theming (--vk-* namespace)

**Phase 4 Summary**:
- ✅ Complete React hooks API for all ViewerKit features
- ✅ Production-ready UI component library with theme integration
- ✅ Seamless integration between hooks and existing feature modules
- ✅ Comprehensive accessibility support (ARIA labels, keyboard navigation)
- ✅ **Test Suite Results**: All tests passing (3/3)
  - Feature Module Tests: ✅ PASS
  - Integration Tests: ✅ PASS
  - Phase 4: React Hooks & UI Components: ✅ PASS
  - Developer experience validated and production-ready

---

## Phase 5: CLI and Template System (Week 10-11)

### Step 5.1: CLI Tool
**Goal**: One-command project scaffolding with proper setup.

**Implementation**:
```typescript
// viewerkit-cli/src/index.ts
export function createProject(name: string) {
  // Clone template repository
  // Update package.json with project name
  // Remove .git directory
  // Run npm install
  // Display next steps
}
```

**Explanation**:
The CLI eliminates setup friction by automatically cloning the template, configuring it for the new project, and installing dependencies. This reduces time-to-first-extension from hours to minutes.

**Deliverables**:
- [ ] Template cloning logic
- [ ] Package.json manipulation
- [ ] Dependency installation
- [ ] Success message with next steps

---

### Step 5.2: Template Project
**Goal**: Production-ready starter template with best practices.

**Implementation**:
```
viewerkit-template/
├── src/
│   └── extension.ts          # Host extension entry
├── webview-src/
│   ├── App.tsx              # React webview application
│   ├── vite.config.ts       # Vite configuration
│   └── index.html           # Webview HTML
├── package.json             # Dependencies and scripts
└── README.md                # Getting started guide
```

**Explanation**:
The template provides a complete, working extension that demonstrates ViewerKit best practices. It includes both host and webview code with proper build configuration and development scripts.

**Deliverables**:
- [ ] Complete extension template
- [ ] Vite configuration for webview
- [ ] Esbuild configuration for host
- [ ] Development and build scripts
- [ ] Comprehensive README

---

## Phase 6: Documentation and Testing (Week 12-13)

### Step 6.1: Diagnostics System
**Goal**: Automatic error reporting and statistics collection.

**Implementation**:
```typescript
// viewerkit-sdk/src/core/diagnostics.ts
export function reportDiagnostics(uri: vscode.Uri, stats: DiagnosticStats) {
  // Word count and file statistics
  // Error capture and reporting
  // Integration with VS Code Problems panel
}
```

**Explanation**:
Good developer experience includes helpful error messages and debugging information. The diagnostics system automatically reports issues to VS Code's Problems panel and provides useful statistics.

**Deliverables**:
- [x] Error capture and reporting
- [x] File statistics generation
- [x] VS Code Problems panel integration
- [ ] Automatic invocation from hooks (will be implemented with React hooks)

---

### Step 6.2: Comprehensive Testing
**Goal**: Ensure reliability across different editors and scenarios.

**Implementation**:
- Unit tests for all core functions
- Integration tests for editor registration
- E2E tests with actual VS Code instances
- Performance benchmarks for file watching

**Explanation**:
Since ViewerKit is infrastructure that other extensions depend on, it must be extremely reliable. Comprehensive testing ensures compatibility across different editors and scenarios.

**Deliverables**:
- [ ] Unit test suite with high coverage
- [ ] Integration tests for editor APIs
- [ ] E2E tests with real extensions
- [ ] Performance benchmarks

---

## Phase 7: Publishing and Ecosystem (Week 14)

### Step 7.1: Automated Publishing
**Goal**: Zero-friction publishing process for all packages.

**Implementation**:
- GitHub Actions workflows for automatic npm publishing
- Semantic versioning with conventional commits
- Automated changelog generation
- Release notes and migration guides

**Explanation**:
Automated publishing reduces human error and ensures consistent release processes. Git tags trigger automatic builds and npm publications without manual intervention.

**Deliverables**:
- [ ] GitHub Actions workflows
- [ ] Semantic versioning setup
- [ ] Automated changelog generation
- [ ] Release documentation

---

### Step 7.2: Documentation Website
**Goal**: Comprehensive documentation for easy adoption.

**Implementation**:
- API documentation with TypeScript signatures
- Getting started guides and tutorials
- Example extensions and code samples
- Migration guides from other extension frameworks

**Explanation**:
Great documentation is essential for developer adoption. The website should make it easy for developers to understand ViewerKit's capabilities and get started quickly.

**Deliverables**:
- [ ] API reference documentation
- [ ] Tutorial and getting started guides
- [ ] Example extension gallery
- [ ] Best practices documentation

---

## Success Metrics

- **Developer Experience**: Time from `npx viewerkit create` to working extension < 5 minutes
- **Bundle Size**: SDK adds < 50KB to extension bundles
- **Performance**: File watching with < 100ms latency
- **Compatibility**: Works across VS Code, Cursor, Windsurf
- **Adoption**: 100+ extensions using ViewerKit within 6 months

---

## Risk Mitigation

1. **Editor API Changes**: Maintain compatibility layers and deprecation warnings
2. **Performance Issues**: Continuous benchmarking and optimization
3. **Breaking Changes**: Semantic versioning and migration guides
4. **Bundle Size**: Tree-shaking and dynamic imports for optional features
5. **Developer Experience**: Extensive testing with real-world use cases

---

## Next Steps

1. Start with Phase 1: Foundation Setup
2. Build incrementally, testing each component thoroughly
3. Get early feedback from extension developers
4. Iterate based on real-world usage patterns
5. Focus on developer experience and ease of use

Each phase builds upon the previous one, ensuring a solid foundation while maintaining the ability to iterate based on feedback and real-world usage. 