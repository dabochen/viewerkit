"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const client_1 = require("react-dom/client");
const MarkdownViewer_1 = require("./MarkdownViewer");
require("./styles.css");
// Initialize the React app
const container = document.getElementById('root');
if (container) {
    const root = (0, client_1.createRoot)(container);
    root.render((0, jsx_runtime_1.jsx)(MarkdownViewer_1.MarkdownViewer, {}));
}
// Notify VS Code that the webview is ready
if (window.vscode) {
    window.vscode.postMessage({ type: 'ready' });
}
//# sourceMappingURL=index.js.map