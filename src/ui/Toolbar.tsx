import React, { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * Toolbar action configuration
 */
export interface ToolbarAction {
  /** Unique identifier for the action */
  id: string;
  /** Action label (for accessibility) */
  label: string;
  /** Icon name or React element */
  icon?: string | ReactNode;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Whether the action is active/pressed */
  active?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom CSS class */
  className?: string;
  /** Whether this action is a separator */
  separator?: boolean;
  /** Keyboard shortcut text (display only) */
  shortcut?: string;
}

/**
 * Toolbar group configuration
 */
export interface ToolbarGroup {
  /** Group identifier */
  id: string;
  /** Actions in this group */
  actions: ToolbarAction[];
  /** Group label (for accessibility) */
  label?: string;
}

/**
 * Props for Toolbar component
 */
export interface ToolbarProps {
  /** Toolbar actions or groups */
  actions?: ToolbarAction[];
  /** Grouped actions */
  groups?: ToolbarGroup[];
  /** Toolbar position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Whether to show labels alongside icons */
  showLabels?: boolean;
  /** Toolbar size */
  size?: 'small' | 'medium' | 'large';
  /** Whether the toolbar is compact */
  compact?: boolean;
  /** Custom content to render on the right side */
  rightContent?: ReactNode;
  /** Custom content to render on the left side */
  leftContent?: ReactNode;
  /** Whether to apply theme styling automatically */
  themed?: boolean;
}

/**
 * Props for ToolbarButton component
 */
interface ToolbarButtonProps {
  action: ToolbarAction;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  themed?: boolean;
}

/**
 * ToolbarButton Component
 * 
 * Individual button component used within toolbars
 */
function ToolbarButton({ 
  action, 
  showLabel = false, 
  size = 'medium',
  themed = true 
}: ToolbarButtonProps) {
  const { cssVariables } = useTheme({
    autoApply: false, // We'll apply manually for buttons
  });

  // Size configurations
  const sizeConfig = {
    small: { padding: '4px 8px', fontSize: '12px', iconSize: '14px' },
    medium: { padding: '6px 12px', fontSize: '14px', iconSize: '16px' },
    large: { padding: '8px 16px', fontSize: '16px', iconSize: '18px' },
  };

  const config = sizeConfig[size];

  // Button styles
  const buttonStyles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: showLabel ? '6px' : '0',
    padding: config.padding,
    border: 'none',
    borderRadius: '3px',
    cursor: action.disabled ? 'not-allowed' : 'pointer',
    fontSize: config.fontSize,
    fontFamily: 'var(--vscode-font-family)',
    backgroundColor: themed ? (
      action.active 
        ? cssVariables?.['--vk-active'] || 'var(--vscode-button-background)'
        : action.disabled
          ? 'transparent'
          : cssVariables?.['--vk-bg-secondary'] || 'var(--vscode-toolbar-hoverBackground)'
    ) : 'transparent',
    color: themed ? (
      action.disabled
        ? cssVariables?.['--vk-disabled'] || 'var(--vscode-disabledForeground)'
        : action.active
          ? cssVariables?.['--vk-bg-primary'] || 'var(--vscode-button-foreground)'
          : cssVariables?.['--vk-text-primary'] || 'var(--vscode-foreground)'
    ) : 'inherit',
    opacity: action.disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    minWidth: showLabel ? 'auto' : config.iconSize,
    height: `calc(${config.iconSize} + ${config.padding.split(' ')[0]} * 2)`,
  };

  // Hover styles (applied via CSS-in-JS)
  const hoverStyles = `
    .vk-toolbar-button:hover:not(:disabled) {
      background-color: ${cssVariables?.['--vk-hover'] || 'var(--vscode-toolbar-hoverBackground)'} !important;
    }
    
    .vk-toolbar-button:focus {
      outline: 2px solid ${cssVariables?.['--vk-focus'] || 'var(--vscode-focusBorder)'};
      outline-offset: 1px;
    }
    
    .vk-toolbar-button:active:not(:disabled) {
      transform: translateY(1px);
    }
  `;

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!action.disabled && action.onClick) {
        action.onClick();
      }
    }
  };

  // Render icon
  const renderIcon = () => {
    if (!action.icon) return null;

    if (typeof action.icon === 'string') {
      // VS Code icon font class
      return (
        <span 
          className={`codicon codicon-${action.icon}`}
          style={{ fontSize: config.iconSize }}
          aria-hidden="true"
        />
      );
    }

    // Custom React element
    return (
      <span style={{ fontSize: config.iconSize }} aria-hidden="true">
        {action.icon}
      </span>
    );
  };

  if (action.separator) {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)',
          margin: '0 4px',
        }}
      />
    );
  }

  return (
    <>
      <style>{hoverStyles}</style>
      <button
        className={`vk-toolbar-button ${action.className || ''}`}
        style={buttonStyles}
        onClick={action.onClick}
        disabled={action.disabled}
        title={action.tooltip || action.label}
        aria-label={action.label}
        aria-pressed={action.active}
        onKeyDown={handleKeyDown}
        type="button"
      >
        {renderIcon()}
        {showLabel && action.label && (
          <span style={{ whiteSpace: 'nowrap' }}>
            {action.label}
          </span>
        )}
        {action.shortcut && (
          <span 
            style={{
              marginLeft: 'auto',
              paddingLeft: '12px',
              fontSize: '11px',
              opacity: 0.7,
            }}
          >
            {action.shortcut}
          </span>
        )}
      </button>
    </>
  );
}

