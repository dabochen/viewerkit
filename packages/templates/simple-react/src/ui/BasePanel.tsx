import React, { useEffect, useRef, ReactNode, CSSProperties } from 'react';
import { useTheme } from '../hooks/useTheme';
import { getDebugConsole } from '@viewerkit/sdk';

/**
 * Props for BasePanel component
 */
export interface BasePanelProps {
  /** Panel content */
  children: ReactNode;
  /** Panel title (displayed in header) */
  title?: string;
  /** Panel description or subtitle */
  subtitle?: string;
  /** Whether to show the header (default: true) */
  showHeader?: boolean;
  /** Whether to enable automatic state persistence (default: true) */
  persistState?: boolean;
  /** Custom CSS class for the panel */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Called when panel is initialized */
  onInit?: () => void;
  /** Called before panel unmounts */
  onDestroy?: () => void;
  /** Called when state is restored */
  onStateRestored?: (state: any) => void;
  /** Called when state is saved - should return the state to save */
  onStateSaved?: () => any;
  /** Custom content for the header */
  headerContent?: ReactNode;
  /** Whether to apply theme classes automatically (default: true) */
  applyThemeClasses?: boolean;
  /** Whether to apply theme CSS variables automatically (default: true) */
  applyThemeVariables?: boolean;
  /** Custom padding for content area */
  contentPadding?: string;
  /** Whether content should be scrollable (default: true) */
  scrollable?: boolean;
  /** Maximum height for the panel */
  maxHeight?: string;
  /** Whether to show loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Error state */
  error?: string | null;
  /** Error recovery action */
  onErrorRetry?: () => void;
}

/**
 * BasePanel Component
 * 
 * The foundation component for all ViewerKit panels. Provides automatic theme integration,
 * state persistence, consistent layout, and webview lifecycle management.
 * 
 * Features:
 * - Automatic VS Code theme synchronization
 * - State persistence across sessions
 * - Consistent styling and layout
 * - Error boundaries and loading states
 * - Accessible keyboard navigation
 * - Responsive design
 * 
 * @example
 * ```tsx
 * function MyPanel() {
 *   const [data, setData] = useState('');
 * 
 *   return (
 *     <BasePanel 
 *       title="My Editor"
 *       subtitle="Edit your configuration"
 *       persistState={true}
 *       onStateRestored={(state) => setData(state.content || '')}
 *       onStateSaved={() => ({ content: data })}
 *     >
 *       <textarea 
 *         value={data} 
 *         onChange={(e) => setData(e.target.value)}
 *         style={{ width: '100%', height: '300px' }}
 *       />
 *     </BasePanel>
 *   );
 * }
 * ```
 */
