import React from 'react';

/**
 * Input — single-line text field with the brand's focus ring.
 * `invalid` switches the border/ring to error. `prefixIcon` for search etc.
 */
export function Input({
  type = 'text', value, placeholder, invalid = false, disabled = false,
  prefixIcon = null, suffix = null, onChange, onKeyDown, style = {}, ...rest
}) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {prefixIcon && (
        <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--color-text-faint)', pointerEvents: 'none' }}>{prefixIcon}</span>
      )}
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={onChange} onKeyDown={onKeyDown}
        className="ds-field"
        style={{
          width: '100%', fontFamily: 'var(--font-sans)', fontSize: '15px',
          color: 'var(--color-text-strong)', background: disabled ? 'var(--color-surface)' : 'var(--color-field)',
          border: '1px solid ' + (invalid ? 'var(--color-error)' : 'var(--color-border)'),
          borderRadius: 'var(--radius-md)',
          padding: '12px 13px', paddingLeft: prefixIcon ? '40px' : '13px', paddingRight: suffix ? '40px' : '13px',
          outline: 'none', transition: 'border-color .18s ease, box-shadow .18s ease', ...style,
        }}
        {...rest}
      />
      {suffix && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>{suffix}</span>}
    </div>
  );
}
