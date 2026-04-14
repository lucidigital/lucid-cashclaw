// ─── PersonAutocomplete — Reusable autocomplete input ──
// Shows suggestions from the people list when user types
import { useState, useRef, useEffect } from 'react';
import { useData } from '../data/DataContext';
import { MOCK_PEOPLE, PEOPLE_TYPES } from '../data/mockData';
import './PersonAutocomplete.css';

const TYPE_MAP = Object.fromEntries(PEOPLE_TYPES.map(t => [t.code, t]));
const ALL_TYPE_CODES = PEOPLE_TYPES.map(t => t.code);

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  autoFocus?: boolean;
  id?: string;
  defaultFilterTypes?: string[]; // filter suggestions by person type
}

export default function PersonAutocomplete({
  value, onChange, placeholder, label, required, hint, autoFocus, id,
  defaultFilterTypes,
}: Props) {
  const { people: dbPeople } = useData();
  const people = dbPeople.length > 0 ? dbPeople : MOCK_PEOPLE;

  // Internal type filter — initialized from prop
  const [typeFilter, setTypeFilter] = useState<Set<string>>(
    () => new Set(defaultFilterTypes ?? ALL_TYPE_CODES)
  );

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter by typed value AND active type filter
  const isAllTypes = typeFilter.size >= ALL_TYPE_CODES.length;
  const byType = isAllTypes ? people : people.filter(p => typeFilter.has(p.type));
  const filtered = value.trim().length === 0
    ? byType.slice(0, 8)
    : byType.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase()) ||
        p.role?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
  }

  function handleClear() {
    onChange('');
    inputRef.current?.focus();
    setOpen(true);
  }

  const showDropdown = open && focused && filtered.length > 0;

  return (
    <div className={`pac-wrapper ${focused ? 'pac-focused' : ''}`} ref={containerRef}>
      {label && (
        <label className="form-label pac-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      <div className="pac-input-wrap">
        <span className="pac-icon">👤</span>
        <input
          ref={inputRef}
          id={id}
          className="pac-input"
          placeholder={placeholder || 'Partners & Staff...'}
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          onFocus={() => { setFocused(true); setOpen(true); }}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); }
            if (e.key === 'Enter' && filtered.length > 0 && open) {
              handleSelect(filtered[0].name);
              e.preventDefault();
            }
          }}
        />
        {value && (
          <button className="pac-clear" onClick={handleClear} type="button" tabIndex={-1}>✕</button>
        )}
      </div>

      {showDropdown && (
        <div className="pac-dropdown">
          {filtered.map(p => {
            const t = TYPE_MAP[p.type];
            return (
              <button
                key={p.id}
                className="pac-option"
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(p.name); }}
              >
                <span className="pac-option-avatar" style={{ background: t?.color || '#6c5ce7' }}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="pac-option-info">
                  <span className="pac-option-name">{p.name}</span>
                  {p.role && <span className="pac-option-role">{p.role}</span>}
                </span>
                <span className="pac-option-badge" style={{ color: t?.color, background: `${t?.color}20` }}>
                  {t?.icon} {t?.name}
                </span>
              </button>
            );
          })}
          {value.trim() && !people.some(p => p.name.toLowerCase() === value.toLowerCase()) && (
            <button className="pac-option pac-option-custom" type="button" onMouseDown={e => { e.preventDefault(); handleSelect(value.trim()); }}>
              <span className="pac-option-avatar" style={{ background: '#636e72' }}>+</span>
              <span className="pac-option-info">
                <span className="pac-option-name">Dùng "{value.trim()}"</span>
                <span className="pac-option-role">Ghi chú tự do</span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* Type filter pills */}
      <div className="pac-type-pills">
        {PEOPLE_TYPES.map(t => (
          <button
            key={t.code}
            type="button"
            className={`pac-type-pill ${typeFilter.has(t.code) ? 'active' : ''}`}
            style={typeFilter.has(t.code) ? { borderColor: t.color, color: t.color, background: `${t.color}15` } : {}}
            onMouseDown={e => {
              e.preventDefault();
              setTypeFilter(prev => {
                const next = new Set(prev);
                if (next.has(t.code)) next.delete(t.code); else next.add(t.code);
                return next;
              });
            }}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}
