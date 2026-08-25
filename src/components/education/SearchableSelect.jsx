import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  error = false,
  getLabel = (opt) => opt.label || opt.name,
  getValue = (opt) => opt.value ?? opt.id,
  getSubtitle = (opt) => opt.subtitle || opt.code || '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((opt) => String(getValue(opt)) === String(value ?? ''));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const label = String(getLabel(opt) || '').toLowerCase();
      const subtitle = String(getSubtitle(opt) || '').toLowerCase();
      return label.includes(q) || subtitle.includes(q);
    });
  }, [options, query, getLabel, getSubtitle]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`input flex items-center justify-between text-left ${error ? 'border-red-400' : ''} ${disabled ? 'bg-slate-50 text-slate-400' : ''}`}
      >
        <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected ? `${getLabel(selected)}${getSubtitle(selected) ? ` (${getSubtitle(selected)})` : ''}` : placeholder}
        </span>
        <span className="ml-2 flex items-center gap-1 text-slate-400">
          {selected && !disabled && (
            <X
              className="h-3.5 w-3.5 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronsUpDown className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              className="input pl-8"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-400">No matches found</li>
            )}
            {filtered.map((opt) => {
              const optValue = getValue(opt);
              const isSelected = String(optValue) === String(value ?? '');
              return (
                <li key={optValue}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(optValue);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${isSelected ? 'bg-brand-50 text-brand-700' : 'text-slate-700'}`}
                  >
                    <span>
                      <span className="block font-medium">{getLabel(opt)}</span>
                      {getSubtitle(opt) && <span className="block text-xs text-slate-400">{getSubtitle(opt)}</span>}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-brand-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
