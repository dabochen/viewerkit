# [EXTENSION_NAME] Extension PRD (Template)

## 1. Project Context
- This project uses **ViewerKit toolkit** as the core framework for building file-based extensions in VS Code and compatible editors.
- ViewerKit provides APIs and React hooks for local file I/O, **Auto-Save**, **Hot Reload**, and **Conflict Resolution**.
- The current template is a working example extension located at `extensions/simple-react-extension/`, which demonstrates these features for a [DEFAULT_VIEWER] viewer.
- Your goal is to create a new extension in `[EXTENSION_FOLDER]` by replacing the template's default markdown viewer-specific code with your own [EXTENSION_NAME] logic, following the ViewerKit architecture.

## 2. Goal
Deliver an MVP **[EXTENSION_NAME] Extension** that lets a user open a local `[TARGET_FILE_TYPE]` file, view it as an editable [CONTENT_TYPE] in the WebView, and keep it in two-way sync with the Toolkit back-end.  
This will also establish the common UI skeleton for future extensions.

## 3. Core Functional Requirements
1. **[FUNCTIONALITY_1]** – [Describe functionality 1 here.]
2. **[FUNCTIONALITY_2]** – [Describe functionality 2 here.]
3. **[FUNCTIONALITY_3]** – [Describe functionality 3 here.]
4. **[FUNCTIONALITY_4]** – [Describe functionality 4 here.]
5. **[FUNCTIONALITY_5]** – [Describe functionality 5 here.]
6. **[FUNCTIONALITY_6]** – [Describe functionality 6 here.]
7. **[FUNCTIONALITY_7]** – [Describe functionality 7 here.]

## 4. UI / Layout
The interface is divided vertically into two sections:  
**Navbar** – a slim bar (about 30 px tall) across the top, showing the current file name on the left and a save-status indicator on the right, with other custom features.  
**Render Area** – fills all remaining space below the navbar and hosts the main [CONTENT_TYPE] component that presents and edits the content.  
All future extensions should follow this same “navbar above, content below” structure.

## 5. Technical Notes
- **Add dependency** if needed 
    pnpm add [REQUIRED_DEPENDENCY]  
    pnpm add -D [REQUIRED_DEPENDENCY_TYPES]

- **Suggested folder structure**
    [EXTENSION_FOLDER]/  
    ├─ src/  
    │  ├─ components/  
    │  │  ├─ [MAIN_COMPONENT].tsx  
    │  │  └─ Navbar.tsx  
    │  ├─ hooks/  
    │  ├─ index.tsx  
    │  └─ styles.css  
    └─ package.json  

- **Data flow**  
    • `[MAIN_COMPONENT]` accepts `[data, setData]`.  
    • `useAutoSave(data)` debounces disk writes.  
    • `useHotReload()` updates `setData` on external changes.  

- **Replace default viewer**  
    • Remove `MarkdownViewer.tsx` and related imports.  
    • Mount `[MAIN_COMPONENT]` in `index.tsx`.

- **⚠️ CRITICAL: VS Code API Injection**  
    • The webview HTML **MUST** include VS Code API injection script:  
    ```html
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        window.vscode = vscode;
    </script>
    ```
    • Without this, `window.vscode` will be undefined and file loading will fail.  
    • This script must be placed **before** the main bundle script in the HTML.

## 6. Non-Functional Requirements
- **Maintainability** – Clear layers, full TypeScript coverage.  
- **Testing** – At least unit-test that edits mutate state correctly.  
- **Documentation** – Update `README` with install / enable steps.

## 7. Milestones
- **M0** – Environment setup, remove default viewer code
- **M1** – Navbar + [MAIN_COMPONENT] components complete  
- **M2** – Integrate Toolkit hooks, end-to-end save/reload  
- **M3** – Status indicator & basic tests  
- **M4** – Code review & docs polish

## 8. Specific Instructions for Cursor AI (or other AI agent)
1. Read `extensions/simple-react-extension/**` to understand existing hooks (`useAutoSave`, `useHotReload`, etc.).  
2. In `[EXTENSION_FOLDER]`(if any core dependency is needed):  
   • Delete default viewer-related components and dependencies.  
   • Add [REQUIRED_DEPENDENCY] and wrap it in `[MAIN_COMPONENT].tsx`.

---

**Instructions(Remove this section before providing to AI):**
- Replace all placeholders in [ALL_CAPS] with your own extension-specific details.
- Expand or edit functional requirements as needed for your use case.
- This template is designed to help you prompt an AI coding assistant to generate a customized extension efficiently.
