import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

// value es lo que se guarda; label es lo que se muestra. Los cinco primeros mantienen
// su valor en inglés porque el resto de la app los traduce con CATEGORY_LABELS.
const PRESET_CATEGORIES = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Display', label: 'Pantalla' },
  { value: 'Networking', label: 'Redes' },
  { value: 'Server', label: 'Servidor' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Mobile', label: 'Móvil' },
  ...[
    'Computador de escritorio', 'Impresora', 'Escáner', 'Proyector', 'Televisor',
    'Teclado', 'Mouse', 'Cámara', 'Audio y Sonido', 'Micrófono', 'Almacenamiento',
    'Memoria USB', 'Disco duro', 'UPS / Energía', 'Cables y Conectores',
    'Accesorios', 'Herramientas', 'Mobiliario', 'Consola de videojuegos',
    'Wearable', 'Telefonía IP', 'Seguridad / CCTV',
  ].map(c => ({ value: c, label: c })),
];

// Opción especial: no se guarda, solo vacía el campo para que se escriba la categoría.
const OTHER = { value: '__other__', label: 'Otra (escribir)...' };

const labelOf = (options, v) => options.find(o => o.value === v)?.label ?? v;

export default function CategoryCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(PRESET_CATEGORIES);
  const [query, setQuery] = useState(labelOf(PRESET_CATEGORIES, value) || '');
  // Solo se filtra la lista mientras la persona escribe; al abrir se muestran todas.
  const [typed, setTyped] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setQuery(labelOf(options, value) || ''); }, [value, options]);

  // Suma las categorías personalizadas que ya existen en el inventario.
  useEffect(() => {
    let cancelled = false;
    api.getAssets().then(assets => {
      if (cancelled) return;
      const known = new Set(PRESET_CATEGORIES.map(o => o.value.toLowerCase()));
      const extra = [];
      for (const a of assets) {
        const c = (a.category || '').trim();
        if (c && !known.has(c.toLowerCase())) {
          known.add(c.toLowerCase());
          extra.push({ value: c, label: c });
        }
      }
      if (extra.length) setOptions([...PRESET_CATEGORIES, ...extra.sort((a, b) => a.label.localeCompare(b.label))]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = typed && q
    ? options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    : options;

  const isCustom = q && !options.some(o => o.label.toLowerCase() === q || o.value.toLowerCase() === q);

  function select(opt) {
    if (opt.value === OTHER.value) {
      onChange('');
      setQuery('');
      setTyped(true);
      setOpen(false);
      inputRef.current?.focus();
      return;
    }
    onChange(opt.value);
    setQuery(opt.label);
    setTyped(false);
    setOpen(false);
  }

  function handleInput(e) {
    setQuery(e.target.value);
    setTyped(true);
    onChange(e.target.value);
    setOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1 && typed) select(filtered[0]);
      else setOpen(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          required
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

      {open && (
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
            overflow: 'hidden auto',
            maxHeight: '260px',
            padding: '4px',
            listStyle: 'none',
            margin: 0,
          }}
        >
          {filtered.map(opt => {
            const selected = opt.value === value;
            return (
            <li
              key={opt.value}
              onMouseDown={() => select(opt)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '7px',
                cursor: 'pointer',
                color: selected ? '#7c3aed' : 'var(--text-primary, #1e293b)',
                fontWeight: selected ? '600' : '400',
                background: selected ? 'rgba(124, 58, 237,0.06)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124, 58, 237,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = selected ? 'rgba(124, 58, 237,0.06)' : 'transparent'; }}
            >
              {selected
                ? <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#7c3aed' }}>check</span>
                : <span style={{ width: '14px', display: 'inline-block' }} />}
              {opt.label}
            </li>
            );
          })}
          {!(typed && q) && (
            <li
              onMouseDown={e => { e.preventDefault(); select(OTHER); }}
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
                borderTop: '1px solid var(--border-light, #e2e8f0)',
                marginTop: '2px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#7c3aed' }}>edit</span>
              {OTHER.label}
            </li>
          )}
          {isCustom && (
            <li
              onMouseDown={() => select({ value: query.trim(), label: query.trim() })}
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
              Usar "{query.trim()}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
