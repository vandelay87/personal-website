import React from 'react';

/** Loading — centered spinner + label for whole-view loading states. */
export function Loading({ label = 'Loading…' }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'clamp(56px,10vw,110px) 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
      <span className="ds-spinner" aria-hidden="true" />
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
    </div>
  );
}
