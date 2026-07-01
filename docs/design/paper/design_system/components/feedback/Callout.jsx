import React from 'react';

/**
 * Callout — inline note block inside articles. Three types, each with an emoji,
 * a colored uppercase label, and a matching tint. No accent-bar trope.
 */
export function Callout({ type = 'tip', children }) {
  const map = {
    tip:     { emoji: '\uD83D\uDCA1', label: 'Tip',     fg: 'var(--color-success)', tintC: '#1F8A5B' },
    warning: { emoji: '\u26A0\uFE0F', label: 'Warning', fg: 'var(--color-warning)', tintC: '#C2810C' },
    info:    { emoji: '\u2139\uFE0F', label: 'Info',    fg: 'var(--color-primary)', tintC: 'var(--color-primary)' },
  };
  const c = map[type] || map.tip;
  return (
    <div style={{ margin: '30px 0', border: '1px solid color-mix(in srgb, ' + c.tintC + ' 24%, var(--color-border))', background: 'color-mix(in srgb, ' + c.tintC + ' 6%, var(--color-surface))', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <span aria-hidden="true" style={{ fontSize: '17px', lineHeight: 1.5, flexShrink: 0 }}>{c.emoji}</span>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: c.fg, marginBottom: '7px' }}>{c.label}</div>
        <p style={{ fontSize: '15.5px', lineHeight: 1.65, color: 'var(--color-text)', margin: 0 }}>{children}</p>
      </div>
    </div>
  );
}
