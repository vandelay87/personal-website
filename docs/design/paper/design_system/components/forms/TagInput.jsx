import React from 'react';
import { Tag } from '../core/Tag.jsx';

/**
 * TagInput — editor control: removable chips + a text field that adds on Enter,
 * with clickable suggestions drawn from existing tags.
 */
export function TagInput({ tags = [], suggestions = [], onAdd, onRemove, placeholder = 'Type a tag and press Enter' }) {
  const [draft, setDraft] = React.useState('');
  const commit = (v) => { const t = (v ?? draft).trim(); if (t) { onAdd && onAdd(t); setDraft(''); } };
  const avail = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map((t) => <Tag key={t} removable onRemove={() => onRemove && onRemove(t)}>{t}</Tag>)}
        </div>
      )}
      <input
        value={draft} placeholder={placeholder} className="ds-field"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        style={{ width: '100%', fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--color-text-strong)', background: 'var(--color-field)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 13px', outline: 'none' }}
      />
      {avail.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--color-text-faint)' }}>Suggestions:</span>
          {avail.slice(0, 6).map((s) => (
            <button key={s} onClick={() => commit(s)} className="ds-suggest"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', background: 'transparent', padding: '5px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
