import React from 'react';

/**
 * CodeBlock — fenced code panel with a filename header and a Copy button that
 * flips to "Copied". Theme-aware (light/dark) via tokens.
 */
export function CodeBlock({ filename, code = '' }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try { navigator.clipboard.writeText(code); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div style={{ margin: '28px 0', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-surface)' }}>
      {filename && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 10px 8px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span>{filename}</span>
          <button onClick={copy} className="ds-tag-btn" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: copied ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'transparent', border: '1px solid ' + (copied ? 'var(--color-primary)' : 'var(--color-border)'), padding: '3px 9px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>{copied ? 'Copied' : 'Copy'}</button>
        </div>
      )}
      <pre style={{ margin: 0, padding: '18px 16px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.7, color: 'var(--color-text)', whiteSpace: 'pre' }}>{code}</pre>
    </div>
  );
}
