import React from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownViewer } from './MarkdownViewer';
import './styles.css';

// Extend window interface for VS Code API
declare global {
  interface Window {
    vscode?: {
      postMessage: (message: any) => void;
    };
  }
}

// Initialize the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MarkdownViewer />);
}

// Notify VS Code that the webview is ready
if (window.vscode) {
  window.vscode.postMessage({ type: 'ready' });
}