/**
 * Toolbar Component
 * 
 * A flexible toolbar component with theme integration, keyboard navigation,
 * and VS Code icon support. Supports both individual actions and grouped actions.
 * 
 * @example
 * ```tsx
 * const toolbarActions = [
 *   { id: 'save', label: 'Save', icon: 'save', onClick: () => save() },
 *   { id: 'sep1', separator: true },
 *   { id: 'undo', label: 'Undo', icon: 'arrow-left', onClick: () => undo() },
 *   { id: 'redo', label: 'Redo', icon: 'arrow-right', onClick: () => redo() },
 * ];
 * 
 * function MyEditor() {
 *   return (
 *     <div>
 *       <Toolbar 
 *         actions={toolbarActions} 
 *         size="medium"
 *         showLabels={false}
 *       />
 *       <div>Editor content...</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function Toolbar({
  actions = [],
  groups = [],
  position = 'top',
  className = '',
  style = {},
  showLabels = false,
  size = 'medium',
  compact = false,
  rightContent,
  leftContent,
  themed = true,
}: ToolbarProps) {
  const { cssVariables } = useTheme({
    autoApply: false,
  });

  // Toolbar orientation and positioning
  const isVertical = position === 'left' || position === 'right';
  const isHorizontal = !isVertical;

  // Base toolbar styles
  const toolbarStyles: CSSProperties = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: isHorizontal ? 'flex-start' : 'center',
    gap: compact ? '2px' : '4px',
    padding: compact ? '4px' : '8px',
    backgroundColor: themed
      ? cssVariables?.['--vk-bg-secondary'] || 'var(--vscode-editor-background)'
      : 'transparent',
    borderBottom: position === 'top' && themed
      ? `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}` 
      : 'none',
    borderTop: position === 'bottom' && themed
      ? `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}` 
      : 'none',
    borderRight: position === 'left' && themed
      ? `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}` 
      : 'none',
    borderLeft: position === 'right' && themed
      ? `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}` 
      : 'none',
    minHeight: isHorizontal ? 'auto' : '100%',
    minWidth: isVertical ? 'auto' : '100%',
    ...style,
  };

  // Render actions from groups or direct actions
  const renderActions = () => {
    if (groups.length > 0) {
      return groups.map((group, groupIndex) => (
        <div
          key={group.id}
          role="group"
          aria-label={group.label}
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: compact ? '1px' : '2px',
            ...(groupIndex > 0 && isHorizontal && {
              marginLeft: '8px',
              paddingLeft: '8px',
              borderLeft: `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}`
            }),
            ...(groupIndex > 0 && isVertical && {
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-panel-border)'}`
            }),
          }}
        >
          {group.actions.map((action) => (
            <ToolbarButton
              key={action.id}
              action={action}
              showLabel={showLabels}
              size={size}
              themed={themed}
            />
          ))}
        </div>
      ));
    }

    return actions.map((action) => (
      <ToolbarButton
        key={action.id}
        action={action}
        showLabel={showLabels}
        size={size}
        themed={themed}
      />
    ));
  };

  // Toolbar class names
  const toolbarClasses = [
    'vk-toolbar',
    `vk-toolbar-${position}`,
    `vk-toolbar-${size}`,
    compact ? 'vk-toolbar-compact' : '',
    isVertical ? 'vk-toolbar-vertical' : 'vk-toolbar-horizontal',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={toolbarClasses}
      style={toolbarStyles}
      role="toolbar"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
    >
      {leftContent && (
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
          {leftContent}
        </div>
      )}
      
      <div
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          gap: compact ? '2px' : '4px',
          flex: leftContent || rightContent ? 'none' : 1,
        }}
      >
        {renderActions()}
      </div>
      
      {rightContent && (
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          {rightContent}
        </div>
      )}
    </div>
  );
}

export default Toolbar; 