import React from 'react';

/**
 * Toast — quiet dismissible notification (bottom-right stack). The whole pill
 * is the dismiss target; a faint ✕ appears on hover. Tone sets the icon dot.
 */
export function Toast({ tone = 'info', children, onDismiss }) {
  const tones = {
    success: { fg: 'var(--color-success)', dot: 'var(--color-success-bg)', icon: '\u2713' },
    error:   { fg: 'var(--color-error)',   dot: 'var(--color-error-bg)',   icon: '\u2715' },
    info:    { fg: 'var(--color-primary)', dot: 'color-mix(in srgb, var(--color-primary) 14%, transparent)', icon: '\u203a' },
  };
  const t = tones[tone] || tones.info;
  return (
    <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="ds-toast"
      style={{ display: 'flex', alignItems: 'center', gap: '11px', width: '100%', textAlign: 'left', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '12px 15px', boxShadow: 'var(--shadow-lg)', cursor: 'pointer', fontFamily: 'inherit' }}>
      <span aria-hidden="true" style={{ width: '18px', height: '18px', flexShrink: 0, borderRadius: '50%', background: t.dot, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', lineHeight: 1 }}>{t.icon}</span>
      <span style={{ fontSize: '13.5px', lineHeight: 1.45, color: 'var(--color-text)', flex: 1 }}>{children}</span>
      <span className="ds-toast-x" aria-hidden="true" style={{ flexShrink: 0, color: 'var(--color-text-faint)', fontSize: '12px', opacity: 0.5, transition: 'opacity .18s ease, color .18s ease' }}>\u2715</span>
    </button>
  );
}
