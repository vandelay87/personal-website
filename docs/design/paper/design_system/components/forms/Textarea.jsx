import React from 'react';

/** Textarea — multi-line field; same styling language as Input. */
export function Textarea({ value, placeholder, rows = 3, disabled = false, onChange, style = {}, ...rest }) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows} disabled={disabled} onChange={onChange}
      className="ds-field"
      style={{
        width: '100%', fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: 1.6,
        color: 'var(--color-text-strong)', background: 'var(--color-field)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        padding: '12px 13px', outline: 'none', resize: 'vertical', minHeight: '84px',
        transition: 'border-color .18s ease, box-shadow .18s ease', ...style,
      }}
      {...rest}
    />
  );
}
