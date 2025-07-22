# Test Markdown File

This is a test file to verify our ViewerKit template extension fixes.

## Features to Test

1. **Initial Load** - Should not show "unsaved changes" immediately
2. **Webview Editing** - Should not refresh DOM or lose cursor position
3. **External Editing** - Should handle external changes gracefully
4. **Autosave** - Should save after 400ms without triggering conflicts
5. **Conflict Resolution** - Should only show conflicts for genuine external changes

## Test Content

You can edit this content both in the webview and externally to test the conflict resolution.

- Edit in webview: Type here and watch for cursor preservation
- Edit externally: Open in another editor and modify
- Test autosave: Make changes and wait 400ms

The extension should handle all scenarios without unnecessary DOM refreshes or false conflict alerts.
