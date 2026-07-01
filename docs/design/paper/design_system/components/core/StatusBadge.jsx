import React from 'react';

/**
 * StatusBadge — a small dot-pill for record state: draft/published,
 * confirmed/pending, etc. Tone drives the color; label is free text.
 */
export function StatusBadge({
  tone = 'neutral',     // 'success' | 'warning' | 'error' | 'neutral'
  children,
  dot = true,
  style = {},
}) {
  const tones = {
    success: { fg: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    warning: { fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    error:   { fg: 'var(--color-error)',   bg: 'var(--color-error-bg)' },
    neutral: { fg: 'var(--color-text-muted)', bg: 'var(--color-surface)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontFamily: 'var(--font-mono)', fontSize: '10.5px',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '4px 11px', borderRadius: 'var(--radius-full)',
      color: t.fg, background: t.bg, ...style,
    }}>
      {dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.fg }} />}
      {children}
    </span>
  );
}
