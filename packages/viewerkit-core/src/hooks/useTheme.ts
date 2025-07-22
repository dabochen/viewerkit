/**
 * React hook for VS Code theme integration
 */

import { useState, useEffect } from 'react';

export interface UseThemeReturn {
  cssVariables: Record<string, string>;
}

/**
 * Hook for accessing VS Code theme variables in webview
 */
export function useTheme(): UseThemeReturn {
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get CSS variables from VS Code
    const updateTheme = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const variables: Record<string, string> = {};
      
      // Common VS Code CSS variables
      const commonVars = [
        '--vscode-editor-background',
        '--vscode-editor-foreground',
        '--vscode-input-background',
        '--vscode-input-foreground',
        '--vscode-input-border',
        '--vscode-button-background',
        '--vscode-button-foreground',
        '--vscode-errorForeground',
        '--vscode-textSeparator-foreground'
      ];

      commonVars.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName);
        if (value) {
          variables[varName] = value;
        }
      });

      setCssVariables(variables);
    };

    updateTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => observer.disconnect();
  }, []);

  return { cssVariables };
}
