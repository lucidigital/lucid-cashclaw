import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES_CHI, CATEGORIES_THU, formatVND, formatFullVND, getStatusLabel } from '../data/mockData';
import { type BudgetLine } from '../data/budgetData';
import { useData } from '../data/DataContext';
import PersonAutocomplete from '../components/PersonAutocomplete';
import './BudgetForecast.css';

const ALL_CATS = [...CATEGORIES_THU, ...CATEGORIES_CHI];
const catMap = Object.fromEntries(ALL_CATS.map(c => [c.code, c]));

const STATUS_ORDER = ['in_progress', 'review', 'completed'] as const;
const STATUS_LABELS: Record<string, string> = {
  in_progress: '🟡 Đang làm',
  review: '🟠 Review',
  completed: '🟢 Hoàn thành',
};

import type { Project } from '../data/mockData';

function getGroupedProjects(allProjects: Project[], search: string) {
  const q = search.toLowerCase();
  const filtered = allProjects.filter(p =>
    p.status !== 'archived' &&
    (!q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
  );
  const groups: { status: string; label: string; projects: Project[] }[] = [];
  for (const status of STATUS_ORDER) {
    const projects = filtered.filter(p => p.status === status);
    if (projects.length > 0) groups.push({ status, label: STATUS_LABELS[status] || status, projects });
  }
  return groups;
}

const budgetStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: '⏳ Chưa phát sinh', color: 'var(--text-muted)', bg: 'rgba(107, 109, 138, 0.1)' },
  partial: { label: '🔄 Đang thực hiện', color: 'var(--color-info)', bg: 'rgba(116, 185, 255, 0.1)' },
  done:    { label: '✅ Hoàn thành', color: 'var(--color-income)', bg: 'rgba(0, 184, 148, 0.1)' },
  over:    { label: '🔴 Vượt dự toán', color: 'var(--color-danger)', bg: 'rgba(214, 48, 49, 0.1)' },
};

function parseAmount(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/,/g, '');
  if (s.endsWith('ty') || s.endsWith('tỷ')) return parseFloat(s) * 1_000_000_000;
  if (s.endsWith('tr')) return parseFloat(s) * 1_000_000;
  if (s.endsWith('k')) return parseFloat(s) * 1_000;
  // If plain number (no suffix), treat as triệu (matching the UI label)
  const num = parseFloat(s.replace(/\./g, ''));
  return isNaN(num) ? 0 : num * 1_000_000;
}

