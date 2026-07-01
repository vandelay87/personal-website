import React from 'react';

/**
 * Link — inline/standalone text link. Inherits color, tints to accent on hover.
 * Optional directional icon that nudges on hover (the brand's signature micro-interaction).
 */
export function Link({
  href = '#',
  tone = 'inherit',        // 'inherit' | 'muted' | 'accent'
  icon = null,
  iconSide = 'right',      // 'left' | 'right'
  nudge = 'right',         // 'left' | 'right' | 'up-right' | 'none'
  onClick,
  children,
  style = {},
  ...rest
}) {
  const color = tone === 'muted' ? 'var(--color-text-muted)'
    : tone === 'accent' ? 'var(--color-primary)'
    : 'inherit';

  const cls = 'ds-link nudge-' + nudge;

  return (
    <a
      href={href}
      onClick={onClick}
      className={cls}
      style={{
        color,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        transition: 'color .25s ease',
        ...style,
      }}
      {...rest}
    >
      {icon && iconSide === 'left' && <span className="ds-link-ic">{icon}</span>}
      {children}
      {icon && iconSide === 'right' && <span className="ds-link-ic">{icon}</span>}
    </a>
  );
}
