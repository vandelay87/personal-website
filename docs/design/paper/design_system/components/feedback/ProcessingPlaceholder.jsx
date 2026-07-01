import React from 'react';

/**
 * ProcessingPlaceholder — shimmer block standing in for an image (or any asset)
 * that is still processing. Use while an upload finishes server-side.
 */
export function ProcessingPlaceholder({ aspect = '16/9', height, label = 'Processing…', small = false }) {
  return (
    <div className="ds-shimmer" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', aspectRatio: height ? undefined : aspect, height, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px' }}>
      <span className={small ? 'ds-spinner sm' : 'ds-spinner'} aria-hidden="true" />
      <span style={{ fontSize: small ? '12.5px' : '13px', color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
  );
}
