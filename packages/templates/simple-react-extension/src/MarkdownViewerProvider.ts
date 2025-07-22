import * as vscode from 'vscode';
import * as path from 'path';

export class MarkdownViewerProvider implements vscode.CustomTextEditorProvider {
    private isWebviewSaving = false; // Track when webview is saving to prevent feedback loop
    
    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'out'),
                vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui'),
            ],
        };

        // Set initial HTML content
        webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview, document.uri);

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'ready':
                        // Send initial file content when webview is ready
                        await this.sendFileContent(webviewPanel.webview, document);
                        break;
                    case 'save':
                        // Handle save requests from webview
                        this.isWebviewSaving = true;
                        await this.saveDocument(document, message.content);
                        // Reset flag after a short delay to allow document change event to process
                        setTimeout(() => {
                            this.isWebviewSaving = false;
                        }, 100);
                        break;
                    case 'getFileContent':
                        // Handle file content requests
                        await this.sendFileContent(webviewPanel.webview, document);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        // Listen for document changes (but ignore changes from webview saves)
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString() && !this.isWebviewSaving) {
                // Only send updates for external changes, not webview-initiated saves
                this.sendFileContent(webviewPanel.webview, document);
            }
        });

        // Clean up when webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private async sendFileContent(webview: vscode.Webview, document: vscode.TextDocument) {
        const content = document.getText();
        const filePath = document.uri.fsPath;
        
        webview.postMessage({
            type: 'update',
            content: content,
            filePath: filePath,
            fileName: path.basename(filePath)
        });
    }

    private async saveDocument(document: vscode.TextDocument, content: string) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );
        await vscode.workspace.applyEdit(edit);
    }

    private getWebviewContent(webview: vscode.Webview, fileUri: vscode.Uri): string {
        // Get the React bundle URI
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'bundle.js')
        );

        // Use a nonce to whitelist which scripts can be run
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <!-- CSS is injected by webpack style-loader -->
            <title>ViewerKit Markdown Viewer</title>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}">
                // Pass VS Code API to React app
                window.vscode = acquireVsCodeApi();
                window.initialFilePath = '${fileUri.fsPath}';
            </script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
