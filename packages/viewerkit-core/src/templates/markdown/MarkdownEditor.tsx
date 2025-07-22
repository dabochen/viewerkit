/**
 * Markdown-specific editor component (template-specific UI)
 */

import React, { useRef, useEffect } from 'react';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start typing your markdown...',
  className,
  style,
  onFocus,
  onBlur
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
      style={{
        width: '100%',
        minHeight: '400px',
        padding: '16px',
        border: '1px solid var(--vscode-input-border, #3c3c3c)',
        backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
        color: 'var(--vscode-input-foreground, #cccccc)',
        fontSize: '14px',
        fontFamily: 'var(--vscode-editor-font-family, "Consolas", "Courier New", monospace)',
        lineHeight: '1.5',
        resize: 'vertical',
        outline: 'none',
        borderRadius: '4px',
        ...style
      }}
    />
  );
}
