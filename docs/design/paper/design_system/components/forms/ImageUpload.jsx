import React from 'react';

/**
 * ImageUpload — async image field with three states: empty (dropzone),
 * processing (shimmer + spinner), ready (preview + remove). Drives the
 * cover and step-image uploads in the editor.
 */
export function ImageUpload({ state = 'empty', url = '', label = 'Upload an image', hint = 'JPG, PNG or WebP', onUpload, onRemove, aspect = '16/9', height }) {
  if (state === 'processing') {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div className="ds-shimmer" style={{ aspectRatio: height ? undefined : aspect, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span className="ds-spinner" aria-hidden="true" />
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Processing image…</span>
        </div>
      </div>
    );
  }
  if (state === 'ready') {
    return (
      <div style={{ position: 'relative', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'inline-block', width: '100%' }}>
        <img src={url} alt="" style={{ display: 'block', width: '100%', aspectRatio: height ? undefined : aspect, height, objectFit: 'cover' }} />
        <button onClick={onRemove} aria-label="Remove image" className="ds-iconbtn-danger"
          style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>✕</button>
      </div>
    );
  }
  return (
    <div role="button" tabIndex={0} onClick={onUpload} className="ds-upload"
      style={{ border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'center' }}>
      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
      <span style={{ fontSize: '12.5px', color: 'var(--color-text-faint)' }}>{hint}</span>
    </div>
  );
}
