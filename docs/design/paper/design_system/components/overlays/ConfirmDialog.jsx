import React from 'react';

/**
 * ConfirmDialog — modal confirmation over a scrim. Optional danger icon and
 * destructive confirm button. Click-scrim and Cancel both dismiss.
 */
export function ConfirmDialog({
  open = true, title, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel,
}) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'color-mix(in srgb, #000 38%, transparent)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '430px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: '26px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {danger && (
            <span style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)', fontSize: '18px' }}>&#9888;</span>
          )}
          <h2 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
        </div>
        <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--color-text)', margin: '0 0 24px' }}>{children}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onCancel} style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', padding: '10px 16px', cursor: 'pointer' }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: danger ? '#fff' : 'var(--color-btn-fg)', background: danger ? 'var(--color-error)' : 'var(--color-btn-bg)', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px 16px', cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
