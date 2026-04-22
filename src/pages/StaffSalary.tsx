import { useState, useMemo } from 'react';
import { useData } from '../data/DataContext';
import { formatVND } from '../data/mockData';
import type { StaffSalary, Person } from '../data/mockData';
import './StaffSalary.css';

// ─── Constants ────────────────────────────────────────────
const STATUS_MAP: Record<StaffSalary['status'], { label: string; icon: string; color: string }> = {
  pending: { label: 'Chưa trả', icon: '⏳', color: '#fdcb6e' },
  partial: { label: 'Một phần', icon: '🔸', color: '#e17055' },
  paid:    { label: 'Đã trả',   icon: '✅', color: '#00b894' },
};

const TYPE_COLORS: Record<string, string> = {
  leader:   '#fdcb6e',
  staff:    '#00b894',
  freelance:'#0984e3',
};

// ─── Date helpers ─────────────────────────────────────────
function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(m: string) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `Tháng ${parseInt(mo)} / ${y}`;
}

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Draft types ──────────────────────────────────────────
type RowDraft = {
  baseSalary: string;
  bonus: string;
  deduction: string;
  status: StaffSalary['status'];
  paidAmount: string;
  paidDate: string;
  note: string;
};

function recordToDraft(r: StaffSalary): RowDraft {
  return {
    baseSalary: String(r.baseSalary),
    bonus:      String(r.bonus),
    deduction:  String(r.deduction),
    status:     r.status,
    paidAmount: String(r.paidAmount),
    paidDate:   r.paidDate || '',
    note:       r.note || '',
  };
}

function defaultDraft(person: Person): RowDraft {
  return {
    baseSalary: String(person.baseSalary || 0),
    bonus:      '0',
    deduction:  '0',
    status:     'pending',
    paidAmount: '0',
    paidDate:   '',
    note:       '',
  };
}

function calcNet(d: RowDraft): number {
  return (parseFloat(d.baseSalary) || 0)
       + (parseFloat(d.bonus) || 0)
       - (parseFloat(d.deduction) || 0);
}