export function BasePanel({
  children,
  title,
  subtitle,
  showHeader = true,
  persistState = true,
  className = '',
  style = {},
  onInit,
  onDestroy,
  onStateRestored,
  onStateSaved,
  headerContent,
  applyThemeClasses = true,
  applyThemeVariables = true,
  contentPadding = '16px',
  scrollable = true,
  maxHeight,
  loading = false,
  loadingMessage = 'Loading...',
  error = null,
  onErrorRetry,
}: BasePanelProps) {
  // Theme integration
  const { 
    cssVariables, 
    isDark, 
    loading: themeLoading 
  } = useTheme({
    autoApply: applyThemeVariables,
    applyBodyClasses: applyThemeClasses,
  });

  // Refs for lifecycle management
  const panelRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Generate dynamic styles based on theme
  const panelStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '100vh',
    backgroundColor: cssVariables?.['--vk-bg-primary'] || 'var(--vscode-editor-background)',
    color: cssVariables?.['--vk-text-primary'] || 'var(--vscode-editor-foreground)',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: 'var(--vscode-font-size)',
    lineHeight: 'var(--vscode-font-line-height)',
    ...(maxHeight && { maxHeight }),
    ...style,
  };

  const headerStyles: CSSProperties = {
    flexShrink: 0,
    padding: '12px 16px',
    borderBottom: `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}`,
    backgroundColor: cssVariables?.['--vk-bg-secondary'] || 'var(--vscode-panel-background)',
  };

  const contentStyles: CSSProperties = {
    flex: 1,
    padding: contentPadding,
    ...(scrollable && { 
      overflow: 'auto',
      overscrollBehavior: 'contain',
    }),
  };

  const titleStyles: CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: cssVariables?.['--vk-text-primary'] || 'var(--vscode-foreground)',
  };

  const subtitleStyles: CSSProperties = {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: cssVariables?.['--vk-text-secondary'] || 'var(--vscode-descriptionForeground)',
  };

  // State persistence functions (simplified for webview context)
  const saveState = React.useCallback(() => {
    if (!persistState || !onStateSaved) return;

    try {
      const state = onStateSaved();
      if (state) {
        // Store in localStorage for webview persistence
        localStorage.setItem('vk-panel-state', JSON.stringify(state));
        getDebugConsole().logError('Panel state saved to localStorage');
      }
    } catch (saveError) {
      getDebugConsole().logError(
        saveError instanceof Error ? saveError : new Error(String(saveError)),
        'stateSave'
      );
    }
  }, [persistState, onStateSaved]);

  const restoreState = React.useCallback(() => {
    if (!persistState || !onStateRestored) return;

    try {
      const savedState = localStorage.getItem('vk-panel-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        onStateRestored(state);
        getDebugConsole().logError('Panel state restored from localStorage');
      }
    } catch (restoreError) {
      getDebugConsole().logError(
        restoreError instanceof Error ? restoreError : new Error(String(restoreError)),
        'stateRestore'
      );
    }
  }, [persistState, onStateRestored]);

  // Effect: Panel initialization
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;

      // Initialize state persistence
      if (persistState) {
        restoreState();
      }

      // Call initialization callback
      onInit?.();

      getDebugConsole().logError('BasePanel initialized');
    }
  }, [persistState, restoreState, onInit]);

  // Effect: Save state on unmount
  useEffect(() => {
    return () => {
      saveState();
      onDestroy?.();
      getDebugConsole().logError('BasePanel destroyed');
    };
  }, [saveState, onDestroy]);

  // Effect: Auto-save state periodically
  useEffect(() => {
    if (!persistState) return;

    const interval = setInterval(saveState, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [persistState, saveState]);

  // Effect: Save state on visibility change (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveState]);

  // Keyboard accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle panel-level keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          saveState();
          break;
        case 'r':
          if (onErrorRetry && error) {
            event.preventDefault();
            onErrorRetry();
          }
          break;
      }
    }
  };

  // Panel class names
  const panelClasses = [
    'vk-base-panel',
    isDark ? 'vk-theme-dark' : 'vk-theme-light',
    loading ? 'vk-loading' : '',
    error ? 'vk-error' : '',
    className,
  ].filter(Boolean).join(' ');

  // Loading state
  if (loading || themeLoading) {
    return (
      <div className={panelClasses} style={panelStyles}>
        {showHeader && (
          <header style={headerStyles}>
            <h1 style={titleStyles}>{title || 'Loading...'}</h1>
          </header>
        )}
        <div style={{ ...contentStyles, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              border: `3px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-progressBar-background)'}`,
              borderTop: `3px solid ${cssVariables?.['--vk-accent-primary'] || 'var(--vscode-progressBar-foreground)'}`,
              borderRadius: '50%',
              animation: 'vk-spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ 
              margin: 0, 
              color: cssVariables?.['--vk-text-secondary'] || 'var(--vscode-descriptionForeground)' 
            }}>
              {loadingMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={panelClasses} style={panelStyles}>
        {showHeader && (
          <header style={headerStyles}>
            <h1 style={titleStyles}>{title || 'Error'}</h1>
          </header>
        )}
        <div style={{ ...contentStyles, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              color: cssVariables?.['--vk-error'] || 'var(--vscode-errorForeground)',
            }}>
              ⚠️
            </div>
            <h2 style={{ 
              margin: '0 0 12px 0',
              color: cssVariables?.['--vk-error'] || 'var(--vscode-errorForeground)',
            }}>
              Something went wrong
            </h2>
            <p style={{ 
              margin: '0 0 20px 0',
              color: cssVariables?.['--vk-text-secondary'] || 'var(--vscode-descriptionForeground)',
            }}>
              {error}
            </p>
            {onErrorRetry && (
              <button
                onClick={onErrorRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: cssVariables?.['--vk-accent-primary'] || 'var(--vscode-button-background)',
                  color: cssVariables?.['--vk-bg-primary'] || 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Try Again (Ctrl+R)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal state
  return (
    <div 
      ref={panelRef}
      className={panelClasses}
      style={panelStyles}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="main"
      aria-label={title}
    >
      {showHeader && (
        <header style={headerStyles} role="banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {title && <h1 style={titleStyles}>{title}</h1>}
              {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
            </div>
            {headerContent && (
              <div style={{ flexShrink: 0 }}>
                {headerContent}
              </div>
            )}
          </div>
        </header>
      )}
      
      <main style={contentStyles} role="main">
        {children}
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes vk-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .vk-base-panel {
          --vk-transition: all 0.2s ease;
        }
        
        .vk-base-panel * {
          box-sizing: border-box;
        }
        
        .vk-base-panel:focus {
          outline: none;
        }
        
        .vk-base-panel button:focus {
          outline: 2px solid var(--vscode-focusBorder);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

export default BasePanel; 