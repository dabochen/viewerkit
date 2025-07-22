"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownViewer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const marked_1 = require("marked");
const MarkdownViewer = () => {
    const [markdownContent, setMarkdownContent] = (0, react_1.useState)('');
    const [htmlContent, setHtmlContent] = (0, react_1.useState)('');
    const [fileName, setFileName] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Configure marked for better rendering
    marked_1.marked.setOptions({
        breaks: true,
        gfm: true,
    });
    // Handle messages from VS Code extension
    (0, react_1.useEffect)(() => {
        const messageHandler = (event) => {
            const message = event.data;
            switch (message.type) {
                case 'fileContent':
                    setMarkdownContent(message.content);
                    setFileName(message.fileName);
                    setLoading(false);
                    setError(null);
                    break;
                case 'error':
                    setError(message.message);
                    setLoading(false);
                    break;
            }
        };
        window.addEventListener('message', messageHandler);
        // Request initial file content
        if (window.vscode) {
            window.vscode.postMessage({ type: 'getFileContent' });
        }
        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, []);
    // Convert markdown to HTML when content changes
    (0, react_1.useEffect)(() => {
        if (markdownContent) {
            try {
                const html = (0, marked_1.marked)(markdownContent);
                setHtmlContent(html);
            }
            catch (err) {
                setError(`Failed to parse markdown: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
    }, [markdownContent]);
    // Apply VS Code theme styles
    const containerStyle = {
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
        fontFamily: 'var(--vscode-font-family)',
        fontSize: 'var(--vscode-font-size)',
        height: '100vh',
        overflow: 'auto',
        padding: '20px',
    };
    const headerStyle = {
        borderBottom: '1px solid var(--vscode-panel-border)',
        paddingBottom: '10px',
        marginBottom: '20px',
    };
    const markdownStyle = {
        maxWidth: '800px',
        margin: '0 auto',
        lineHeight: '1.6',
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { style: containerStyle, children: (0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: '50px' }, children: [(0, jsx_runtime_1.jsx)("h2", { children: "Loading..." }), (0, jsx_runtime_1.jsx)("p", { children: "Loading markdown file..." })] }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)("div", { style: containerStyle, children: (0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: '50px' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { color: 'var(--vscode-errorForeground)' }, children: "Error" }), (0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--vscode-errorForeground)' }, children: error })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: containerStyle, children: [(0, jsx_runtime_1.jsxs)("div", { style: headerStyle, children: [(0, jsx_runtime_1.jsx)("h1", { children: fileName || 'Markdown Viewer' }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, opacity: 0.7 }, children: "ViewerKit Extension Demo" })] }), (0, jsx_runtime_1.jsx)("div", { style: markdownStyle, className: "markdown-content", dangerouslySetInnerHTML: { __html: htmlContent } })] }));
};
exports.MarkdownViewer = MarkdownViewer;
//# sourceMappingURL=MarkdownViewer.js.map