export default function BudgetForecast() {
  const { projects, transactions, phatSinhs, budgetLines, addBudgetLine, updateBudgetLine, deleteBudgetLine } = useData();
  const defaultProject = projects.find(p => p.status === 'in_progress');
  const [activeProject, setActiveProject] = useState(defaultProject?.id || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<'thu' | 'chi'>('chi');
  const [formCat, setFormCat] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEstimated, setFormEstimated] = useState('');
  const [formActual, setFormActual] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formStatus, setFormStatus] = useState<BudgetLine['status']>('planned');
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNote, setFormNote] = useState('');

  const project = projects.find(p => p.id === activeProject);
  const projectLines = budgetLines.filter(b => b.projectId === activeProject);
  const hasBudgetLines = projectLines.length > 0;
  const groups = getGroupedProjects(projects, dropdownSearch);

  // Compute summary from local state
  const summary = (() => {
    const thuLines = projectLines.filter(b => b.type === 'thu');
    const chiLines = projectLines.filter(b => b.type === 'chi');
    const estThu = thuLines.reduce((s, b) => s + b.estimatedAmount, 0);
    const actThu = thuLines.reduce((s, b) => s + b.actualAmount, 0);
    const estChi = chiLines.reduce((s, b) => s + b.estimatedAmount, 0);
    const actChi = chiLines.reduce((s, b) => s + b.actualAmount, 0);
    return { thuLines, chiLines, estThu, actThu, estChi, actChi, estProfit: estThu - estChi, actProfit: actThu - actChi, variance: actChi - estChi };
  })();

  const currentCategories = formType === 'thu' ? CATEGORIES_THU : CATEGORIES_CHI;

  // Dropdown outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false); setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (dropdownOpen && searchRef.current) searchRef.current.focus();
  }, [dropdownOpen]);

  function selectProject(id: string) {
    setActiveProject(id); setDropdownOpen(false); setDropdownSearch('');
  }

  // ─── Form helpers ─────────────────────────────────
  function resetForm() {
    setFormType('chi'); setFormCat(''); setFormDesc('');
    setFormEstimated(''); setFormActual(''); setFormPerson('');
    setFormStatus('planned'); setFormExpectedDate(''); setFormNote('');
    setEditingId(null); setShowDeleteConfirm(false);
  }

  function openNew(type: 'thu' | 'chi') {
    resetForm();
    setFormType(type);
    setShowModal(true);
  }

  function openEdit(line: BudgetLine) {
    setEditingId(line.id);
    setFormType(line.type);
    setFormCat(line.category);
    setFormDesc(line.description);
    setFormPerson(line.person || '');
    setFormEstimated(String(line.estimatedAmount / 1_000_000));
    setFormActual(line.actualAmount > 0 ? String(line.actualAmount / 1_000_000) : '');
    setFormStatus(line.status);
    setFormExpectedDate(line.expectedDate || '');
    setFormNote(line.note || '');
    setShowDeleteConfirm(false);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const estimated = parseAmount(formEstimated);
    if (estimated <= 0) return;

    const lineData = {
      projectId: activeProject,
      person: formPerson || undefined,
      type: formType as 'thu' | 'chi',
      category: formCat || (formType === 'chi' ? 'khac' : 'thu_khac'),
      description: formDesc || `Dự toán ${formType === 'thu' ? 'thu' : 'chi'}`,
      estimatedAmount: estimated,
      actualAmount: parseAmount(formActual),
      status: formStatus as BudgetLine['status'],
      expectedDate: formExpectedDate || undefined,
      note: formNote || undefined,
    };

    if (editingId) {
      updateBudgetLine(editingId, lineData);
    } else {
      addBudgetLine(lineData);
    }
    setShowModal(false);
    resetForm();
  }

  function handleDelete() {
    if (editingId) {
      deleteBudgetLine(editingId);
      setShowModal(false);
      resetForm();
    }
  }

  // ─── Render Thu Table (original layout, label tweak) ──
  function renderThuTable(lines: BudgetLine[]) {
    const totEst = lines.reduce((s, b) => s + b.estimatedAmount, 0);
    const totAct = lines.reduce((s, b) => s + b.actualAmount, 0);
    const totDiff = totAct - totEst;

    return (
      <div className="card budget-table-card">
        <div className="budget-section-header">
          <h3 className="budget-section-title">
            <span className="section-icon thu">📥</span>
            Dự toán thu — {project?.name}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => openNew('thu')}>
            ＋ Thêm
          </button>
        </div>
        <div className="budget-table">
          <div className="budget-thead budget-thu-row">
            <span>Danh mục</span><span>Mô tả</span>
            <span>Ngày dự kiến</span>
            <span className="bt-right">Dự toán</span><span className="bt-right">Đã thu</span>
            <span className="bt-right">Chênh lệch</span><span>Trạng thái</span>
          </div>
          {lines.map(line => {
            const cat = catMap[line.category];
            const diff = line.actualAmount - line.estimatedAmount;
            return (
              <div key={line.id} className={`budget-trow budget-thu-row ${line.status}`} onClick={() => openEdit(line)}>
                <span className="bt-cat">{cat?.icon || '📋'} {cat?.name || line.category}</span>
                <span className="bt-desc">
                  {line.description}
                  {line.note && <span className="bt-note">💬 {line.note}</span>}
                </span>
                <span className="bt-date">
                  {line.expectedDate
                    ? (() => {
                        const d = new Date(line.expectedDate);
                        const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
                        return (
                          <>
                            <span style={{ display: 'block', fontWeight: 600 }}>
                              {d.toLocaleDateString('vi', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: diff < 0 ? 'var(--color-danger)' : diff <= 7 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                              {diff < 0 ? `⚠️ quá ${Math.abs(diff)}ng` : diff === 0 ? '📌 Hôm nay' : `📌 ${diff} ngày`}
                            </span>
                          </>
                        );
                      })()
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </span>
                <span className="bt-amount bt-right">{formatVND(line.estimatedAmount)}</span>
                <span className={`bt-amount bt-right ${line.actualAmount > 0 ? 'text-income' : ''}`}>
                  {line.actualAmount > 0 ? formatVND(line.actualAmount) : '—'}
                </span>
                <span className={`bt-diff bt-right ${diff > 0 ? 'text-income' : diff < 0 ? 'text-expense' : ''}`}>
                  {diff !== 0 ? `${diff > 0 ? '+' : ''}${formatVND(diff)}` : '—'}
                </span>
                <span className="bt-status" style={{ color: budgetStatusConfig[line.status]?.color, background: budgetStatusConfig[line.status]?.bg }}>
                  {budgetStatusConfig[line.status]?.label || line.status}
                </span>
              </div>
            );
          })}

          {lines.length > 0 && (
            <div className="budget-trow budget-thu-row budget-total-row">
              <span className="bt-cat" style={{ fontWeight: 800 }}>Tổng cộng</span>
              <span></span>
              <span></span>
              <span className="bt-amount bt-right" style={{ fontWeight: 800 }}>{formatVND(totEst)}</span>
              <span className="bt-amount bt-right text-income" style={{ fontWeight: 800 }}>{formatVND(totAct)}</span>
              <span className={`bt-diff bt-right ${totDiff > 0 ? 'text-income' : 'text-danger'}`} style={{ fontWeight: 800 }}>
                {totDiff !== 0 ? `${totDiff > 0 ? '+' : ''}${formatVND(totDiff)}` : '—'}
              </span>
              <span></span>
            </div>
          )}

          {lines.length === 0 && (
            <div className="budget-table-empty">
              Chưa có dòng dự toán thu
              <button className="btn btn-ghost btn-sm" onClick={() => openNew('thu')} style={{ marginLeft: 12 }}>＋ Thêm</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render Chi Table (per-person layout) ─────────
  function renderChiTable(lines: BudgetLine[]) {
    // Only exclude purely financial categories — tra_no with project IS project expense
    const NON_PROJECT_CATS = ['vay_ung', 'chi_ung', 'thu_ung'];

    // Compute per-line data with auto-computed paid amounts
    const lineData = lines.map(line => {
      const cat = catMap[line.category];
      // PS categories = phát sinh, should NEVER be credited to a budget line
      const PS_CATS = ['ps_nhansu', 'ps_thu'];
      // Auto-compute "đã trả": prioritize budget_line_id match, fallback to person match
      const paidByLineId = transactions
        .filter(t => t.budgetLineId === line.id && t.type === 'chi' && !NON_PROJECT_CATS.includes(t.category))
        .reduce((s, t) => s + t.amount, 0);
      const paidByPerson = line.person
        ? transactions
            .filter(t =>
              t.projectId === activeProject &&
              t.person === line.person &&
              t.type === 'chi' &&
              !NON_PROJECT_CATS.includes(t.category) &&
              !PS_CATS.includes(t.category) &&  // ← loại trừ phát sinh
              !t.budgetLineId
            )
            .reduce((s, t) => s + t.amount, 0)
        : 0;
      // Use lineId-matched first; if none, fallback to person-match (for legacy data)
      const paid = paidByLineId > 0 ? paidByLineId : (paidByPerson || line.actualAmount);
      // Phát sinh for this person + project
      const ps = line.person
        ? phatSinhs
            .filter(p => p.projectId === activeProject && p.person === line.person)
            .reduce((s, p) => s + p.amount, 0)
        : 0;
      const totalContract = line.estimatedAmount + ps;
      const outstanding = totalContract - paid;
      const pct = totalContract > 0 ? Math.round((paid / totalContract) * 100) : 0;
      return { ...line, cat, paid, ps, totalContract, outstanding, pct };
    });

    // ── Overflow row: chi thực tế vượt ngoài dự toán ────────
    const totEst       = lineData.reduce((s, d) => s + d.estimatedAmount, 0);
    const totPS        = lineData.reduce((s, d) => s + d.ps, 0);
    const totContract  = lineData.reduce((s, d) => s + d.totalContract, 0);
    const totPaidLines = lineData.reduce((s, d) => s + d.paid, 0);

    const totalActualChi = transactions
      .filter(t => t.projectId === activeProject && t.type === 'chi' && !NON_PROJECT_CATS.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);

    // Overflow = max(0, tổng thực tế - tổng dự toán)
    const overflowPaid = Math.max(0, totalActualChi - totEst);
    const hasOverflow  = overflowPaid > 0;
    const grandTotOutstanding = totContract - totPaidLines;

    return (
      <div className="card budget-table-card">
        <div className="budget-section-header">
          <h3 className="budget-section-title">
            <span className="section-icon chi">📤</span>
            Dự toán chi — {project?.name}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => openNew('chi')}>
            ＋ Thêm
          </button>
        </div>
        <div className="budget-table budget-chi-table">
          <div className="budget-thead budget-chi-thead">
            <span>Người / Tổ chức</span>
            <span>Danh mục</span>
            <span>Nội dung</span>
            <span className="bt-right">Dự toán</span>
            <span className="bt-right">+PS</span>
            <span className="bt-right">Tổng HĐ</span>
            <span className="bt-right">Đã trả</span>
            <span className="bt-right">Còn nợ</span>
          </div>
          {lineData.map(d => (
            <div key={d.id} className={`budget-trow budget-chi-row ${d.outstanding <= 0 ? 'settled' : ''}`} onClick={() => openEdit(d)}>
              <span className="bt-person">{d.person || '—'}</span>
              <span className="bt-cat">{d.cat?.icon || '📋'} {d.cat?.name || d.category}</span>
              <span className="bt-desc">
                {d.description}
                {d.note && <span className="bt-note">💬 {d.note}</span>}
              </span>
              <span className="bt-amount bt-right">{formatVND(d.estimatedAmount)}</span>
              <span className={`bt-amount bt-right ${d.ps > 0 ? 'text-warning' : ''}`}>
                {d.ps > 0 ? `+${formatVND(d.ps)}` : '—'}
              </span>
              <span className="bt-amount bt-right" style={{ fontWeight: 700 }}>{formatVND(d.totalContract)}</span>
              <span className={`bt-amount bt-right ${d.paid > 0 ? 'text-income' : ''}`}>
                {d.paid > 0 ? formatVND(d.paid) : '—'}
              </span>
              <span className={`bt-amount bt-right ${d.outstanding > 0 ? 'text-danger' : d.outstanding === 0 ? 'text-income' : ''}`} style={{ fontWeight: 700 }}>
                {d.outstanding > 0 ? formatVND(d.outstanding) : d.outstanding === 0 ? '✅ 0' : formatVND(d.outstanding)}
              </span>
            </div>
          ))}

          {/* ── Overflow row: chi phí phát sinh chưa dự toán ── */}
          {hasOverflow && (
            <div className="budget-trow budget-chi-row budget-overflow-row">
              <span className="bt-person bt-overflow-label">⚠️ Chi phí phát sinh</span>
              <span className="bt-cat">—</span>
              <span className="bt-desc bt-overflow-desc">Chi thực tế vượt ngoài dự toán</span>
              <span className="bt-amount bt-right">—</span>
              <span className="bt-amount bt-right">—</span>
              <span className="bt-amount bt-right">—</span>
              <span className="bt-amount bt-right text-warning" style={{ fontWeight: 700 }}>
                {formatVND(overflowPaid)}
              </span>
              <span className="bt-amount bt-right text-danger" style={{ fontWeight: 700 }}>
                {formatVND(-overflowPaid)}
              </span>
            </div>
          )}

          {lineData.length > 0 && (
            <div className="budget-trow budget-chi-row budget-total-row">
              <span className="bt-person" style={{ fontWeight: 800 }}>Tổng cộng</span>
              <span></span>
              <span></span>
              <span className="bt-amount bt-right" style={{ fontWeight: 800 }}>{formatVND(totEst)}</span>
              <span className={`bt-amount bt-right ${totPS > 0 ? 'text-warning' : ''}`} style={{ fontWeight: 800 }}>
                {totPS > 0 ? `+${formatVND(totPS)}` : '—'}
              </span>
              <span className="bt-amount bt-right" style={{ fontWeight: 800 }}>{formatVND(totContract)}</span>
              <span className="bt-amount bt-right text-income" style={{ fontWeight: 800 }}>{formatVND(totPaidLines)}</span>
              <span className={`bt-amount bt-right ${grandTotOutstanding > 0 ? 'text-danger' : 'text-income'}`} style={{ fontWeight: 800 }}>
                {formatVND(grandTotOutstanding)}
              </span>
            </div>
          )}

          {lines.length === 0 && (
            <div className="budget-table-empty">
              Chưa có dòng dự toán chi
              <button className="btn btn-ghost btn-sm" onClick={() => openNew('chi')} style={{ marginLeft: 12 }}>＋ Thêm</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="budget-page animate-fade-in">

      {/* ── Project Dropdown ──────────────────────── */}
      <div className="project-selector" ref={dropdownRef}>
        <button className={`selector-trigger ${dropdownOpen ? 'open' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
          {project ? (
            <div className="selector-current">
              <span className="selector-icon">{getStatusLabel(project.status).icon}</span>
              <div className="selector-info">
                <span className="selector-name">{project.name}</span>
                <span className="selector-client">{project.client} • {project.type}</span>
              </div>
            </div>
          ) : (
            <span className="selector-placeholder">Chọn project...</span>
          )}
          <span className={`selector-arrow ${dropdownOpen ? 'up' : ''}`}>▼</span>
        </button>

        {dropdownOpen && (
          <div className="selector-dropdown">
            <div className="selector-search-box">
              <input ref={searchRef} className="selector-search" type="text"
                placeholder="🔍 Tìm project hoặc client..." value={dropdownSearch}
                onChange={e => setDropdownSearch(e.target.value)} />
            </div>
            <div className="selector-list">
              {groups.map(group => (
                <div key={group.status} className="selector-group">
                  <div className="selector-group-header">{group.label}</div>
                  {group.projects.map(p => {
                    const hasBudget = budgetLines.some(b => b.projectId === p.id);
                    return (
                      <button key={p.id} className={`selector-option ${activeProject === p.id ? 'active' : ''}`}
                        onClick={() => selectProject(p.id)}>
                        <div className="option-info">
                          <span className="option-name">{p.name}</span>
                          <span className="option-client">{p.client}</span>
                        </div>
                        <div className="option-meta">
                          <span className={`option-badge ${hasBudget ? 'has-budget' : 'no-budget'}`}>
                            {hasBudget ? 'Có dự toán' : 'Chưa có'}
                          </span>
                          <span className="option-budget">{formatVND(p.budget)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 && (<div className="selector-empty">Không tìm thấy project nào</div>)}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────── */}
      {project && (
        <>
          {hasBudgetLines ? (
            <>
              {/* Summary */}
              <div className="budget-summary stagger">
                <div className="budget-sum-card animate-slide-up">
                  <span className="bsc-label">Dự toán thu</span>
                  <span className="bsc-value">{formatVND(summary.estThu)}</span>
                  <div className="bsc-compare">
                    <span className="bsc-actual text-income">Thực: {formatVND(summary.actThu)}</span>
                    <span className="bsc-pct">{summary.estThu > 0 ? Math.round((summary.actThu / summary.estThu) * 100) : 0}%</span>
                  </div>
                  <div className="bsc-bar"><div className="bsc-bar-fill income" style={{ width: `${summary.estThu > 0 ? Math.min((summary.actThu / summary.estThu) * 100, 100) : 0}%` }} /></div>
                </div>
                <div className="budget-sum-card animate-slide-up">
                  <span className="bsc-label">Dự toán chi</span>
                  <span className="bsc-value">{formatVND(summary.estChi)}</span>
                  <div className="bsc-compare">
                    <span className="bsc-actual text-expense">Thực: {formatVND(summary.actChi)}</span>
                    <span className={`bsc-pct ${summary.actChi > summary.estChi ? 'text-danger' : ''}`}>
                      {summary.estChi > 0 ? Math.round((summary.actChi / summary.estChi) * 100) : 0}%
                    </span>
                  </div>
                  <div className="bsc-bar"><div className={`bsc-bar-fill ${summary.actChi > summary.estChi ? 'danger' : 'expense'}`} style={{ width: `${summary.estChi > 0 ? Math.min((summary.actChi / summary.estChi) * 100, 100) : 0}%` }} /></div>
                </div>
                <div className="budget-sum-card animate-slide-up">
                  <span className="bsc-label">Lợi nhuận dự kiến</span>
                  <span className={`bsc-value ${summary.estProfit >= 0 ? 'text-income' : 'text-expense'}`}>{formatVND(summary.estProfit)}</span>
                  <div className="bsc-compare">
                    <span className={`bsc-actual ${summary.actProfit >= 0 ? 'text-income' : 'text-expense'}`}>Thực: {formatVND(summary.actProfit)}</span>
                  </div>
                </div>
                <div className="budget-sum-card animate-slide-up">
                  <span className="bsc-label">Chênh lệch chi</span>
                  <span className={`bsc-value ${summary.variance > 0 ? 'text-danger' : summary.variance < 0 ? 'text-income' : ''}`}>
                    {summary.variance > 0 ? '+' : ''}{formatVND(summary.variance)}
                  </span>
                  <span className="bsc-hint">{summary.variance > 0 ? '⚠️ Vượt dự toán' : summary.variance < 0 ? '✅ Tiết kiệm' : '— Đúng dự toán'}</span>
                </div>
              </div>

              {/* Tables */}
              {renderThuTable(summary.thuLines)}
              {renderChiTable(summary.chiLines)}
            </>
          ) : (
            <div className="card budget-empty">
              <div className="budget-empty-icon">📋</div>
              <h3>Chưa có dự toán cho {project.name}</h3>
              <p>Tạo dự toán thu chi để theo dõi ngân sách dự kiến vs thực tế</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => openNew('thu')}>📥 Thêm dự toán thu</button>
                <button className="btn btn-primary" onClick={() => openNew('chi')}>📤 Thêm dự toán chi</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Budget Line Modal ────────────────────── */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Sửa dự toán' : '＋ Thêm dự toán'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="txn-form">
              {/* Type Toggle */}
              <div className="form-group">
                <label className="form-label">Loại</label>
                <div className="type-toggle">
                  <button type="button" className={`type-btn thu ${formType === 'thu' ? 'active' : ''}`}
                    onClick={() => { setFormType('thu'); setFormCat(''); }}>📥 THU</button>
                  <button type="button" className={`type-btn chi ${formType === 'chi' ? 'active' : ''}`}
                    onClick={() => { setFormType('chi'); setFormCat(''); }}>📤 CHI</button>
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <div className="cat-grid">
                  {currentCategories.map(cat => (
                    <button key={cat.code} type="button" className={`cat-chip ${formCat === cat.code ? 'active' : ''}`}
                      onClick={() => setFormCat(cat.code)}>
                      <span className="cat-chip-icon">{cat.icon}</span>
                      <span className="cat-chip-name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Person (Chi only) */}
              {formType === 'chi' && (
                <div className="form-group">
                  <PersonAutocomplete
                    label="Partners & Staff"
                    required
                    value={formPerson}
                    onChange={setFormPerson}
                    placeholder="VD: Trung Ca, Studio XYZ..."
                    hint="Tên chính xác để match với Transactions"
                  />
                </div>
              )}

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <input className="input" type="text" placeholder="VD: Compositing 20 shot, Đặt cọc 50%..."
                  value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>

              {/* Amounts — Dự toán only, Thực tế tính tự động từ transactions */}
              <div className="form-group">
                <label className="form-label">Dự toán <span className="form-required">*</span></label>
                <div className="amount-input-wrapper">
                  <input className="input" type="text" placeholder="VD: 15"
                    value={formEstimated} onChange={e => setFormEstimated(e.target.value)} required />
                  <span className="currency">triệu ₫</span>
                </div>
                {formEstimated && parseAmount(formEstimated) > 0 && (
                  <span className="form-hint amount-preview">= {formatFullVND(parseAmount(formEstimated))}</span>
                )}
              </div>
              <span className="form-hint" style={{marginTop: -8}}>💡 Thực tế sẽ tự động tính từ transactions khi giao dịch được gắn vào dòng này</span>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <div className="status-pills">
                  {(Object.entries(budgetStatusConfig) as [BudgetLine['status'], typeof budgetStatusConfig[string]][]).map(([key, cfg]) => (
                    <button key={key} type="button"
                      className={`status-pill ${formStatus === key ? 'active' : ''}`}
                      style={{ '--pill-color': cfg.color, '--pill-bg': cfg.bg } as React.CSSProperties}
                      onClick={() => setFormStatus(key)}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Date — chỉ hiện cho dòng thu */}
              {formType === 'thu' && (
                <div className="form-group">
                  <label className="form-label">📅 Ngày dự kiến nhận tiền <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(tuỳ chọn)</span></label>
                  <input className="input" type="date"
                    value={formExpectedDate}
                    onChange={e => setFormExpectedDate(e.target.value)} />
                  {formExpectedDate && (
                    <span className="form-hint">
                      {(() => {
                        const d = new Date(formExpectedDate);
                        const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
                        return diff < 0 ? `⚠️ Đã qua ${Math.abs(diff)} ngày`
                          : diff === 0 ? '📌 Hôm nay'
                          : `📌 Còn ${diff} ngày`;
                      })()}
                    </span>
                  )}
                </div>
              )}

              {/* Note */}
              <div className="form-group">
                <label className="form-label">Ghi chú</label>
                <input className="input" type="text" placeholder="VD: Vượt do re-render..."
                  value={formNote} onChange={e => setFormNote(e.target.value)} />
              </div>

              {/* Actions */}
              <div className="form-actions">
                {editingId && !showDeleteConfirm && (
                  <button type="button" className="btn btn-danger-ghost" onClick={() => setShowDeleteConfirm(true)}>🗑️ Xóa</button>
                )}
                {showDeleteConfirm && (
                  <div className="delete-confirm">
                    <span className="delete-warn">⚠️ Xóa dòng này?</span>
                    <button type="button" className="btn btn-danger" onClick={handleDelete}>Xóa luôn</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
                  </div>
                )}
                <div className="form-actions-right">
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={!formEstimated || parseAmount(formEstimated) <= 0}>
                    💾 {editingId ? 'Cập nhật' : 'Lưu dự toán'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