// ─── Component ────────────────────────────────────────────
export default function StaffSalary() {
  const { people, staffSalaries, addStaffSalary, updateStaffSalary, deleteStaffSalary } = useData();

  const [month, setMonth]     = useState(getCurrentMonth());
  const [drafts, setDrafts]   = useState<Record<string, RowDraft>>({});
  const [saving, setSaving]   = useState<Record<string, boolean>>({});
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [copying, setCopying] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ person: Person; record: StaffSalary } | null>(null);

  // ── Derived data ─────────────────────────────────────────
  const staffPeople = useMemo(
    () => people.filter(p => p.type === 'leader' || p.type === 'staff'),
    [people],
  );

  const monthRecords = useMemo(() => {
    const map: Record<string, StaffSalary> = {};
    staffSalaries.filter(ss => ss.month === month).forEach(ss => { map[ss.personName] = ss; });
    return map;
  }, [staffSalaries, month]);

  const roster = useMemo(
    () => staffPeople.map(person => ({ person, record: monthRecords[person.name] || null })),
    [staffPeople, monthRecords],
  );

  // ── Get display values for a row ─────────────────────────
  function getRow(person: Person, record: StaffSalary | null): RowDraft {
    return drafts[person.id] ?? (record ? recordToDraft(record) : defaultDraft(person));
  }

  // ── Update draft ──────────────────────────────────────────
  function patch(personId: string, person: Person, record: StaffSalary | null, field: keyof RowDraft, val: string) {
    const base = drafts[personId] ?? (record ? recordToDraft(record) : defaultDraft(person));
    setDrafts(prev => ({ ...prev, [personId]: { ...base, [field]: val } }));
  }

  // ── Save single row ───────────────────────────────────────
  async function saveRow(person: Person, record: StaffSalary | null) {
    const draft = getRow(person, record);
    const baseSalary  = parseFloat(draft.baseSalary)  || 0;
    const bonus       = parseFloat(draft.bonus)       || 0;
    const deduction   = parseFloat(draft.deduction)   || 0;
    const netSalary   = baseSalary + bonus - deduction;
    const paidAmount  = parseFloat(draft.paidAmount)  || 0;

    setSaving(p => ({ ...p, [person.id]: true }));
    setErrors(p => { const n = { ...p }; delete n[person.id]; return n; });

    try {
      const payload: Omit<StaffSalary, 'id' | 'createdAt'> = {
        personName: person.name,
        month,
        baseSalary,
        bonus,
        deduction,
        netSalary,
        status:     draft.status,
        paidAmount,
        paidDate:   draft.paidDate || undefined,
        note:       draft.note.trim() || undefined,
      };

      if (record) {
        await updateStaffSalary(record.id, payload);
      } else {
        await addStaffSalary(payload);
      }
      setDrafts(p => { const n = { ...p }; delete n[person.id]; return n; });
    } catch (err) {
      setErrors(p => ({ ...p, [person.id]: err instanceof Error ? err.message : 'Lỗi lưu' }));
    } finally {
      setSaving(p => { const n = { ...p }; delete n[person.id]; return n; });
    }
  }

  // ── Quick Pay ─────────────────────────────────────────────
  async function quickPay(person: Person, record: StaffSalary) {
    setSaving(p => ({ ...p, [person.id]: true }));
    try {
      await updateStaffSalary(record.id, {
        status:     'paid',
        paidAmount: record.netSalary,
        paidDate:   new Date().toISOString().split('T')[0],
      });
      setDrafts(p => { const n = { ...p }; delete n[person.id]; return n; });
    } catch (err) {
      setErrors(p => ({ ...p, [person.id]: err instanceof Error ? err.message : 'Lỗi' }));
    } finally {
      setSaving(p => { const n = { ...p }; delete n[person.id]; return n; });
    }
  }

  // ── Delete record ─────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    const { person, record } = deleteTarget;
    setSaving(p => ({ ...p, [person.id]: true }));
    try {
      await deleteStaffSalary(record.id);
      setDrafts(p => { const n = { ...p }; delete n[person.id]; return n; });
      setDeleteTarget(null);
    } finally {
      setSaving(p => { const n = { ...p }; delete n[person.id]; return n; });
    }
  }

  // ── Generate all (create missing records) ─────────────────
  async function generateAll() {
    const missing = roster.filter(({ record }) => !record);
    if (missing.length === 0) return;
    setGenBusy(true);
    try {
      await Promise.all(missing.map(({ person }) => {
        const draft = getRow(person, null);
        const baseSalary = parseFloat(draft.baseSalary) || 0;
        const bonus      = parseFloat(draft.bonus)      || 0;
        const deduction  = parseFloat(draft.deduction)  || 0;
        return addStaffSalary({
          personName: person.name,
          month,
          baseSalary,
          bonus,
          deduction,
          netSalary:  baseSalary + bonus - deduction,
          status:     'pending',
          paidAmount: 0,
        });
      }));
      setDrafts({});
    } catch (err) {
      console.error(err);
    } finally {
      setGenBusy(false);
    }
  }

  // ── Copy from last month ──────────────────────────────────
  async function copyLastMonth() {
    const last       = shiftMonth(month, -1);
    const lastRecs   = staffSalaries.filter(ss => ss.month === last);
    if (lastRecs.length === 0) {
      alert(`Không có dữ liệu lương ${formatMonth(last)}`);
      return;
    }
    const existing = new Set(Object.keys(monthRecords));
    const toCopy   = lastRecs.filter(r => !existing.has(r.personName));
    if (toCopy.length === 0) {
      alert('Tất cả nhân sự đã có dữ liệu tháng này!');
      return;
    }
    setCopying(true);
    try {
      await Promise.all(toCopy.map(r => addStaffSalary({
        personName: r.personName,
        month,
        baseSalary: r.baseSalary,
        bonus:      r.bonus,
        deduction:  r.deduction,
        netSalary:  r.netSalary,
        status:     'pending',
        paidAmount: 0,
        note:       r.note,
      })));
    } finally {
      setCopying(false);
    }
  }

  // ── Summary ───────────────────────────────────────────────
  const summary = useMemo(() => {
    const rows = roster.map(({ person, record }) => {
      const d = getRow(person, record);
      const net  = calcNet(d);
      const paid = parseFloat(d.paidAmount) || (record?.paidAmount ?? 0);
      return { net, paid, status: d.status, hasRecord: !!record };
    });
    const saved = rows.filter(r => r.hasRecord);
    return {
      count:      staffPeople.length,
      saved:      saved.length,
      totalNet:   saved.reduce((s, r) => s + r.net, 0),
      totalPaid:  saved.reduce((s, r) => s + r.paid, 0),
      countPaid:  saved.filter(r => r.status === 'paid').length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, drafts]);

  const missingCount = roster.filter(r => !r.record).length;

  return (
    <div className="salary-page animate-fade-in">

      {/* ── Month Navigator ─────────────────────────────── */}
      <div className="salary-header">
        <div className="month-nav">
          <button className="month-arrow" onClick={() => setMonth(m => shiftMonth(m, -1))}>‹</button>
          <div className="month-label">{formatMonth(month)}</div>
          <button className="month-arrow" onClick={() => setMonth(m => shiftMonth(m, 1))}>›</button>
        </div>

        <div className="salary-toolbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={copyLastMonth} disabled={copying}>
            {copying ? '⏳' : '📋'} Copy tháng trước
          </button>
          {missingCount > 0 && (
            <button className="btn btn-primary btn-sm" onClick={generateAll} disabled={genBusy}>
              {genBusy ? '⏳ Đang tạo...' : `⚡ Tạo ${missingCount} dòng còn thiếu`}
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────── */}
      <div className="salary-cards">
        <div className="salary-card total">
          <div className="sc-label">Quỹ lương {formatMonth(month)}</div>
          <div className="sc-value">{formatVND(summary.totalNet)}₫</div>
          <div className="sc-sub">{summary.saved}/{summary.count} nhân sự đã nhập</div>
        </div>
        <div className="salary-card paid">
          <div className="sc-label">Đã chi</div>
          <div className="sc-value green">{formatVND(summary.totalPaid)}₫</div>
          <div className="sc-sub">{summary.countPaid} người đã nhận đủ</div>
        </div>
        <div className="salary-card unpaid">
          <div className="sc-label">Còn phải trả</div>
          <div className="sc-value orange">{formatVND(summary.totalNet - summary.totalPaid)}₫</div>
          <div className="sc-sub">{summary.saved - summary.countPaid} người chưa đủ</div>
        </div>
      </div>

      {/* ── Roster Table ───────────────────────────────── */}
      <div className="card roster-card">

        {/* Table Header */}
        <div className="roster-thead">
          <span className="rt-name">Nhân sự</span>
          <span className="rt-money">Lương CB (₫)</span>
          <span className="rt-money">Thưởng (₫)</span>
          <span className="rt-money">Khấu trừ (₫)</span>
          <span className="rt-net">Net (₫)</span>
          <span className="rt-money">Đã trả (₫)</span>
          <span className="rt-status">Trạng thái</span>
          <span className="rt-actions">Thao tác</span>
        </div>

        {roster.length === 0 ? (
          <div className="roster-empty">
            Chưa có nhân sự Lucid.<br />
            <span>Vào tab "Danh sách nhân sự" để thêm thành viên.</span>
          </div>
        ) : roster.map(({ person, record }) => {
          const row     = getRow(person, record);
          const net     = calcNet(row);
          const dirty   = person.id in drafts;
          const busy    = saving[person.id] === true;
          const err     = errors[person.id];
          const isNew   = !record;
          const st      = STATUS_MAP[row.status];
          const avatarColor = TYPE_COLORS[person.type] || '#6c5ce7';

          return (
            <div
              key={person.id}
              className={`roster-row${dirty ? ' dirty' : ''}${isNew ? ' is-new' : ''}${busy ? ' is-saving' : ''}`}
            >
              {/* Name col */}
              <span className="rt-name name-cell">
                <span className="r-avatar" style={{ background: avatarColor }}>
                  {person.name.charAt(0).toUpperCase()}
                </span>
                <span className="r-info">
                  <span className="r-fullname">{person.name}</span>
                  {person.role && <span className="r-role">{person.role}</span>}
                </span>
                {isNew && <span className="unsaved-badge">Chưa lưu</span>}
                {dirty && !isNew && <span className="dirty-badge">Đã sửa</span>}
              </span>

              {/* Base Salary */}
              <span className="rt-money">
                <input
                  className="ri"
                  type="number"
                  value={row.baseSalary}
                  placeholder="0"
                  disabled={busy}
                  onChange={e => patch(person.id, person, record, 'baseSalary', e.target.value)}
                />
              </span>

              {/* Bonus */}
              <span className="rt-money">
                <input
                  className="ri ri-bonus"
                  type="number"
                  value={row.bonus}
                  placeholder="0"
                  disabled={busy}
                  onChange={e => patch(person.id, person, record, 'bonus', e.target.value)}
                />
              </span>

              {/* Deduction */}
              <span className="rt-money">
                <input
                  className="ri ri-deduct"
                  type="number"
                  value={row.deduction}
                  placeholder="0"
                  disabled={busy}
                  onChange={e => patch(person.id, person, record, 'deduction', e.target.value)}
                />
              </span>

              {/* Net — computed, read-only */}
              <span className="rt-net">
                <strong className={`net-amount${net < 0 ? ' negative' : ''}`}>
                  {formatVND(net)}₫
                </strong>
              </span>

              {/* Paid */}
              <span className="rt-money">
                <input
                  className="ri ri-paid"
                  type="number"
                  value={row.paidAmount}
                  placeholder="0"
                  disabled={busy}
                  onChange={e => patch(person.id, person, record, 'paidAmount', e.target.value)}
                />
              </span>

              {/* Status select */}
              <span className="rt-status">
                <select
                  className="status-sel"
                  value={row.status}
                  disabled={busy}
                  style={{ color: st.color, borderColor: `${st.color}55` }}
                  onChange={e => patch(person.id, person, record, 'status', e.target.value as StaffSalary['status'])}
                >
                  {(Object.entries(STATUS_MAP) as [StaffSalary['status'], typeof STATUS_MAP[keyof typeof STATUS_MAP]][]).map(([code, cfg]) => (
                    <option key={code} value={code}>{cfg.icon} {cfg.label}</option>
                  ))}
                </select>
              </span>

              {/* Actions */}
              <span className="rt-actions action-cell" onClick={e => e.stopPropagation()}>
                {err && <span className="row-err" title={err}>⚠️</span>}

                {/* Quick pay — only if saved and not paid */}
                {record && record.status !== 'paid' && !dirty && (
                  <button
                    className="act-btn pay"
                    title="Trả hết ngay"
                    disabled={busy}
                    onClick={() => quickPay(person, record)}
                  >💸</button>
                )}

                {/* Save — if dirty */}
                {(dirty || isNew) && (
                  <button
                    className="act-btn save"
                    title="Lưu thay đổi"
                    disabled={busy}
                    onClick={() => saveRow(person, record)}
                  >
                    {busy ? '⏳' : '💾'}
                  </button>
                )}

                {/* Delete — only if saved */}
                {record && (
                  <button
                    className="act-btn del"
                    title="Xóa dòng này"
                    disabled={busy}
                    onClick={() => setDeleteTarget({ person, record })}
                  >🗑️</button>
                )}
              </span>
            </div>
          );
        })}

        {/* Table Footer */}
        {summary.saved > 0 && (
          <div className="roster-footer">
            <span>{summary.saved} nhân sự</span>
            <span>Tổng net: <strong>{formatVND(summary.totalNet)}₫</strong></span>
            <span>Đã chi: <strong className="green">{formatVND(summary.totalPaid)}₫</strong></span>
            <span>Còn lại: <strong className="orange">{formatVND(summary.totalNet - summary.totalPaid)}₫</strong></span>
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ──────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-icon">🗑️</div>
            <h3>Xóa dữ liệu lương của <strong>{deleteTarget.person.name}</strong>?</h3>
            <p>Tháng {formatMonth(month)} — {formatVND(deleteTarget.record.netSalary)}₫</p>
            <p className="dm-warn">Hành động này không thể hoàn tác.</p>
            <div className="dm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
