# ViewerKit Modular Architecture Implementation Plan

## 🎯 **Overview**
Transform the current template-based codebase into a modular, extensible architecture that separates core functionality from template-specific implementations.

## 🏗️ **Proposed Structure**

```
packages/viewerkit-core/
├── src/
│   ├── core/                    # Framework-agnostic core logic
│   │   ├── fileWatcher.ts       # File watching & state management
│   │   ├── conflictResolver.ts  # Conflict resolution strategies
│   │   ├── debouncer.ts         # Debouncing utilities
│   │   └── messageHandler.ts    # VS Code message communication
│   ├── hooks/                   # React integration layer
│   │   ├── useWatchedFile.ts    # Main file watching hook
│   │   ├── useTheme.ts          # Theme integration hook
│   │   ├── useFileState.ts      # File state management hook
│   │   └── useConflictResolver.ts # Conflict resolution hook
│   ├── vscode/                  # VS Code extension integration
│   │   ├── provider.ts          # Custom editor provider base class
│   │   ├── commands.ts          # Command registration utilities
│   │   └── lifecycle.ts         # Extension lifecycle management
│   ├── ui/                      # Generic, reusable UI components
│   │   ├── ConflictDialog.tsx   # Conflict resolution dialog
│   │   ├── StatusBar.tsx        # Save status indicator
│   │   ├── LoadingSpinner.tsx   # Loading states
│   │   └── ErrorBoundary.tsx    # Error handling wrapper
│   └── utils/                   # Shared utilities
│       ├── logger.ts            # Logging utilities
│       ├── types.ts             # Shared TypeScript types
│       └── constants.ts         # Configuration constants
└── templates/
    ├── markdown/                # Markdown-specific template
    │   ├── MarkdownEditor.tsx   # Large textarea for markdown
    │   ├── MarkdownPreview.tsx  # Optional preview component
    │   └── markdownUtils.ts     # Markdown-specific utilities
    ├── spreadsheet/             # Future: Spreadsheet template
    │   ├── SpreadsheetGrid.tsx  # Grid of input cells
    │   ├── FormulaBar.tsx       # Formula editing
    │   └── spreadsheetUtils.ts  # Spreadsheet logic
    └── json/                    # Future: JSON editor template
        ├── JsonEditor.tsx       # Tree/form-based JSON editor
        └── jsonUtils.ts         # JSON validation/formatting
```

## 🔄 **Migration Strategy**

### **Phase 1: Extract Core Logic**
**Current:** All logic in `WebViewerKit.ts` (257 lines)
**Target:** Split into focused modules

1. **Extract `fileWatcher.ts`**
   - File watching logic
   - State management
   - Debounced autosave logic

2. **Extract `conflictResolver.ts`**
   - Conflict detection
   - Resolution strategies (merge, override, prompt)
   - Conflict state management

3. **Extract `messageHandler.ts`**
   - VS Code message communication
   - Message type definitions
   - Response handling

### **Phase 2: Create React Hooks Layer**
**Current:** Single `useWatchedFile` hook
**Target:** Focused, composable hooks

1. **Refactor `useWatchedFile.ts`**
   - Use extracted core modules
   - Maintain same API for backward compatibility
   - Add better error handling

2. **Create `useTheme.ts`**
   - Extract theme logic from current implementation
   - CSS variable management
   - Theme change detection

3. **Create `useConflictResolver.ts`**
   - Conflict resolution UI state
   - User interaction handling
   - Resolution callbacks

### **Phase 3: Extract VS Code Integration**
**Current:** `MarkdownViewerProvider.ts` and `extension.ts`
**Target:** Generic, reusable base classes

1. **Create `provider.ts`**
   - Generic custom editor provider base
   - File type registration
   - Webview lifecycle management

2. **Create `commands.ts`**
   - Command registration utilities
   - Menu integration helpers
   - Context menu builders

### **Phase 4: Separate UI Components**
**Current:** `MarkdownViewer.tsx` contains everything
**Target:** Generic components + template-specific UI

#### **Generic UI (src/ui/)**
- `ConflictDialog.tsx` - Conflict resolution dialog
- `StatusBar.tsx` - "Unsaved changes" indicator
- `LoadingSpinner.tsx` - Loading states
- `ErrorBoundary.tsx` - Error handling

#### **Template-Specific UI (templates/markdown/)**
- `MarkdownEditor.tsx` - Large textarea for markdown editing
- `MarkdownViewer.tsx` - Main component that uses core hooks + generic UI

