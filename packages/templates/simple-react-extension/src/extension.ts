import * as vscode from 'vscode';
import { MarkdownViewerProvider } from './MarkdownViewerProvider';

export function activate(context: vscode.ExtensionContext) {
    // Register the custom editor provider
    const provider = new MarkdownViewerProvider(context);
    const registration = vscode.window.registerCustomEditorProvider(
        'viewerkit.markdownViewer',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }
    );

    // Register the command to open with ViewerKit
    const openWithCommand = vscode.commands.registerCommand(
        'viewerkit.markdownViewer.openWith',
        (uri: vscode.Uri) => {
            vscode.commands.executeCommand('vscode.openWith', uri, 'viewerkit.markdownViewer');
        }
    );

    context.subscriptions.push(registration, openWithCommand);

    console.log('ViewerKit Markdown Viewer extension activated');
}

export function deactivate() {
    console.log('ViewerKit Markdown Viewer extension deactivated');
}
