import React from 'react';

/**
 * Card — generic rounded container: hairline border, optional surface fill,
 * optional hover wash (for clickable cards). The base box for recipe cards,
 * panels, callouts, dialogs.
 */
export function Card({
  as = 'div',
  fill = false,          // true → surface background, false → bg
  padding = 'var(--space-6)',
  radius = 'var(--radius-xl)',
  hover = false,         // subtle hover wash for interactive cards
  onClick,
  children,
  style = {},
}) {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      className={hover ? 'ds-card-hover' : undefined}
      style={{
        background: fill ? 'var(--color-surface)' : 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: radius,
        padding,
        transition: 'background .25s ease, border-color .25s ease',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
