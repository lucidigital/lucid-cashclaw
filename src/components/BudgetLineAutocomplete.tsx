// ─── BudgetLineAutocomplete ────────────────────────────
// For Chi transactions: suggest budget lines by description
// Selecting one silently links budget_line_id; free text → overflow
import { useState, useRef, useEffect } from 'react';
import type { BudgetLine } from '../data/budgetData';
import './PersonAutocomplete.css'; // Reuse same dropdown styles

interface Props {
  value: string;                              // description text shown to user
  budgetLineId: string | undefined;           // internal ID (hidden from user)
  onChange: (desc: string, lineId?: string) => void; // callback with both values
  budgetLines: BudgetLine[];                  // filtered by project + person
  placeholder?: string;
  label?: string;
  required?: boolean;
  hint?: string;
}

const CAT_ICONS: Record<string, string> = {
  nhansu: '👥', freelance: '👤', ps_nhansu: '⚠️',
  chi_khac: '📋', chi_ung: '💸', tra_no: '🏦',
  thue: '📋', vanhanh: '🏢', khac: '📦',
};

export default function BudgetLineAutocomplete({
  value, budgetLineId, onChange, budgetLines, placeholder, label, required, hint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter budget lines by typed text
  const filtered = value.trim().length === 0
    ? budgetLines.slice(0, 8)
    : budgetLines.filter(bl =>
        bl.description?.toLowerCase().includes(value.toLowerCase()) ||
        bl.person?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);

  // Check if current value exactly matches a budget line
  const isLinked = !!budgetLineId;

  // Close on outside click
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

  function handleSelect(bl: BudgetLine) {
    onChange(bl.description || '', bl.id);
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
  }

  function handleFreeText(text: string) {
    // Free text → clear budget_line_id (goes to overflow)
    onChange(text, undefined);
    setOpen(true);
  }

  function handleClear() {
    onChange('', undefined);
    inputRef.current?.focus();
    setOpen(true);
  }

  const showDropdown = open && focused && (filtered.length > 0 || value.trim().length > 0);

  return (
    <div className={`pac-wrapper ${focused ? 'pac-focused' : ''}`} ref={containerRef}>
      {label && (
        <label className="form-label pac-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      <div className="pac-input-wrap">
        <span className="pac-icon">{isLinked ? '📋' : '✏️'}</span>
        <input
          ref={inputRef}
          className={`pac-input ${isLinked ? 'pac-input-linked' : ''}`}
          placeholder={placeholder || 'Mô tả hoặc chọn từ dự toán...'}
          value={value}
          autoComplete="off"
          onFocus={() => { setFocused(true); setOpen(true); }}
          onChange={e => handleFreeText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && filtered.length > 0 && open) {
              handleSelect(filtered[0]);
              e.preventDefault();
            }
          }}
        />
        {isLinked && (
          <span className="pac-linked-badge" title="Đã gắn vào dự toán chi">🔗</span>
        )}
        {value && (
          <button className="pac-clear" onClick={handleClear} type="button" tabIndex={-1}>✕</button>
        )}
      </div>

      {/* Linked indicator */}
      {isLinked && (
        <span className="form-hint pac-hint-linked">
          ✅ Gắn vào dự toán chi — sẽ được tính vào phần theo dõi
        </span>
      )}
      {!isLinked && value.trim().length > 0 && (
        <span className="form-hint pac-hint-overflow">
          ⚠️ Mô tả tự do — sẽ tính vào Chi phí phát sinh (overflow)
        </span>
      )}

      {showDropdown && (
        <div className="pac-dropdown">
          {/* Budget line suggestions */}
          {filtered.length > 0 && (
            <>
              <div className="pac-section-label">📋 Chọn từ dự toán chi</div>
              {filtered.map(bl => (
                <button
                  key={bl.id}
                  className="pac-option"
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(bl); }}
                >
                  <span className="pac-option-avatar" style={{ background: '#6c5ce7', fontSize: '0.8rem' }}>
                    {CAT_ICONS[bl.category] || '📋'}
                  </span>
                  <span className="pac-option-info">
                    <span className="pac-option-name">{bl.description || '(Không có mô tả)'}</span>
                    {bl.person && <span className="pac-option-role">👤 {bl.person}</span>}
                  </span>
                  <span className="pac-option-badge" style={{ color: '#a29bfe', background: 'rgba(108,92,231,0.15)' }}>
                    {new Intl.NumberFormat('vi-VN').format(bl.estimatedAmount)}đ
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Free text option */}
          {value.trim().length > 0 && (
            <button
              className="pac-option pac-option-custom"
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(value.trim(), undefined); setOpen(false); }}
            >
              <span className="pac-option-avatar" style={{ background: '#e17055' }}>⚠️</span>
              <span className="pac-option-info">
                <span className="pac-option-name">Dùng "{value.trim()}" (tự do)</span>
                <span className="pac-option-role">Sẽ tính vào Chi phí phát sinh</span>
              </span>
            </button>
          )}

          {filtered.length === 0 && value.trim().length === 0 && (
            <div className="pac-empty">Chưa có dự toán chi cho lựa chọn này</div>
          )}
        </div>
      )}

      {!isLinked && !value && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}
