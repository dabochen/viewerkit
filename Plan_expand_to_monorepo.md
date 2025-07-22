# ViewerKit Monorepo Expansion Plan

> **Goal**   
> Convert the current single-package ViewerKit SDK (v1.0.1) into a monorepo structure that consolidates the core SDK, templates, and example extensions for better development context, faster iteration, and AI-assisted development.

---

## Current State Analysis

**Existing Project Structure:**
```
viewerkit/ (current single package)
├─ src/
│  ├─ core/                     # Runtime bridge, editor registry, diagnostics
│  ├─ features/                 # Autosave, fileOps, hotReload, themeSync
│  ├─ hooks/                    # React hooks (useAutosave, useBridge, etc.)
│  └─ ui/                       # React components (BasePanel, Button, Toolbar)
├─ package.json                 # Single package "viewerkit" v1.0.1
├─ tsconfig.json               # TypeScript config
└─ tsup.config.ts              # Build configuration
```

**Key Architectural Strengths to Preserve:**
- ✅ Horizontal scaling pattern for features
- ✅ Clean separation: core (no React) vs hooks/ui (React-dependent)
- ✅ Universal file operations API
- ✅ Modular feature system
- ✅ Update check API with Supabase backend
- ✅ TypeScript-first with comprehensive types

---

## 1 Target Monorepo Layout

```
viewerkit/
├── packages/
│   ├── sdk/                    # @viewerkit/sdk - Backend/core functionality
│   │   ├── src/
│   │   │   ├── core/           # Runtime bridge, editor registry
│   │   │   ├── features/       # fileOps, hotReload, autosave, etc.
│   │   │   └── index.ts        # Public API exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── templates/              # Template packages directory
│       └── simple-react/       # Simple React template (universal viewer)
│           ├── src/
│           │   ├── components/ # React components for file viewing
│           │   ├── hooks/      # React hooks using SDK
│           │   ├── ui/         # UI elements and panels
│           │   └── index.ts    # Complete template export
│           └── package.json    # @viewerkit/template-simple-react
│
├── extensions/
│   ├── csv-viewer/             # VS Code extension using simple-react template
│   └── slide-maker/            # Another demo extension
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                # Root package with workspace scripts
└── README.md
```

*Each package in `packages/` is versioned & published independently.*

---

## 2 Migration Strategy & Roadmap (≈3 weeks)

### Phase 1: Monorepo Bootstrap (Week 1)

| Task | Description | Deliverables |
|------|-------------|-------------|
| **Setup Workspace** | Initialize pnpm workspace, configure turbo.json | Root package.json, pnpm-workspace.yaml |
| **Split Core SDK** | Move core/ + features/ to packages/sdk/ | @viewerkit/sdk package (no React deps) |
| **Preserve APIs** | Ensure backward compatibility with current exports | Updated index.ts files |
| **Migration Scripts** | Create automated migration helpers | tools/migration-scripts/ |

### Phase 2: Template Development (Week 2)

| Task | Description | Deliverables |
|------|-------------|-------------|
| **Create Template** | Create packages/templates/simple-react/ with React frontend + SDK integration | Working template package |
| **Move Hooks/UI** | Move existing hooks/ui from src/ to template package | Updated template package |
| **Configurable Components** | Create configurable components for different file types | Configurable template |
| **Test Template** | Test template functionality with SDK backend | Verified template functionality |
| **Demo Extensions** | Create demo extensions in extensions/ folder | Working demo extensions |

### Phase 3: Hardening & Launch (Week 3)

| Task | Description | Deliverables |
|------|-------------|-------------|
| **CI/CD Pipeline** | GitHub Actions for automated publishing | Automated release workflow |
| **Performance** | Optimize build times, bundle sizes | Optimized packages |
| **Launch Prep** | Final testing, documentation polish | Production-ready monorepo |

---

## 3 Package Architecture & Dependencies

### Core Package Separation Strategy

