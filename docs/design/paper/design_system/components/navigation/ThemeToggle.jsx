import React from 'react';

/**
 * ThemeToggle — round icon button that flips light/dark. Persist the choice in
 * localStorage('akli-theme') and reflect it on a [data-theme] ancestor.
 */
export function ThemeToggle({ theme = 'light', onToggle }) {
  const dark = theme === 'dark';
  return (
    <button onClick={onToggle} className="ds-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ display: 'inline-flex', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--color-text-strong)', background: 'transparent', border: '1px solid var(--color-border-strong)', borderRadius: '50%', cursor: 'pointer', transition: 'background .2s ease, border-color .2s ease' }}>
      {dark ? '\u2600' : '\u263E'}
    </button>
  );
}
