import React from 'react';
import { ThemeToggle } from './ThemeToggle.jsx';

/**
 * Header — the site shell's top bar. One component for both surfaces:
 *  • variant="public" — brand + nav links + theme toggle.
 *  • variant="admin"  — brand + nav links + signed-in email + Log out + toggle.
 * Sticky + translucent-blur by default (the brand's header treatment).
 */
export function Header({
  variant = 'public',
  brand = 'Akli Aissat',
  brandHref = '/',
  links = [],            // [{ label, href, active }]
  sticky = true,
  email,                 // admin: signed-in address
  onLogout,              // admin: Log out handler
  theme = 'light',
  onToggle,
}) {
  return (
    <header className={sticky ? 'ds-header ds-header-sticky' : 'ds-header'}
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: 'var(--max-w-site)', margin: '0 auto', padding: '18px clamp(20px,5vw,28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(18px,4vw,30px)' }}>
          <a className="ds-link" href={brandHref} style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-text-strong)', textDecoration: 'none' }}>{brand}</a>
          <nav aria-label={variant === 'admin' ? 'Admin' : 'Primary'} style={{ display: 'flex', alignItems: 'center', gap: variant === 'admin' ? '22px' : 'clamp(18px,4vw,28px)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {links.map((l) => (
              <a key={l.href + l.label} className="ds-link" href={l.href}
                aria-current={l.active ? 'page' : undefined}
                style={l.active ? { color: 'var(--color-text-strong)', fontWeight: 500, textDecoration: 'none' } : { color: 'inherit', textDecoration: 'none' }}>{l.label}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {variant === 'admin' && email && <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{email}</span>}
          {variant === 'admin' && onLogout && (
            <button onClick={onLogout} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', padding: '7px 13px', cursor: 'pointer' }}>Log out</button>
          )}
          {onToggle && <ThemeToggle theme={theme} onToggle={onToggle} />}
        </div>
      </div>
    </header>
  );
}
