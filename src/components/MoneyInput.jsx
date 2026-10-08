import React, { useLayoutEffect, useRef } from 'react';

const MAX_DIGITS = 12;

/** "1234567" -> "1.234.567" (Colombian thousands separator). */
const formatThousands = (digits) =>
  String(digits ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Money field that shows thousands separators while typing (300.000) but keeps
 * `value` / `onChange` as plain digits ("300000"), which is what the API expects.
 */
export default function MoneyInput({ value, onChange, inputRef, className = '', placeholder, required, ...rest }) {
  const innerRef = useRef(null);
  const caretDigits = useRef(null);

  const setRefs = (el) => {
    innerRef.current = el;
    if (typeof inputRef === 'function') inputRef(el);
    else if (inputRef) inputRef.current = el;
  };

  const handleChange = (e) => {
    const el = e.target;
    const pos = el.selectionStart ?? el.value.length;
    caretDigits.current = el.value.slice(0, pos).replace(/\D/g, '').length;
    const raw = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITS);
    onChange(raw);
  };

  // After re-formatting, put the caret back after the same number of digits.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (caretDigits.current == null || !el || document.activeElement !== el) return;
    let seen = 0;
    let pos = 0;
    while (pos < el.value.length && seen < caretDigits.current) {
      if (/\d/.test(el.value[pos])) seen += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 pointer-events-none select-none">$</span>
      <input
        {...rest}
        ref={setRefs}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${className} pl-7`}
        placeholder={placeholder}
        required={required}
        value={formatThousands(value)}
        onChange={handleChange}
      />
    </div>
  );
}
