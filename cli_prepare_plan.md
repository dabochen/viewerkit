# ViewerKit SDK Release Plan

This file is used by AI tools like Cursor to guide the final release of the ViewerKit SDK. The SDK is already written in TypeScript and is working locally. Follow these steps in order.

---

## ✅ 1. Setup SDK for NPM

- Ensure `packages/viewerkit-sdk/package.json` exists and has:
  - `"name": "@viewerkit/sdk"`
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

## ✅ 4. Create CLI Tool to Scaffold Template

- Create `cli/` folder with a file `cli/index.ts`
- Use `commander` or `prompts` to ask for:
  - Project name
  - License key (optional)
- Validate license with a mock API (for now)
- Copy a template from `templates/slide-builder/` into the target folder
- Install SDK via `npm install @viewerkit/sdk` inside the new project

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

- Log in to NPM: `npm login`
- Run: `npm publish --access public` inside `packages/viewerkit-sdk/`
- Verify: `npm install @viewerkit/sdk` works in a new project

---

## ✅ 7. Optional: Deploy Docs

- Optionally deploy `docs/` folder (from Typedoc) to:
  - GitHub Pages
  - Vercel or Netlify
- Link it from your SDK README

---

## ✅ 8. Final Developer Experience Checklist

- Confirm `npm install @viewerkit/sdk` works
- Confirm AI (Cursor, Copilot) shows autocomplete + function docs
- Confirm README has full install + usage guide
- Confirm CLI works and creates a new project