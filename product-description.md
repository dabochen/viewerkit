# ViewerKit 0.1 — SDK + Template Refactoring PRD  
*Version: 2025-07-09*

---

## 0 · Goals

1. **Minimal Mental Overhead** Install one npm package, import one namespace to access all capabilities.  
2. **Frontend-Backend Separation** SDK only provides reusable capabilities; scaffold templates handle "plug-and-play" extension projects.  
3. **Easy Horizontal Scaling** Adding new features = create new folder and export one line in `index.ts`.  
4. **Automated Publishing** Git tag → GitHub Actions → npm, zero manual operations.  
5. **Zero Dependency Hell** Host uses esbuild; Webview uses Vite (internal esbuild), no Webpack configuration needed.

---

## 1 · Repository Division

| Repository | Description | Publishing Channel |
|------|------|---------|
| **viewerkit-sdk** | Core / Features / React hooks & UI components | npm (`viewerkit`) |
| **viewerkit-cli** | One-line scaffold: `viewerkit create <name>` | npm (`viewerkit-cli`) |
| **viewerkit-template** | Starter template (cloned by CLI) | GitHub (no npm publishing needed) |

```bash
npx viewerkit create my-panel
cd my-panel && npm install
npm run dev        # VS Code panel hot reload
```

## 2 · SDK Directory Structure (viewerkit-sdk)

viewerkit-sdk/
└─ src/
   ├─ core/                    # Permanently stable foundation
   │   ├─ runtime/
   │   │   ├─ bridge.ts          # Message channel + Webview lifecycle
   │   │   └─ webviewState.ts    # State save / restore
   │   ├─ editorRegistry.ts      # Cross-editor registration
   │   ├─ diagnostics.ts         # Error & statistics
   │   └─ debugConsole.ts        # Debug panel
   │
   ├─ features/                # Horizontally scalable backend services
   │   ├─ hotReload/           # File watching (Feature ①)
   │   ├─ autosave/            # Debounced write-back (Feature ②)
   │   ├─ themeSync/           # Theme synchronization (Feature ⑤)
   │   ├─ parsers/             # YAML / Markdown (Feature ⑥)
   │   └─ new features/        # Each new features gets added into a new folder under /features
   │
   ├─ hooks/                   # React-friendly wrappers
   │   ├─ useWatchedFile.ts
   │   ├─ useAutosave.ts
   │   └─ index.ts
   │
   ├─ ui/                      # Universal visual components (Tailwind)
   │   ├─ BasePanel.tsx
   │   ├─ Toolbar.tsx
   │   └─ index.ts
   │
   └─ index.ts                 # ★ Single public entry point

### 1 · Hot-Reload File Watching
- **Goal** Watch files/dirs and push changes to the webview instantly.  
- **Implementation**  
  - Folder: `features/hotReload/`  
    - `host.ts` – `vscode.workspace.createFileSystemWatcher` with glob & ignore support.  
    - `web.ts` – relays updates to the bridge.  
    - 100 ms debounce; internal writes flagged to prevent loops.  
- **Public Surface**  
  - Service API: `hotReload(path, options?)` (`public.ts`).  
  - React hook: `useWatchedFile()` → `{ data, setData }`.  
  - Add `export * from "./features/hotReload/public"` in `src/index.ts`.

---

### 2 · Autosave (debounced write-back)
- **Goal** Persist edits back to disk automatically.  
- **Implementation**  `features/autosave/host.ts` with default 400 ms debounce.  
- **Public Surface**  
  - API: `autosave(path, content, debounceMs?)`.  
  - Hook: `useAutosave(data, path, debounceMs)`.

---

### 3 · Universal Editor Registration
- Registers Webview panels across VS Code, Cursor, Windsurf… from `package.json`.  
- File: `core/editorRegistry.ts` → `registerEditor(context, manifest)`; auto-called by SDK.

---

### 4 · BaseEditor Lifecycle + Message Bridge
- Unifies `postMessage` flow, error capture, panel mount/unmount.  
- Files: `core/runtime/bridge.ts`, `BasePanel` UI component.  
- Optional hook `useBridge()` for advanced cases.

---

### 5 · Theme Synchronisation
- Live CSS-variable injection on theme change.  
- Folder: `features/themeSync/` (host listener + web CSS patch).  
- Optional hook `useTheme()` returns `{ mode: 'light' | 'dark' | 'hc' }`.

