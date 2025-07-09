import React, { ReactNode, CSSProperties, forwardRef } from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * Button variants following VS Code design system
 */
export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'link' | 'danger';

/**
 * Button sizes
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for Button component
 */
export interface ButtonProps {
  /** Button content */
  children?: ReactNode;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Whether button is active/pressed */
  active?: boolean;
  /** Icon element or VS Code icon name */
  icon?: ReactNode | string;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Tooltip text */
  title?: string;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether to apply theme styling */
  themed?: boolean;
  /** Whether button takes full width */
  fullWidth?: boolean;
  /** Accessibility label */
  'aria-label'?: string;
  /** ARIA describedby */
  'aria-describedby'?: string;
  /** Tab index */
  tabIndex?: number;
}

/**
 * Button Component
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Integrates with VS Code theme system and supports icons, loading states,
 * and full accessibility features.
 * 
 * @example
 * ```tsx
 * function MyForm() {
 *   const [loading, setLoading] = useState(false);
 * 
 *   const handleSave = async () => {
 *     setLoading(true);
 *     try {
 *       await saveData();
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <Button 
 *         variant="primary" 
 *         icon="save" 
 *         loading={loading}
 *         onClick={handleSave}
 *       >
 *         Save Changes
 *       </Button>
 *       
 *       <Button variant="secondary" icon="x">
 *         Cancel
 *       </Button>
 *       
 *       <Button variant="icon" icon="refresh" title="Refresh" />
 *     </div>
 *   );
 * }
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'secondary',
  size = 'medium',
  disabled = false,
  loading = false,
  active = false,
  icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  style = {},
  title,
  onClick,
  themed = true,
  fullWidth = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  tabIndex,
  ...props
}, ref) => {
  const { cssVariables, isDark } = useTheme({
    autoApply: false,
  });

  // Size configurations
  const sizeConfigs = {
    small: {
      padding: '4px 8px',
      fontSize: '12px',
      height: '24px',
      iconSize: '14px',
    },
    medium: {
      padding: '6px 12px',
      fontSize: '13px',
      height: '28px',
      iconSize: '16px',
    },
    large: {
      padding: '8px 16px',
      fontSize: '14px',
      height: '32px',
      iconSize: '18px',
    },
  };

  const sizeConfig = sizeConfigs[size];

  // Variant-specific styles
  const getVariantStyles = (): CSSProperties => {
    if (!themed) {
      return {
        backgroundColor: 'transparent',
        color: 'inherit',
        border: '1px solid currentColor',
      };
    }

    const baseStyles = {
      border: 'none',
      borderRadius: '2px',
      fontWeight: 400,
      transition: 'all 0.2s ease',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: cssVariables?.['--vk-accent-primary'] || 'var(--vscode-button-background)',
          color: cssVariables?.['--vk-bg-primary'] || 'var(--vscode-button-foreground)',
          border: `1px solid ${cssVariables?.['--vk-accent-primary'] || 'var(--vscode-button-background)'}`,
        };

      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: cssVariables?.['--vk-bg-secondary'] || 'var(--vscode-button-secondaryBackground)',
          color: cssVariables?.['--vk-text-primary'] || 'var(--vscode-button-secondaryForeground)',
          border: `1px solid ${cssVariables?.['--vk-border-primary'] || 'var(--vscode-button-border)'}`,
        };

      case 'icon':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: cssVariables?.['--vk-text-primary'] || 'var(--vscode-foreground)',
          border: '1px solid transparent',
          padding: '4px',
          minWidth: sizeConfig.height,
          width: children ? 'auto' : sizeConfig.height,
        };

      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: cssVariables?.['--vk-accent-primary'] || 'var(--vscode-textLink-foreground)',
          border: 'none',
          textDecoration: 'none',
          padding: '2px 4px',
        };

      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: cssVariables?.['--vk-error'] || 'var(--vscode-button-background)',
          color: cssVariables?.['--vk-bg-primary'] || 'var(--vscode-button-foreground)',
          border: `1px solid ${cssVariables?.['--vk-error'] || 'var(--vscode-button-background)'}`,
        };

      default:
        return baseStyles;
    }
  };

  // Generate button styles
  const buttonStyles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon && children ? '6px' : '0',
    padding: variant === 'icon' ? '4px' : sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    height: sizeConfig.height,
    fontFamily: 'var(--vscode-font-family)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    outline: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ...(fullWidth && { width: '100%' }),
    ...getVariantStyles(),
    ...style,
  };

  // Hover and focus styles
  const getHoverStyles = () => {
    if (!themed || disabled || loading) return '';

    let hoverBg = '';
    let focusBorder = cssVariables?.['--vk-focus'] || 'var(--vscode-focusBorder)';

    switch (variant) {
      case 'primary':
        hoverBg = cssVariables?.['--vk-hover'] || 'var(--vscode-button-hoverBackground)';
        break;
      case 'secondary':
        hoverBg = cssVariables?.['--vk-hover'] || 'var(--vscode-button-secondaryHoverBackground)';
        break;
      case 'icon':
        hoverBg = cssVariables?.['--vk-hover'] || 'var(--vscode-toolbar-hoverBackground)';
        break;
      case 'link':
        hoverBg = 'transparent';
        break;
      case 'danger':
        hoverBg = cssVariables?.['--vk-hover'] || 'var(--vscode-button-hoverBackground)';
        break;
    }

    return `
      .vk-button:hover:not(:disabled) {
        background-color: ${hoverBg} !important;
        ${variant === 'link' ? 'text-decoration: underline;' : ''}
      }
      
      .vk-button:focus {
        outline: 2px solid ${focusBorder};
        outline-offset: 1px;
      }
      
      .vk-button:active:not(:disabled) {
        transform: translateY(1px);
      }
    `;
  };

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      return (
        <span 
          className={`codicon codicon-${icon}`}
          style={{ fontSize: sizeConfig.iconSize }}
          aria-hidden="true"
        />
      );
    }

    return (
      <span style={{ fontSize: sizeConfig.iconSize }} aria-hidden="true">
        {icon}
      </span>
    );
  };

  // Render loading spinner
  const renderSpinner = () => {
    if (!loading) return null;

    return (
      <span 
        style={{
          display: 'inline-block',
          width: sizeConfig.iconSize,
          height: sizeConfig.iconSize,
          border: `2px solid transparent`,
          borderTop: `2px solid currentColor`,
          borderRadius: '50%',
          animation: 'vk-spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
    );
  };

  // Content order based on icon position
  const renderContent = () => {
    const iconElement = loading ? renderSpinner() : renderIcon();
    
    if (iconPosition === 'right') {
      return (
        <>
          {children}
          {iconElement}
        </>
      );
    }

    return (
      <>
        {iconElement}
        {children}
      </>
    );
  };

  // Button class names
  const buttonClasses = [
    'vk-button',
    `vk-button-${variant}`,
    `vk-button-${size}`,
    active ? 'vk-button-active' : '',
    loading ? 'vk-button-loading' : '',
    fullWidth ? 'vk-button-full-width' : '',
    isDark ? 'vk-theme-dark' : 'vk-theme-light',
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <style>{getHoverStyles()}</style>
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        style={buttonStyles}
        disabled={disabled || loading}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-describedby={ariaDescribedBy}
        aria-pressed={active}
        tabIndex={tabIndex}
        {...props}
      >
        {renderContent()}
      </button>
    </>
  );
});

Button.displayName = 'Button';

/**
 * IconButton Component
 * 
 * A specialized button component for icon-only actions.
 * Convenience wrapper around Button with variant="icon".
 */
