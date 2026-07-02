import React, { useState, useRef, useEffect } from 'react';

const PRESET_CATEGORIES = [
  'Laptop',
  'Display',
  'Networking',
  'Server',
  'Tablet',
  'Mobile',
];

export default function CategoryCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = query
    ? PRESET_CATEGORIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : PRESET_CATEGORIES;

  const isCustom = query && !PRESET_CATEGORIES.some(c => c.toLowerCase() === query.toLowerCase());

  function select(cat) {
    onChange(cat);
    setQuery(cat);
    setOpen(false);
  }

  function handleInput(e) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' && filtered.length === 1) {
      select(filtered[0]);
      e.preventDefault();
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input-premium w-full px-3 py-2 text-[13px]"
          style={{ paddingRight: '32px' }}
          placeholder="Selecciona o escribe una categoría"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'absolute', right: '8px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '15px',
              color: '#94a3b8',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            expand_more
          </span>
        </button>
      </div>

      {open && (filtered.length > 0 || isCustom) && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0, right: 0,
            zIndex: 9999,
            background: 'var(--bg-card, #fff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            padding: '4px',
            listStyle: 'none',
            margin: 0,
          }}
        >
          {filtered.map(cat => (
            <li
              key={cat}
              onMouseDown={() => select(cat)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '7px',
                cursor: 'pointer',
                color: cat === value ? '#16a34a' : 'var(--text-primary, #1e293b)',
                fontWeight: cat === value ? '600' : '400',
                background: cat === value ? 'rgba(22,163,74,0.06)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = cat === value ? 'rgba(22,163,74,0.06)' : 'transparent'; }}
            >
              {cat === value
                ? <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#16a34a' }}>check</span>
                : <span style={{ width: '14px', display: 'inline-block' }} />}
              {cat}
            </li>
          ))}
          {isCustom && (
            <li
              onMouseDown={() => select(query)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '7px',
                cursor: 'pointer',
                color: '#7c3aed',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderTop: filtered.length > 0 ? '1px solid var(--border-light, #e2e8f0)' : 'none',
                marginTop: filtered.length > 0 ? '2px' : 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#7c3aed' }}>add</span>
              Usar "{query}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
