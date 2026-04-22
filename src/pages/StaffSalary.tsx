import { useState, useMemo } from 'react';
import { useData } from '../data/DataContext';
import type { StaffSalary, Person } from '../data/mockData';
import './StaffSalary.css';

// ─── Status config ─────────────────────────────────────────
const STATUS_MAP: Record<StaffSalary['status'], { label: string; icon: string; color: string }> = {
  pending: { label: 'Chưa trả', icon: '⏳', color: '#fdcb6e' },
  partial: { label: 'Một phần', icon: '🔸', color: '#e17055' },
  paid:    { label: 'Đã trả',   icon: '✅', color: '#00b894' },
};

const TYPE_COLORS: Record<string, string> = {
  leader: '#fdcb6e', staff: '#00b894', freelance: '#0984e3',
};

// ─── Triệu helpers ─────────────────────────────────────────
/** đồng → triệu string for input display */
function toMTr(val: number): string {
  if (!val) return '';
  const m = val / 1_000_000;
  return parseFloat(m.toFixed(4)).toString();
}
/** triệu string → đồng */
function fromMTr(val: string): number {
  return Math.round((parseFloat(val) || 0) * 1_000_000);
}
/** đồng → "X.XX tr" for display */
function fmTr(val: number): string {
  if (!val) return '0 tr';
  const m = val / 1_000_000;
  return `${parseFloat(m.toFixed(3))} tr`;
}

// ─── Date helpers ──────────────────────────────────────────
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

// ─── Transaction month-match ────────────────────────────────
function matchesMonth(description: string, month: string): boolean {
  const [, mo] = month.split('-');
  const n = parseInt(mo);
  const d = description.toLowerCase();
  return (
    new RegExp(`\\bt\\s*0?${n}\\b`).test(d) ||
    new RegExp(`tháng\\s+0?${n}\\b`).test(d) ||
    new RegExp(`0?${n}\\s*/\\s*20\\d{2}`).test(d)
  );
}

// ─── Draft type ────────────────────────────────────────────
type RowDraft = {
  baseSalary: string; bonus: string; deduction: string;
  status: StaffSalary['status']; paidAmount: string; paidDate: string; note: string;
};

function recordToDraft(r: StaffSalary): RowDraft {
  return {
    baseSalary: toMTr(r.baseSalary), bonus: toMTr(r.bonus), deduction: toMTr(r.deduction),
    status: r.status, paidAmount: toMTr(r.paidAmount), paidDate: r.paidDate || '', note: r.note || '',
  };
}
function defaultDraft(person: Person): RowDraft {
  return {
    baseSalary: toMTr(person.baseSalary || 0), bonus: '', deduction: '',
    status: 'pending', paidAmount: '', paidDate: '', note: '',
  };
}
/** Net salary in đồng from draft */
function calcNetDong(d: RowDraft): number {
  return fromMTr(d.baseSalary) + fromMTr(d.bonus) - fromMTr(d.deduction);
}
/** Auto status from paid vs net (both in đồng) */
function autoStatus(paidDong: number, netDong: number): StaffSalary['status'] {
  if (netDong <= 0) return 'pending';
  if (paidDong >= netDong) return 'paid';
  if (paidDong > 0) return 'partial';
  return 'pending';
}