---

### 6 · Universal File Operations
- **Goal**: Universal file I/O operations without format assumptions.  
- **Implementation**: Folder: `features/fileOps/` (replaces `parsers/`).  
- **Core Functions**:
  - `readFile(path)` → string content + metadata
  - `writeFile(path, content)` → success/error with stats  
  - `getFileInfo(path)` → size, encoding, line count, word count
  - `validateFile(path, validator)` → custom validation results
- **Philosophy**: Stay format-agnostic; let users bring their own JSON/YAML/Markdown libraries.
- **Exports**: `readFile`, `writeFile`, `getFileInfo`, `validateFile`.

---

### 7 · Diagnostics (errors & stats)
- Word-count, exception capture, emit to VS Code Problems panel.  
- File: `core/diagnostics.ts` → `reportDiagnostics(uri, stats)`; auto-invoked by `useWatchedFile()`.

---

### 8 · UI Toolkit
- Tailwind-powered React components (Toolbar, Button, BasePanel …).  
- Folder: `src/ui/`; barrel-exported via `ui/index.ts`; tree-shaken if not imported.

---

### 9 · State Persist/Restore
- Saves scroll, selection, etc. on unload; restores on reopen.  
- File: `core/runtime/webviewState.ts`; automatically wired into `BasePanel`.

---

### 10 · Debug Console (dev-only)
- Floating panel showing bridge traffic & FPS when `viewerkit.debugMode=true`.  
- File: `core/debugConsole.ts`; injected only in development builds, no public export.

### Unified Build & Exposure Rules

1. **Folder placement**  
   * Core utilities → `src/core/`  
   * Backend services → `src/features/<feature>/` (`host.ts`, `web.ts`, `public.ts`)  
   * React hooks → `src/hooks/`  
   * UI components → `src/ui/`

2. **Barrel export policy**  
   * Each local `index.ts` re-exports its directory’s public items.  
   * **Top-level** `src/index.ts` re-exports every public symbol; contains **no** logic.

3. **Tree-shaking**  
   * Heavy deps loaded via dynamic `import()`; not referenced → not bundled.

4. **Type safety**  
   * All public APIs are fully typed.  
   * `Message` union lives in `core/runtime/bridge.ts` and is reused everywhere.

5. **Code style**  
   * ESLint + Prettier (Airbnb TS preset).  
   * Tailwind classes must reference CSS variables (`--vk-*`) instead of hardcoded colors.


Build Commands
```bash
pnpm build          # tsup/esbuild → dist/{index.js,cjs,d.ts}
```

package.json excerpt
```jsonc
{
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "engines": { "node": ">=18" }
}
```

## 3 · CLI & Template

3.1 viewerkit-cli
```bash
npx viewerkit create my-project
```

CLI Workflow
	1.	git clone https://github.com/viewerkit/template <dirname>
	2.	Remove .git, modify package.json.name
	3.	npm install

3.2 viewerkit-template directory

my-project/
├─ src/                      # Host (esbuild)
│   └─ extension.ts
├─ webview-src/              # React (Vite)
│   ├─ App.tsx
│   └─ vite.config.ts
├─ tsconfig.json
├─ package.json              # Depends on "viewerkit": "^0.1.0"
└─ README.md


package.json key scripts

```jsonc
{
  "scripts": {
    "dev": "concurrently \"npm:dev:host\" \"npm:dev:web\"",
    "dev:host": "esbuild src/extension.ts --bundle --outfile=out/extension.js --watch",
    "dev:web": "vite",
    "build": "npm run build:host && npm run build:web",
    "build:host": "esbuild src/extension.ts --bundle --outfile=out/extension.js",
    "build:web": "vite build"
  }
}
```

## 4 · GitHub Actions (Automated SDK Publishing)

.github/workflows/publish.yml

```yaml
name: Publish SDK to npm
on:
  push:
    tags:
      - 'v*.*.*'
jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - run: pnpm install
      - run: pnpm build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 5 · Version Compatibility Strategy
	•	Don't easily delete/modify APIs. If changes are necessary:
	1.	Add /** @deprecated */ at original location pointing to new name
	2.	Keep for one minor version
	3.	Remove in next major version

## 6 · Runtime Version Requirements

```jsonc
"engines": { "vscode": "^1.85.0" }   // Cursor etc. all ≥1.85
"packageManager": "pnpm@8"
```