| Package | Contents | Dependencies | Publishing |
|---------|----------|--------------|------------|
| **@viewerkit/sdk** | core/, features/ | Zero React deps, only VS Code API | Independent semver |
| **@viewerkit/template-simple-react** | Universal React template | Depends on @viewerkit/sdk + React 18+ | Independent semver |
| **extensions/** | Demo extensions | Development only, not published | Never published |

### Dependency Flow
```
@viewerkit/template-simple-react
    ├─ @viewerkit/sdk    (dependency)
    └─ react ^18.0.0     (peer dependency)

@viewerkit/sdk
    └─ @types/vscode     (dependency)
```

### Migration Compatibility
- **Backward Compatibility**: Current `import { Features, Hooks, UI } from 'viewerkit'` continues to work
- **New Import Style**: `import { fileOps } from '@viewerkit/sdk'` + `import { SimpleReactViewer } from '@viewerkit/template-simple-react'`
- **Gradual Migration**: Users can migrate incrementally without breaking changes

---

## 4 Migration Execution Plan

### Step 1: Workspace Setup
```bash
# Initialize pnpm workspace
echo 'packages:\n  - "packages/*"\n  - "examples/*"' > pnpm-workspace.yaml

# Update root package.json
{
  "name": "viewerkit-monorepo",
  "private": true,
  "workspaces": ["packages/*", "examples/*"],
  "packageManager": "pnpm@8"
}
```

### Step 2: SDK Package Creation
```bash
# Create packages/sdk structure
mkdir -p packages/sdk/src

# Move core SDK files (no React dependencies)
mv src/core packages/sdk/src/
mv src/features packages/sdk/src/

# Create packages/sdk/package.json
{
  "name": "@viewerkit/sdk",
  "version": "1.0.1",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@types/vscode": "^1.85.0"
  }
}
```

### Step 3: Template Package Creation
```bash
# Create simple-react template structure
mkdir -p packages/template-simple-react/src

# Move template files
mv src/ui packages/template-simple-react/src/
mv src/hooks packages/template-simple-react/src/

# Create packages/template-simple-react/package.json
{
  "name": "@viewerkit/template-simple-react",
  "version": "1.0.1",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@viewerkit/sdk": "workspace:*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Step 4: Preserve Current API
```typescript
// Root index.ts (for backward compatibility)
export * from '@viewerkit/sdk';
export * as SimpleReactViewer from '@viewerkit/template-simple-react';
```

---

## 5 Development Workflow & Tooling

### Local Development Setup
```bash
# Install all dependencies
pnpm install

# Build all packages in dependency order
pnpm run build

# Development mode with live reload
pnpm run dev          # Runs all packages in watch mode

# Package-specific development
pnpm -F @viewerkit/sdk dev                    # Core SDK development
pnpm -F @viewerkit/template-simple-react dev  # Template development
```

### Turbo.json Configuration
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### Benefits of Monorepo Structure
- **Unified Development**: Edit SDK and templates simultaneously
- **Instant Debugging**: Breakpoints work across package boundaries
- **Consistent Tooling**: Shared ESLint, TypeScript, and build configs
- **Atomic Changes**: Update SDK + templates in single PR
- **Better Testing**: Integration tests across packages

---

## 6 AI Development Guard-Rails

### .cursor-config.json
```json
{
  "rules": [
    "Never import React in @viewerkit/sdk package - SDK is backend only",
    "Template is a React frontend that consumes SDK backend services",
    "Each template is a complete viewer implementation for a file type",
    "Preserve backward compatibility during migration",
    "Use CSS variables (--vk-*) for VS Code theme integration",
    "Follow horizontal scaling pattern for new features"
  ],
  "include": ["packages/**", "extensions/**"],
  "exclude": ["node_modules/**", "dist/**"]
}
```

### Development Context Guidelines
- **Package Boundaries**: Always respect dependency flow (sdk → templates)
- **Feature Addition**: New SDK features go in `packages/sdk/src/features/`
- **Template Creation**: Template consumes SDK backend services and provides universal React frontend
- **Backward Compatibility**: Maintain existing import paths during transition

---

## 7 Critical Migration Considerations

### Preserving Existing Features
- **Update Check API**: The existing Supabase-based update checking system must be preserved in the SDK package
- **Authentication Middleware**: Keep the HMAC-SHA256 signature validation in the core SDK
- **File Operations**: Maintain the universal file operations API that works across all VS Code-based editors
- **Theme Synchronization**: Preserve CSS variable-based theme integration

### Breaking Change Prevention
- **Import Compatibility**: Maintain `import { Features, Hooks, UI } from 'viewerkit'` during transition
- **API Surface**: All existing public APIs must remain unchanged
- **Version Alignment**: Start all packages at v1.0.1 to match current version
- **Gradual Migration**: Allow users to adopt new package structure incrementally

### Testing Strategy
- **Unit Tests**: Each package gets its own test suite with Vitest
- **Integration Tests**: Cross-package testing to ensure compatibility
- **VS Code Extension Tests**: Use `@vscode/test-electron` for end-to-end testing
- **Backward Compatibility Tests**: Ensure old import patterns continue working

---

## 8 Success Metrics

### Technical Metrics
- **Build Performance**: Sub-10s full build time with Turbo caching
- **Bundle Size**: SDK package <50KB gzipped, templates <200KB each
- **Development Experience**: Hot reload <500ms across packages
- **Test Coverage**: >90% coverage for SDK core, >80% for templates

### Developer Experience Metrics
- **Setup Time**: New template creation <5 minutes with CLI
- **Debug Experience**: Breakpoints work seamlessly across package boundaries
- **Documentation**: Complete API docs with examples for each package
- **AI Assistance**: Clear context boundaries for AI-assisted development

---

## 9 Risk Mitigation

### Technical Risks
- **Circular Dependencies**: Strict dependency flow enforcement with ESLint rules
- **Version Drift**: Automated dependency updates with Renovate
- **Build Complexity**: Incremental builds with Turbo to minimize complexity
- **Testing Overhead**: Shared test utilities to reduce duplication

### Migration Risks
- **Breaking Changes**: Comprehensive backward compatibility testing
- **User Confusion**: Clear migration guide with automated migration scripts
- **Performance Regression**: Benchmark testing before and after migration
- **Feature Loss**: Audit checklist to ensure no functionality is lost

---

## 10 Next Steps

### Immediate Actions (This Week)
1. **Backup Current State**: Create git tag `pre-monorepo-migration`
2. **Create Migration Branch**: `git checkout -b feature/monorepo-migration`
3. **Setup Workspace**: Initialize pnpm workspace and turbo configuration
4. **Package Splitting**: Move code according to the migration execution plan
5. **Backward Compatibility**: Ensure existing imports continue working

### Validation Steps
1. **Build Verification**: All packages build successfully
2. **Import Testing**: Old import patterns work unchanged
3. **Feature Testing**: All existing features function correctly
4. **Development Workflow**: Hot reload and debugging work across packages
5. **Documentation Update**: README and API docs reflect new structure

### Success Criteria for Completion
- ✅ All existing functionality preserved
- ✅ Backward compatibility maintained
- ✅ Development experience improved
- ✅ Clear package boundaries established
- ✅ AI development context enhanced
- ✅ Foundation ready for template development