// ─── Component ─────────────────────────────────────────────
export default function StaffSalary() {
  const { people, staffSalaries, transactions, projects, addStaffSalary, updateStaffSalary, deleteStaffSalary } = useData();

  const [month, setMonth]     = useState(getCurrentMonth());
  const [drafts, setDrafts]   = useState<Record<string, RowDraft>>({});
  const [saving, setSaving]   = useState<Record<string, boolean>>({});
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [copying, setCopying] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ person: Person; record: StaffSalary } | null>(null);

  // Staff people only
  const staffPeople = useMemo(
    () => people.filter(p => p.type === 'leader' || p.type === 'staff'), [people]);

  // Records for current month
  const monthRecords = useMemo(() => {
    const map: Record<string, StaffSalary> = {};
    staffSalaries.filter(ss => ss.month === month).forEach(ss => { map[ss.personName] = ss; });
    return map;
  }, [staffSalaries, month]);

  // Auto-linked paid from transactions using salaryMonth field
  const txnPaidMap = useMemo(() => {
    const salaryProj = projects.find(p => p.isInternal || p.name === 'Lương Lucid');
    if (!salaryProj) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    staffPeople.forEach(person => {
      const paid = transactions
        .filter(t =>
          t.type === 'chi' &&
          t.category === 'luong' &&
          t.projectId === salaryProj.id &&
          t.person === person.name &&
          t.salaryMonth === month
        )
        .reduce((s, t) => s + t.amount, 0);
      if (paid > 0) map[person.name] = paid;
    });
    return map;
  }, [transactions, projects, staffPeople, month]);

  const roster = useMemo(
    () => staffPeople.map(person => ({ person, record: monthRecords[person.name] || null })),
    [staffPeople, monthRecords]);

  function getRow(person: Person, record: StaffSalary | null): RowDraft {
    return drafts[person.id] ?? (record ? recordToDraft(record) : defaultDraft(person));
  }

  function patch(personId: string, person: Person, record: StaffSalary | null, field: keyof RowDraft, val: string) {
    const base = drafts[personId] ?? (record ? recordToDraft(record) : defaultDraft(person));
    setDrafts(prev => ({ ...prev, [personId]: { ...base, [field]: val } }));
  }

  async function saveRow(person: Person, record: StaffSalary | null) {
    const draft      = getRow(person, record);
    const baseSalary = fromMTr(draft.baseSalary);
    const bonus      = fromMTr(draft.bonus);
    const deduction  = fromMTr(draft.deduction);
    const netSalary  = baseSalary + bonus - deduction;
    const paidAmount = fromMTr(draft.paidAmount);

    setSaving(p => ({ ...p, [person.id]: true }));
    setErrors(p => { const n = { ...p }; delete n[person.id]; return n; });
    try {
      const payload: Omit<StaffSalary, 'id' | 'createdAt'> = {
        personName: person.name, month, baseSalary, bonus, deduction, netSalary,
        status: draft.status, paidAmount,
        paidDate: draft.paidDate || undefined, note: draft.note.trim() || undefined,
      };
      if (record) { await updateStaffSalary(record.id, payload); }
      else        { await addStaffSalary(payload); }
      setDrafts(p => { const n = { ...p }; delete n[person.id]; return n; });
    } catch (err) {
      setErrors(p => ({ ...p, [person.id]: err instanceof Error ? err.message : 'Lỗi' }));
    } finally {
      setSaving(p => { const n = { ...p }; delete n[person.id]; return n; });
    }
  }

  async function quickPay(person: Person, record: StaffSalary) {
    setSaving(p => ({ ...p, [person.id]: true }));
    try {
      await updateStaffSalary(record.id, {
        status: 'paid', paidAmount: record.netSalary,
        paidDate: new Date().toISOString().split('T')[0],
      });
      setDrafts(p => { const n = { ...p }; delete n[person.id]; return n; });
    } catch (err) {
      setErrors(p => ({ ...p, [person.id]: err instanceof Error ? err.message : 'Lỗi' }));
    } finally {
      setSaving(p => { const n = { ...p }; delete n[person.id]; return n; });
    }
  }

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

  async function generateAll() {
    const missing = roster.filter(({ record }) => !record);
    if (!missing.length) return;
    setGenBusy(true);
    try {
      await Promise.all(missing.map(({ person }) => {
        const d = getRow(person, null);
        const b = fromMTr(d.baseSalary), bo = fromMTr(d.bonus), de = fromMTr(d.deduction);
        return addStaffSalary({ personName: person.name, month, baseSalary: b, bonus: bo, deduction: de, netSalary: b + bo - de, status: 'pending', paidAmount: 0 });
      }));
      setDrafts({});
    } finally { setGenBusy(false); }
  }

  async function copyLastMonth() {
    const last = shiftMonth(month, -1);
    const lastRecs = staffSalaries.filter(ss => ss.month === last);
    if (!lastRecs.length) { alert(`Không có dữ liệu lương ${formatMonth(last)}`); return; }
    const existing = new Set(Object.keys(monthRecords));
    const toCopy = lastRecs.filter(r => !existing.has(r.personName));
    if (!toCopy.length) { alert('Tất cả nhân sự đã có dữ liệu tháng này!'); return; }
    setCopying(true);
    try {
      await Promise.all(toCopy.map(r => addStaffSalary({
        personName: r.personName, month, baseSalary: r.baseSalary, bonus: r.bonus,
        deduction: r.deduction, netSalary: r.netSalary, status: 'pending', paidAmount: 0, note: r.note,
      })));
    } finally { setCopying(false); }
  }

  // Summary (saved records only, đồng)
  const summary = useMemo(() => {
    const rows = roster.filter(({ record }) => record).map(({ person, record }) => {
      const net      = record!.netSalary;
      const txnPaid  = txnPaidMap[person.name] || 0;
      const paid     = txnPaid > 0 ? txnPaid : record!.paidAmount;
      const st       = autoStatus(paid, net);
      return { net, paid, st };
    });
    return {
      count: staffPeople.length, saved: rows.length,
      totalNet:  rows.reduce((s, r) => s + r.net, 0),
      totalPaid: rows.reduce((s, r) => s + r.paid, 0),
      countPaid: rows.filter(r => r.st === 'paid').length,
    };
  }, [roster, txnPaidMap, staffPeople.length]);

  const missingCount = roster.filter(r => !r.record).length;

  return (
    <div className="salary-page animate-fade-in">

      {/* ── Header ─────────────────────────────── */}
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

      {/* ── Summary Cards ──────────────────────── */}
      <div className="salary-cards">
        <div className="salary-card total">
          <div className="sc-label">Quỹ lương {formatMonth(month)}</div>
          <div className="sc-value">{fmTr(summary.totalNet)}</div>
          <div className="sc-sub">{summary.saved}/{summary.count} nhân sự đã nhập</div>
        </div>
        <div className="salary-card paid">
          <div className="sc-label">Đã chi</div>
          <div className="sc-value green">{fmTr(summary.totalPaid)}</div>
          <div className="sc-sub">{summary.countPaid} người đã nhận đủ</div>
        </div>
        <div className="salary-card unpaid">
          <div className="sc-label">Còn phải trả</div>
          <div className="sc-value orange">{fmTr(summary.totalNet - summary.totalPaid)}</div>
          <div className="sc-sub">{summary.saved - summary.countPaid} người chưa đủ</div>
        </div>
      </div>

      {/* ── Roster Table ───────────────────────── */}
      <div className="card roster-card">
        <div className="roster-thead">
          <span className="rt-name">Nhân sự</span>
          <span className="rt-money">Lương CB <em>(tr ₫)</em></span>
          <span className="rt-money">Thưởng <em>(tr ₫)</em></span>
          <span className="rt-money">Khấu trừ <em>(tr ₫)</em></span>
          <span className="rt-net">Net</span>
          <span className="rt-money">Đã trả <em>(tr ₫)</em></span>
          <span className="rt-status">Trạng thái</span>
          <span className="rt-actions">Thao tác</span>
        </div>

        {roster.length === 0 ? (
          <div className="roster-empty">
            Chưa có nhân sự Lucid.<br />
            <span>Vào tab "Danh sách nhân sự" để thêm thành viên.</span>
          </div>
        ) : roster.map(({ person, record }) => {
          const row          = getRow(person, record);
          const netDong      = record ? record.netSalary : calcNetDong(row);
          const txnPaid      = txnPaidMap[person.name] || 0;
          const isAutoLinked = txnPaid > 0;
          const effectiveSt  = isAutoLinked ? autoStatus(txnPaid, netDong) : row.status;
          const st           = STATUS_MAP[effectiveSt];
          const dirty        = person.id in drafts;
          const busy         = saving[person.id] === true;
          const err          = errors[person.id];
          const isNew        = !record;
          const avatarColor  = TYPE_COLORS[person.type] || '#6c5ce7';

          return (
            <div key={person.id}
              className={`roster-row${dirty ? ' dirty' : ''}${isNew ? ' is-new' : ''}${busy ? ' is-saving' : ''}`}
            >
              {/* Name */}
              <span className="rt-name name-cell">
                <span className="r-avatar" style={{ background: avatarColor }}>
                  {person.name.charAt(0).toUpperCase()}
                </span>
                <span className="r-info">
                  <span className="r-fullname">{person.name}</span>
                  {person.role && <span className="r-role">{person.role}</span>}
                </span>
                {isNew  && <span className="unsaved-badge">Chưa lưu</span>}
                {dirty && !isNew && <span className="dirty-badge">Đã sửa</span>}
              </span>

              {/* Lương CB */}
              <span className="rt-money">
                <input className="ri" type="number" step="0.5" placeholder="0"
                  value={row.baseSalary} disabled={busy}
                  onChange={e => patch(person.id, person, record, 'baseSalary', e.target.value)} />
              </span>

              {/* Thưởng */}
              <span className="rt-money">
                <input className="ri ri-bonus" type="number" step="0.5" placeholder="0"
                  value={row.bonus} disabled={busy}
                  onChange={e => patch(person.id, person, record, 'bonus', e.target.value)} />
              </span>

              {/* Khấu trừ */}
              <span className="rt-money">
                <input className="ri ri-deduct" type="number" step="0.5" placeholder="0"
                  value={row.deduction} disabled={busy}
                  onChange={e => patch(person.id, person, record, 'deduction', e.target.value)} />
              </span>

              {/* Net */}
              <span className="rt-net">
                <strong className={`net-amount${netDong < 0 ? ' negative' : ''}`}>
                  {fmTr(netDong)}
                </strong>
              </span>

              {/* Đã trả — always from transactions, read-only */}
              <span className="rt-money">
                {isAutoLinked ? (
                  <div className="auto-paid">
                    <span className="auto-paid-val">{fmTr(txnPaid)}</span>
                    <span className="auto-badge" title="Tự động từ giao dịch Lương Lucid">🔗</span>
                  </div>
                ) : (
                  <div className="no-txn">
                    <span>—</span>
                    <span className="no-txn-hint">Chưa có GD</span>
                  </div>
                )}
              </span>

              {/* Status — always computed, read-only */}
              <span className="rt-status">
                <span className="status-auto"
                  style={{ color: st.color, background: `${st.color}18`, borderColor: `${st.color}55` }}>
                  {st.icon} {st.label}
                </span>
              </span>

              {/* Actions */}
              <span className="rt-actions action-cell" onClick={e => e.stopPropagation()}>
                {err && <span className="row-err" title={err}>⚠️</span>}
                {record && record.status !== 'paid' && !dirty && !isAutoLinked && (
                  <button className="act-btn pay" title="Trả hết ngay" disabled={busy}
                    onClick={() => quickPay(person, record)}>💸</button>
                )}
                {(dirty || isNew) && (
                  <button className="act-btn save" title="Lưu" disabled={busy}
                    onClick={() => saveRow(person, record)}>
                    {busy ? '⏳' : '💾'}
                  </button>
                )}
                {record && (
                  <button className="act-btn del" title="Xóa" disabled={busy}
                    onClick={() => setDeleteTarget({ person, record })}>🗑️</button>
                )}
              </span>
            </div>
          );
        })}

        {summary.saved > 0 && (
          <div className="roster-footer">
            <span>{summary.saved} nhân sự</span>
            <span>Net: <strong>{fmTr(summary.totalNet)}</strong></span>
            <span>Đã chi: <strong className="green">{fmTr(summary.totalPaid)}</strong></span>
            <span>Còn: <strong className="orange">{fmTr(summary.totalNet - summary.totalPaid)}</strong></span>
          </div>
        )}
      </div>

      {/* ── Delete Modal ───────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-icon">🗑️</div>
            <h3>Xóa lương của <strong>{deleteTarget.person.name}</strong>?</h3>
            <p>{formatMonth(month)} — {fmTr(deleteTarget.record.netSalary)}</p>
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
