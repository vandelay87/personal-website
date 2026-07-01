import React from 'react';

/**
 * AutosaveStatus — inline saving indicator for autosave forms.
 * States: saving (spinner) · saved (check + relative time) · error (retry).
 */
export function AutosaveStatus({ state = 'saved', savedLabel = 'Saved', onRetry }) {
  if (state === 'saving') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
      <span className="ds-spinner sm" aria-hidden="true" />
      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Saving…</span>
    </span>
  );
  if (state === 'error') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', width: '100%' }}>
      <span style={{ color: 'var(--color-error)', display: 'inline-flex' }} aria-hidden="true">&#9888;</span>
      <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>Couldn't save</span>
      <button onClick={onRetry} style={{ fontSize: '12.5px', color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, marginLeft: 'auto' }}>Retry</button>
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
      <span style={{ color: 'var(--color-success)', display: 'inline-flex' }} aria-hidden="true">&#10003;</span>
      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{savedLabel}</span>
    </span>
  );
}
