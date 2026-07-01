import React from 'react';

/**
 * Button — the brand's primary action control.
 * Two form factors from the redesign: `pill` (public marketing CTAs) and
 * `rounded` (10px, admin/forms). Variants map to the warm-paper palette.
 */
export function Button({
  variant = 'solid',     // 'solid' | 'outline' | 'danger'
  shape = 'rounded',     // 'rounded' | 'pill'
  size = 'md',           // 'sm' | 'md'
  type = 'button',
  disabled = false,
  loading = false,
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  onClick,
  children,
  style = {},
}) {
  const pad = size === 'sm'
    ? (shape === 'pill' ? '8px 16px' : '8px 13px')
    : (shape === 'pill' ? '12px 24px' : '11px 16px');

  const base = {
    fontFamily: 'var(--font-sans)',
    fontSize: size === 'sm' ? '13px' : '14px',
    fontWeight: variant === 'outline' ? 500 : 600,
    lineHeight: 1.2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: pad,
    borderRadius: shape === 'pill' ? 'var(--radius-full)' : 'var(--radius-md)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity .2s ease, border-color .2s ease, color .2s ease, background .2s ease, transform .06s ease',
    whiteSpace: 'nowrap',
  };

  const variants = {
    solid:   { color: 'var(--color-btn-fg)', background: 'var(--color-btn-bg)', border: '1px solid var(--color-btn-bg)' },
    outline: { color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border-strong)' },
    danger:  { color: '#fff', background: 'var(--color-error)', border: '1px solid var(--color-error)' },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {loading && <Spinner />}
      {!loading && iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: '14px', height: '14px', borderRadius: '50%',
        border: '2px solid currentColor', borderTopColor: 'transparent',
        display: 'inline-block', animation: 'btn-spin .7s linear infinite',
      }}
    />
  );
}
