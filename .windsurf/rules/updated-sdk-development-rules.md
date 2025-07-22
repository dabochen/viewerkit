---
trigger: always_on
description: ViewerKit Monorepo Development Rules - Concise version
globs:
---

# ViewerKit Monorepo Development Rules

## 1. Package Structure & Dependencies

### Packages
- **@viewerkit/sdk** (`packages/sdk/`): Backend/core functionality, NO React deps
- **@viewerkit/template-simple-react** (`packages/templates/simple-react/`): Universal React frontend + SDK integration
- **extensions/** (`extensions/*/`): VS Code extensions using template, never published

### Critical Dependency Flow
```
template-simple-react → @viewerkit/sdk
```
**Template is a React frontend built on top of the SDK backend. SDK must remain React-free.**

## 2. Import Rules

### SDK Package (@viewerkit/sdk)
- ✅ **ALLOWED**: @types/vscode, @types/node, Node.js built-ins
- ❌ **FORBIDDEN**: react, react-dom, @viewerkit/template-*

### Template (@viewerkit/template-simple-react)
- ✅ **REQUIRED**: @viewerkit/sdk, react ^18.0.0, react-dom ^18.0.0
- **PURPOSE**: Universal viewer implementation (configurable for different file types)
- **CONTAINS**: React components, hooks, UI elements, and SDK integration

## 3. Development Commands

```bash
# From root
pnpm install              # Install all dependencies
pnpm run build            # Build all packages
pnpm run dev              # Development mode

# Package-specific
pnpm -F @viewerkit/sdk dev        # SDK backend development
pnpm -F @viewerkit/template-simple-react dev  # Template frontend development
```

## 4. Feature Implementation

### New SDK Features
1. Create folder in `packages/sdk/src/features/`
2. Implement with `public.ts` export
3. Add to `packages/sdk/src/features/index.ts`
4. Create React wrapper in `packages/react/src/hooks/` if needed

### Template Enhancement
1. Enhance `packages/templates/simple-react/` with new features
2. Add configurable components for different file types
3. Import and use SDK functionality directly
4. Use CSS variables (`--vk-*`) for VS Code theme integration
5. Create demo extensions in `extensions/`

## 5. Backward Compatibility

### Migration Support
- **Old API**: `import { Features, Hooks, UI } from 'viewerkit'` (preserve during transition)
- **New API**: `import { fileOps } from '@viewerkit/sdk'` + `import { SimpleReactViewer } from '@viewerkit/template-simple-react'`
- **Versioning**: All packages start at v1.0.1
- **React Components**: Move existing hooks/UI from current src/ to template package

## 6. Critical Features to Preserve

- **Update Check API**: Supabase + HMAC auth in `packages/sdk/src/features/updateCheck/`
- **File Operations**: Universal API in `packages/sdk/src/features/fileOps/`
- **Theme Sync**: CSS variables in `packages/react/src/hooks/useTheme.ts`
- **Hot Reload**: 100ms debounce in SDK
- **Autosave**: 400ms debounce in SDK

## 7. Build & Bundle Rules

### Package.json Template
```json
{
  "name": "@viewerkit/{package-name}",
  "version": "1.0.1",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts"
}
```

### Bundle Limits
- SDK: <50KB gzipped (backend only)
- Templates: <200KB gzipped (includes React frontend)

## 8. Testing Requirements

- **Framework**: Vitest for all packages
- **Coverage**: >90% SDK core, >80% template components
- **Integration**: Test cross-package functionality
- **Compatibility**: Test old and new import patterns

## 9. Documentation Standards

- **JSDoc**: Every export needs description, @param, @returns
- **Examples**: Include @example for complex APIs
- **Deprecation**: Use @deprecated with migration path
- **README**: Purpose, installation, quick start, API reference

## 10. Development Protocol

### Code Changes
1. **Read related files** before making changes
2. **Respect package boundaries** - never violate import rules
3. **Maintain backward compatibility** - preserve existing APIs
4. **Test across packages** - ensure dependent packages work
5. **Update documentation** - keep README and API docs current

### AI Context Rules
- **SDK editing**: Focus on backend functionality, avoid React concepts
- **Template editing**: Build React frontend using SDK, focus on universal viewer UX
- **Extension editing**: Create VS Code extensions using template
- **Cross-package**: Template consumes SDK, extensions consume template

### Migration Checklist
- [ ] Create git tag `pre-monorepo-migration`
- [ ] Setup pnpm workspace + turbo.json
- [ ] Move core/features to packages/sdk
- [ ] Move hooks/ui to packages/templates/simple-react
- [ ] Preserve backward compatibility exports
- [ ] Test all functionality works
- [ ] Update documentation

## 11. Performance Targets

- **Build time**: <10s full build with Turbo
- **Hot reload**: <500ms across packages
- **Bundle size**: Within limits above
- **Test coverage**: Meet coverage targets

## General Rules

- Keep changes targeted and focused
- Always read related files before coding
- Update plan.md after each development phase
- Explain changes in non-technical terms
- Use TypeScript strict mode
- Follow horizontal scaling pattern
- Maintain consistent code style