### **Phase 5: Create Template Structure**
**Current:** Single markdown implementation
**Target:** Extensible template system

1. **Markdown Template**
   - Move markdown-specific UI to `templates/markdown/`
   - Keep simple textarea approach (current working implementation)
   - Add markdown-specific utilities if needed

2. **Template Guidelines**
   - Document how to create new templates
   - Provide examples for different UI patterns
   - Show integration with core hooks

## 🎯 **Key Design Principles**

### **1. Separation of Concerns**
- **Core logic** = Framework-agnostic, no UI dependencies
- **React hooks** = React integration layer, no UI components
- **Generic UI** = Reusable across all templates
- **Template UI** = File-type specific, custom layouts

### **2. Template Flexibility**
- **Markdown** = Single large textarea (current approach)
- **Spreadsheet** = Grid of input cells, formula bar, etc.
- **JSON** = Tree view, form inputs, validation UI
- **Custom** = Any UI pattern the developer needs

### **3. Backward Compatibility**
- Maintain current `useWatchedFile` API
- Keep same VS Code extension structure
- Preserve all working functionality

### **4. Progressive Enhancement**
- Start with simple templates (markdown = textarea)
- Allow complex templates (spreadsheet = custom grid)
- Support any UI pattern developers need

## 📦 **Package Structure**

### **Main Package: `@viewerkit/core`**
```json
{
  "name": "@viewerkit/core",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./hooks": "./dist/hooks/index.js",
    "./ui": "./dist/ui/index.js",
    "./vscode": "./dist/vscode/index.js",
    "./templates/markdown": "./dist/templates/markdown/index.js"
  }
}
```

### **Usage Examples**

#### **Simple Usage (Current Style)**
```typescript
import { useWatchedFile } from '@viewerkit/core/hooks';
import { ConflictDialog } from '@viewerkit/core/ui';
import { MarkdownEditor } from '@viewerkit/core/templates/markdown';

// Everything just works, same as current template
```

#### **Custom Template Usage**
```typescript
import { useWatchedFile, useConflictResolver } from '@viewerkit/core/hooks';
import { ConflictDialog, StatusBar } from '@viewerkit/core/ui';

// Build custom spreadsheet template
function SpreadsheetEditor() {
  const { data, setData, hasUnsavedChanges } = useWatchedFile(filePath);
  const { conflictResolution, resolveConflict } = useConflictResolver();
  
  return (
    <div>
      <StatusBar hasUnsavedChanges={hasUnsavedChanges} />
      <SpreadsheetGrid data={data} onChange={setData} />
      <ConflictDialog resolution={conflictResolution} onResolve={resolveConflict} />
    </div>
  );
}
```

## 🚀 **Implementation Steps**

### **Step 1: Create New Package Structure**
1. Create `packages/viewerkit-core/` directory
2. Set up package.json, tsconfig.json, build configuration
3. Create folder structure as outlined above

### **Step 2: Extract Core Logic**
1. Move file watching logic from `WebViewerKit.ts` to `core/fileWatcher.ts`
2. Extract conflict resolution to `core/conflictResolver.ts`
3. Extract message handling to `core/messageHandler.ts`

### **Step 3: Create React Hooks**
1. Refactor `useWatchedFile` to use extracted core modules
2. Create focused hooks for specific functionality
3. Maintain backward compatibility

### **Step 4: Extract Generic UI**
1. Create reusable components in `ui/`
2. Move conflict dialog, status bar, etc.
3. Make them theme-aware and customizable

### **Step 5: Create Template Structure**
1. Move markdown-specific UI to `templates/markdown/`
2. Create template documentation and examples
3. Test with current markdown extension

### **Step 6: Update Current Extension**
1. Update imports to use new modular structure
2. Test all functionality works as before
3. Update documentation

## ✅ **Success Criteria**

1. **✅ Backward Compatibility** - Current extension works unchanged
2. **✅ Modularity** - Each component can be used independently
3. **✅ Extensibility** - Easy to create new templates
4. **✅ Maintainability** - Clear separation of concerns
5. **✅ Documentation** - Clear usage examples and guidelines

## 🎯 **Future Templates**

This architecture will support:
- **Text editors** - Simple textarea (like current markdown)
- **Spreadsheets** - Grid of cells with formulas
- **JSON editors** - Tree view with form inputs
- **Image editors** - Canvas with drawing tools
- **Code editors** - Syntax highlighting with Monaco
- **Custom formats** - Any UI pattern needed

The key is that all templates share the same core file watching, autosave, conflict resolution, and VS Code integration, but can have completely different UI patterns in their template folders.
