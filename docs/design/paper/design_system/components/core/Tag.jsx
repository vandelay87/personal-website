import React from 'react';

/**
 * Tag — mono chip used for tech tags, recipe categories, and filters.
 * `removable` adds a ✕ (editor input); `active` is the selected filter state;
 * `as="button"` makes it an interactive filter chip.
 */
export function Tag({
  as = 'span',
  active = false,
  removable = false,
  onRemove,
  onClick,
  children,
  style = {},
}) {
  const Tag = as;
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.04em',
    padding: removable ? '5px 7px 5px 11px' : '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid ' + (active ? 'var(--color-primary)' : 'var(--color-border)'),
    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
    color: active ? '#fff' : 'var(--color-text-muted)',
    cursor: as === 'button' ? 'pointer' : 'default',
    transition: 'color .2s ease, border-color .2s ease, background .2s ease',
  };
  return (
    <Tag onClick={onClick} className={as === 'button' ? 'ds-tag-btn' : undefined} style={{ ...base, ...style }}>
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove(e); }}
          aria-label="Remove"
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: '1px', display: 'inline-flex' }}
        >✕</button>
      )}
    </Tag>
  );
}
