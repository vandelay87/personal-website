import React from 'react';

/**
 * RecipeCard — image-topped card for the recipe grid: cover photo, title,
 * one-line description, and a mono prep/cook/serves meta row.
 */
export function RecipeCard({ href = '#', img, title, desc, prep, cook, serves }) {
  return (
    <a href={href} className="ds-recipe-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-bg)' }}>
      <div style={{ aspectRatio: '3/2', background: 'var(--color-surface)', overflow: 'hidden' }}>
        {img && <img className="ds-recipe-img" src={img} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--color-text-strong)' }}>{title}</h3>
        <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0 }}>{desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-faint)' }}>
          {prep && <span>Prep: {prep}</span>}
          {cook && <span>Cook: {cook}</span>}
          {serves && <span>Serves: {serves}</span>}
        </div>
      </div>
    </a>
  );
}