export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'children'> {
  /** Icon element or VS Code icon name */
  icon: ReactNode | string;
  /** Accessibility label (required for icon buttons) */
  'aria-label': string;
}

export function IconButton(props: IconButtonProps) {
  return <Button {...props} variant="icon" />;
}

/**
 * ButtonGroup Component
 * 
 * Groups multiple buttons together with consistent spacing and styling.
 */
export interface ButtonGroupProps {
  /** Button elements to group */
  children: ReactNode;
  /** Group orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether buttons are attached (no gap) */
  attached?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Group size (applied to all buttons) */
  size?: ButtonSize;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  attached = false,
  className = '',
  style = {},
  size,
}: ButtonGroupProps) {
  const groupStyles: CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: attached ? '0' : '8px',
    alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
    ...style,
  };

  const groupClasses = [
    'vk-button-group',
    `vk-button-group-${orientation}`,
    attached ? 'vk-button-group-attached' : '',
    className,
  ].filter(Boolean).join(' ');

  // Clone children to apply group properties
  const processedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === Button) {
      const isFirst = index === 0;
      const isLast = index === React.Children.count(children) - 1;
      
      let additionalStyles: CSSProperties = {};
      
      if (attached) {
        additionalStyles = {
          borderRadius: '0',
          ...(isFirst && { 
            borderTopLeftRadius: '2px',
            borderBottomLeftRadius: orientation === 'horizontal' ? '2px' : '0',
          }),
          ...(isLast && { 
            borderTopRightRadius: orientation === 'horizontal' ? '2px' : '0',
            borderBottomRightRadius: '2px',
          }),
          ...(orientation === 'horizontal' && !isLast && {
            borderRightWidth: '0',
          }),
          ...(orientation === 'vertical' && !isLast && {
            borderBottomWidth: '0',
          }),
        };
      }

      return React.cloneElement(child, {
        size: size || child.props.size,
        style: {
          ...child.props.style,
          ...additionalStyles,
        },
      } as Partial<ButtonProps>);
    }
    
    return child;
  });

  return (
    <div className={groupClasses} style={groupStyles} role="group">
      {processedChildren}
    </div>
  );
}

export default Button; 