# ViewerKit SDK Release Plan

This file is used by AI tools like Cursor to guide the final release of the ViewerKit SDK. The SDK is already written in TypeScript and is working locally. Follow these steps in order.

---

## ✅ 1. Setup SDK for NPM

- Ensure `packages/viewerkit-sdk/package.json` exists and has:
  - `"name": "viewerkit"`
  - `"version": "1.0.0"`
  - `"main": "dist/index.js"`
  - `"types": "dist/index.d.ts"`
  - `"files": ["dist"]`
- Add `README.md` and `LICENSE` files
- Add `build` script using `tsc`
- Run `npm run build` to populate `dist/`

---

## ✅ 2. Add JSDoc Comments

- Go through all exported functions in `src/` and add `/** ... */` JSDoc comments
- Each function should describe:
  - What it does
  - Parameters and their types
  - What it returns

Example:
```ts
/**
 * Create a new slide.
 * @param title - Title of the slide
 * @returns ID of the created slide
 */
export function createSlide(title: string): string { ... }
```

---

## ✅ 3. Generate .d.ts Type Definitions

- Confirm that `tsconfig.json` includes:
```json
{
  "declaration": true,
  "emitDeclarationOnly": true,
  "outDir": "dist"
}
```
- Run `tsc` to generate the `.d.ts` files into `dist/`
- Confirm that `dist/index.d.ts` is created

---

## ✅ 4. Create CLI Tool to Scaffold Templates

> ⚠️ **Important:** Do not build the CLI inside the SDK project folder. The CLI tool is a separate project.

- Manually create a new folder at the root of your monorepo, e.g. `viewerkit-cli/`
- This folder will serve as a standalone CLI package that uses `viewerkit` as a dependency
- Inside the CLI project, install the SDK:
  ```bash
  npm install viewerkit
  ```
- The CLI will include multiple templates inside its own `templates/` folder (e.g. `slide-builder`, `dashboard`)
- Each template is a ready-to-develop project and should install the SDK from NPM
- See the CLI development guide for more details

---

## ✅ 5. Setup Typedoc to Generate API Docs

- Install: `npm install --save-dev typedoc`
- Add to `package.json`:
```json
"scripts": {
  "docs": "typedoc src/index.ts"
}
```
- Create a `typedoc.json`:
```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "includeVersion": true
}
```
- Run: `npm run docs`
- Confirm `docs/` folder contains HTML site

---

## ✅ 6. Publish the SDK

- Log in to NPM:
  ```bash
  npm login
  ```
- Navigate to the SDK root folder:
  ```bash
  cd packages/viewerkit-sdk
  ```
- Publish:
  ```bash
  npm publish --access public
  ```
- Verify:
  ```bash
  npm install viewerkit
  ```
  works in a brand-new empty project

---

## ✅ 7. Optional: Deploy Docs

- Optionally deploy the generated `docs/` folder from Typedoc to:
  - GitHub Pages (via `gh-pages`)
  - Vercel or Netlify
- Link the hosted docs from your SDK `README.md` for discoverability

---

## ✅ 8. Final Developer Experience Checklist

- [ ] `npm install viewerkit` works in any new project
- [ ] All exported functions have JSDoc comments
- [ ] `dist/index.d.ts` exists and works with autocomplete
- [ ] `README.md` has install and usage guide
- [ ] SDK is compatible with CLI-created templates
- [ ] CLI templates are correctly using the SDK from NPM
- [ ] Cursor and other AI tools pick up SDK types and docs properly

```ts
// Example usage inside template
import { createSlide } from 'viewerkit'
```

---
```bash
# SDK publishing flow
npm run build
npm run docs
npm publish --access public
```