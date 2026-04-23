import { useState } from 'react';
import { formatVND, formatFullVND, type Transaction } from '../data/mockData';
import { useData } from '../data/DataContext';
import Modal from '../components/Modal';
import PersonAutocomplete from '../components/PersonAutocomplete';
import './DebtReview.css';

type TabId = 'debts' | 'advances' | 'receivables';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'debts', icon: '🔴', label: 'Nợ vay' },
  { id: 'advances', icon: '💵', label: 'Ứng trước' },
  { id: 'receivables', icon: '📋', label: 'Công nợ' },
];

export default function DebtReview() {
  const [activeTab, setActiveTab] = useState<TabId>('debts');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  return (
    <div className="debt-page animate-fade-in">
      {/* ── Tab Bar ──────────────────────────────── */}
      <div className="ledger-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ledger-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setSelectedPerson(null); }}
          >
            <span className="lt-icon">{tab.icon}</span>
            <span className="lt-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'debts' && <DebtsTab selected={selectedPerson} onSelect={setSelectedPerson} />}
      {activeTab === 'advances' && <AdvancesTab selected={selectedPerson} onSelect={setSelectedPerson} />}
      {activeTab === 'receivables' && <ReceivablesTab />}
    </div>
  );
}

// ─── Tab 1: Nợ vay ─────────────────────────────────
function DebtsTab({ selected, onSelect }: { selected: string | null; onSelect: (s: string | null) => void }) {
  const { getDebtSummary, manualDebts, addManualDebt, updateManualDebt, deleteManualDebt } = useData();
  const summary = getDebtSummary();
  const selectedEntry = summary.entries.find(e => e.name === selected);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPerson, setFormPerson] = useState('');
  const [formType, setFormType] = useState<'bank' | 'personal' | 'family'>('personal');
  const [formAmount, setFormAmount] = useState('');
  const [formRepaid, setFormRepaid] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function resetForm() {
    setEditingId(null); setFormPerson(''); setFormType('personal');
    setFormAmount(''); setFormRepaid(''); setFormNote('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormError(''); setShowDeleteConfirm(false);
  }

  function openNew() { resetForm(); setShowModal(true); }

  function openEdit(id: string) {
    const md = manualDebts.find(d => d.id === id);
    if (!md) return;
    setEditingId(id);
    setFormPerson(md.person);
    setFormType(md.type);
    setFormAmount(String(md.amount / 1_000_000));
    setFormRepaid(String(md.repaid / 1_000_000));
    setFormNote(md.note || '');
    setFormDate(md.date);
    setShowDeleteConfirm(false);
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount) * 1_000_000;
    const repaid = parseFloat(formRepaid || '0') * 1_000_000;
    if (!formPerson.trim() || amount <= 0) return;
    try {
      if (editingId) {
        await updateManualDebt(editingId, { person: formPerson.trim(), type: formType, amount, repaid, note: formNote, date: formDate });
      } else {
        await addManualDebt({ person: formPerson.trim(), type: formType, amount, repaid, note: formNote, date: formDate });
      }
      setShowModal(false); resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi lưu khoản nợ');
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    try {
      await deleteManualDebt(editingId);
      setShowModal(false); resetForm(); onSelect(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi xóa');
    }
  }

  const DEBT_TYPES: { code: 'bank' | 'personal' | 'family'; icon: string; label: string }[] = [
    { code: 'bank', icon: '🏦', label: 'Ngân hàng' },
    { code: 'personal', icon: '👤', label: 'Cá nhân' },
    { code: 'family', icon: '👨‍👩‍👧', label: 'Gia đình' },
  ];

  return (
    <>
      <div className="debt-overview stagger">
        <StatCard icon="💰" label="Tổng đã vay" value={summary.totalBorrowed} sub={formatFullVND(summary.totalBorrowed)} className="borrowed" />
        <StatCard icon="💸" label="Đã trả" value={summary.totalRepaid} sub={formatFullVND(summary.totalRepaid)} className="repaid" valueClass="text-income" />
        <StatCard icon="🔴" label="Còn nợ" value={summary.totalRemaining} sub={`${summary.activeCount} khoản còn nợ`} className="remaining"
          valueClass={summary.totalRemaining > 0 ? 'text-danger' : 'text-income'} />
      </div>

      <div className="debt-grid">
        <div className="card debt-list-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">📋 Danh sách khoản vay</h3>
            <button className="btn btn-primary" onClick={openNew}>＋ Thêm nợ</button>
          </div>
          <div className="debt-list">
            {summary.entries.map(entry => {
              const isActive = entry.name === selected;
              const isPaidOff = entry.remaining <= 0;
              return (
                <div key={entry.name} className={`debt-row ${isActive ? 'active' : ''} ${isPaidOff ? 'paid-off' : ''}`}
                  onClick={() => onSelect(isActive ? null : entry.name)}>
                  <div className="debt-row-left">
                    <div className="debt-avatar">{entry.type === 'bank' ? '🏦' : entry.type === 'family' ? '👨‍👩‍👧' : '👤'}</div>
                    <div className="debt-row-info">
                      <span className="debt-row-name">
                        {entry.name}
                        {entry.isManual && <span className="manual-badge" title="Nhập tay">📝</span>}
                      </span>
                      <span className="debt-row-type">{entry.typeLabel}</span>
                    </div>
                  </div>
                  <div className="debt-row-right">
                    <div className="debt-row-amounts">
                      <span className="debt-row-borrowed">Vay: {formatVND(entry.borrowed)}</span>
                      <span className="debt-row-repaid">Trả: {formatVND(entry.repaid)}</span>
                    </div>
                    <div className="debt-row-remaining-box">
                      <span className={`debt-row-remaining ${isPaidOff ? 'cleared' : ''}`}>
                        {isPaidOff ? '✅ Đã trả hết' : formatVND(entry.remaining)}
                      </span>
                      {!isPaidOff && (
                        <div className="debt-progress">
                          <div className="debt-progress-fill" style={{ width: `${Math.round((entry.repaid / entry.borrowed) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {summary.entries.length === 0 && (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📭</span>
                <p>Chưa có khoản nợ nào</p>
                <button className="btn btn-primary" onClick={openNew} style={{ marginTop: 8 }}>＋ Thêm khoản nợ đầu tiên</button>
              </div>
            )}
          </div>
        </div>

        <DetailPanel
          entry={selectedEntry ? {
            name: selectedEntry.name,
            avatar: selectedEntry.type === 'bank' ? '🏦' : selectedEntry.type === 'family' ? '👨‍👩‍👧' : '👤',
            typeLabel: selectedEntry.typeLabel,
            stat1: { label: 'Tổng vay', value: selectedEntry.borrowed },
            stat2: { label: 'Đã trả', value: selectedEntry.repaid, cls: 'text-income' },
            stat3: { label: 'Còn nợ', value: selectedEntry.remaining, cls: selectedEntry.remaining > 0 ? 'text-danger' : 'text-income' },
            note: selectedEntry.note,
            transactions: selectedEntry.transactions,
            isManual: selectedEntry.isManual,
            manualIds: selectedEntry.manualIds,
            onEdit: (id: string) => openEdit(id),
          } : null}
          emptyIcon="🏦"
          emptyText="Chọn một khoản vay để xem chi tiết"
        />
      </div>

      {/* ─── Manual Debt Modal ───────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? '✏️ Sửa khoản nợ' : '＋ Thêm khoản nợ'}
        icon=""
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%' }}>
            <div>
              {editingId && !showDeleteConfirm && (
                <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>🗑 Xóa</button>
              )}
              {showDeleteConfirm && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>Xóa khoản nợ này?</span>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>Xác nhận xóa</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>Hủy</button>
              <button type="submit" form="manual-debt-form" className="btn btn-primary"
                disabled={!formPerson.trim() || !formAmount || parseFloat(formAmount) <= 0}>
                💾 {editingId ? 'Cập nhật' : 'Lưu'}
              </button>
            </div>
          </div>
        }
      >
        <form id="manual-debt-form" onSubmit={handleSubmit}>
          {formError && <div style={{ background: 'rgba(214,48,49,0.15)', color: 'var(--color-danger)', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '0.85rem' }}>{formError}</div>}

          <div className="form-group">
            <label className="form-label">Tên chủ nợ <span className="form-required">*</span></label>
            <PersonAutocomplete
              value={formPerson}
              onChange={setFormPerson}
              placeholder="VD: Ngân hàng VCB, Anh Tuấn..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Loại</label>
            <div className="status-pills">
              {DEBT_TYPES.map(dt => (
                <button key={dt.code} type="button"
                  className={`status-pill ${formType === dt.code ? 'active' : ''}`}
                  style={{ '--pill-color': dt.code === 'bank' ? '#74b9ff' : dt.code === 'family' ? '#fdcb6e' : '#dfe6e9', '--pill-bg': dt.code === 'bank' ? 'rgba(116,185,255,0.1)' : dt.code === 'family' ? 'rgba(253,203,110,0.1)' : 'rgba(223,230,233,0.1)' } as React.CSSProperties}
                  onClick={() => setFormType(dt.code)}>
                  {dt.icon} {dt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Số tiền vay <span className="form-required">*</span></label>
            <div className="amount-input-wrapper">
              <input className="input" type="number" step="any" placeholder="VD: 50" value={formAmount} onChange={e => setFormAmount(e.target.value)} required />
              <span className="currency">triệu ₫</span>
            </div>
            {formAmount && parseFloat(formAmount) > 0 && (
              <span className="form-hint amount-preview">= {formatFullVND(parseFloat(formAmount) * 1_000_000)}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Đã trả</label>
            <div className="amount-input-wrapper">
              <input className="input" type="number" step="any" placeholder="0" value={formRepaid} onChange={e => setFormRepaid(e.target.value)} />
              <span className="currency">triệu ₫</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ngày vay</label>
            <input className="input" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="input" rows={2} placeholder="Ghi chú thêm..." value={formNote} onChange={e => setFormNote(e.target.value)} />
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Tab 2: Ứng trước ──────────────────────────────
function AdvancesTab({ selected, onSelect }: { selected: string | null; onSelect: (s: string | null) => void }) {
  const { getAdvanceSummary } = useData();
  const summary = getAdvanceSummary();
  const selectedEntry = summary.entries.find(e => e.name === selected);

  return (
    <>
      <div className="debt-overview stagger">
        <StatCard icon="💵" label="Tổng đã ứng" value={summary.totalAdvanced} sub={formatFullVND(summary.totalAdvanced)} className="borrowed" />
        <StatCard icon="💸" label="Đã thu lại" value={summary.totalReturned} sub={formatFullVND(summary.totalReturned)} className="repaid" valueClass="text-income" />
        <StatCard icon="⚠️" label="Còn thiếu" value={summary.totalOutstanding} sub={`${summary.activeCount} người chưa hoàn`} className="remaining"
          valueClass={summary.totalOutstanding > 0 ? 'text-danger' : 'text-income'} />
      </div>

      <div className="debt-grid">
        <div className="card debt-list-card">
          <h3 className="dash-card-title">👥 Nhân viên đang ứng</h3>
          <div className="debt-list">
            {summary.entries.map(entry => {
              const isActive = entry.name === selected;
              const isPaidOff = entry.outstanding <= 0;
              return (
                <div key={entry.name} className={`debt-row ${isActive ? 'active' : ''} ${isPaidOff ? 'paid-off' : ''}`}
                  onClick={() => onSelect(isActive ? null : entry.name)}>
                  <div className="debt-row-left">
                    <div className="debt-avatar">👤</div>
                    <div className="debt-row-info">
                      <span className="debt-row-name">{entry.name}</span>
                      <span className="debt-row-type">Nhân viên / Freelancer</span>
                    </div>
                  </div>
                  <div className="debt-row-right">
                    <div className="debt-row-amounts">
                      <span className="debt-row-borrowed">Ứng: {formatVND(entry.advanced)}</span>
                      <span className="debt-row-repaid">Trả: {formatVND(entry.returned)}</span>
                    </div>
                    <div className="debt-row-remaining-box">
                      <span className={`debt-row-remaining ${isPaidOff ? 'cleared' : ''}`}>
                        {isPaidOff ? '✅ Đã hoàn trả' : formatVND(entry.outstanding)}
                      </span>
                      {!isPaidOff && entry.advanced > 0 && (
                        <div className="debt-progress">
                          <div className="debt-progress-fill" style={{ width: `${Math.round((entry.returned / entry.advanced) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DetailPanel
          entry={selectedEntry ? {
            name: selectedEntry.name,
            avatar: '👤',
            typeLabel: 'Nhân viên / Freelancer',
            stat1: { label: 'Tổng ứng', value: selectedEntry.advanced },
            stat2: { label: 'Đã thu lại', value: selectedEntry.returned, cls: 'text-income' },
            stat3: { label: 'Còn thiếu', value: selectedEntry.outstanding, cls: selectedEntry.outstanding > 0 ? 'text-danger' : 'text-income' },
            transactions: selectedEntry.transactions,
          } : null}
          emptyIcon="💵"
          emptyText="Chọn người để xem lịch sử ứng"
        />
      </div>
    </>
  );
}

// ─── Tab 3: Công nợ (Receivables + Payables) ────────
function ReceivablesTab() {
  const { getReceivablesSummary, getPayableSummary, people } = useData();
  const [payFilter, setPayFilter] = useState<string>('all');
  const [paySearch, setPaySearch] = useState('');

  const recvSummary = getReceivablesSummary();
  const paySummary = getPayableSummary();

  // Build a map of person name → type using people list
  const personTypeMap = Object.fromEntries(people.map(p => [p.name.toLowerCase(), p.type]));

  // People type filter options (mirrors Partners & Staff)
  const TYPE_FILTERS = [
    { code: 'all', label: 'Tất cả' },
    { code: 'staff', label: '👥 Staff' },
    { code: 'freelance', label: '👤 Freelance' },
    { code: 'supplier', label: '🏭 Supplier' },
    { code: 'partners', label: 'u{1F91D} Partners' },
    { code: 'org', label: '🏦 Tổ chức' },
  ];

  // Filter + search payables
  const filteredPayables = paySummary.entries
    .filter(e => e.outstanding > 0)
    .filter(e => {
      if (payFilter === 'all') return true;
      const type = personTypeMap[e.person.toLowerCase()];
      return type === payFilter;
    })
    .filter(e => {
      if (!paySearch.trim()) return true;
      return e.person.toLowerCase().includes(paySearch.toLowerCase());
    });

  const totalPayableFiltered = filteredPayables.reduce((s, e) => s + e.outstanding, 0);

  return (
    <>
      <div className="debt-overview stagger">
        <StatCard icon="📥" label="Phải thu (client nợ)" value={recvSummary.totalReceivable}
          sub={`${recvSummary.receivables.length} job còn nợ`} className="borrowed" valueClass="text-income" />
        <StatCard icon="📤" label="Phải trả (mình nợ)" value={paySummary.totalOutstanding}
          sub={`${paySummary.activeCount} người chưa nhận đủ`} className="remaining" valueClass="text-expense" />
        <StatCard icon="📊" label="Chênh lệch ròng"
          value={recvSummary.totalReceivable - paySummary.totalOutstanding}
          sub={(recvSummary.totalReceivable - paySummary.totalOutstanding) >= 0 ? '✅ Tích cực' : '⚠️ Âm — đang nợ nhiều hơn thu'}
          className="repaid"
          valueClass={(recvSummary.totalReceivable - paySummary.totalOutstanding) >= 0 ? 'text-income' : 'text-danger'} />
      </div>

      <div className="receivables-grid">
        {/* ── Phải thu: per-job ──────────────────── */}
        <div className="card recv-card">
          <h3 className="dash-card-title recv-title receivable">📥 Phải thu — Client còn nợ theo job</h3>
          <div className="recv-list">
            {recvSummary.receivables.map(r => (
              <div key={r.id} className="recv-row">
                <div className="recv-row-left">
                  <div className="recv-avatar">🎬</div>
                  <div className="recv-info">
                    <span className="recv-name">{r.project}</span>
                    <span className="recv-project">Client: {r.name}</span>
                  </div>
                </div>
                <div className="recv-row-right">
                  <div className="recv-amounts">
                    <span className="recv-total">HĐ: {formatVND(r.total)}</span>
                    <span className="recv-paid text-income">Đã nhận: {formatVND(r.paid)}</span>
                  </div>
                  <div className="recv-outstanding-box">
                    <span className="recv-outstanding text-income">{formatVND(r.outstanding)}</span>
                    <div className="debt-progress">
                      <div className="debt-progress-fill" style={{ width: `${r.total > 0 ? Math.round((r.paid / r.total) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {recvSummary.receivables.length === 0 && (
              <div className="recv-empty">✅ Tất cả job đã thanh toán đủ</div>
            )}
          </div>
          <div className="recv-total-bar receivable">
            <span>Tổng phải thu</span>
            <span className="text-income" style={{ fontWeight: 800 }}>{formatVND(recvSummary.totalReceivable)}</span>
          </div>
        </div>

        {/* ── Phải trả: per-person with filter + search ── */}
        <div className="card recv-card">
          <h3 className="dash-card-title recv-title payable">📤 Phải trả — Số tiền còn nợ staff/vendor</h3>

          {/* Search */}
          <div className="recv-search-wrap">
            <span className="recv-search-icon">🔍</span>
            <input
              className="recv-search-input"
              placeholder="Tìm tên staff, freelance..."
              value={paySearch}
              onChange={e => setPaySearch(e.target.value)}
            />
          </div>

          {/* Filter pills by type */}
          <div className="recv-filter-pills">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.code}
                className={`recv-pill ${payFilter === f.code ? 'active' : ''}`}
                onClick={() => setPayFilter(f.code)}
              >
                {f.label}
                {f.code !== 'all' && (
                  <span className="recv-pill-count">
                    {paySummary.entries.filter(e => e.outstanding > 0 && (personTypeMap[e.person.toLowerCase()] || 'staff') === f.code).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="recv-list">
            {filteredPayables.map(e => {
              const personType = personTypeMap[e.person.toLowerCase()] || 'staff';
              const typeIcon = { leader: 'u{1F451}', staff: 'u{1F465}', freelance: 'u{1F464}', partners: 'u{1F91D}', supplier: 'u{1F3E2}', org: 'u{1F3E6}' }[personType] || '👤';
              return (
                <div key={e.person} className="recv-row">
                  <div className="recv-row-left">
                    <div className="recv-avatar">{typeIcon}</div>
                    <div className="recv-info">
                      <span className="recv-name">{e.person}</span>
                      <span className="recv-project">{e.jobs.map(j => j.projectName).join(', ')}</span>
                    </div>
                  </div>
                  <div className="recv-row-right">
                    <div className="recv-amounts">
                      <span className="recv-total">HĐ: {formatVND(e.totalContract)}</span>
                      <span className="recv-paid text-expense">Đã trả: {formatVND(e.totalPaid)}</span>
                    </div>
                    <div className="recv-outstanding-box">
                      <span className="recv-outstanding text-expense">{formatVND(e.outstanding)}</span>
                      <div className="debt-progress">
                        <div className="debt-progress-fill expense"
                          style={{ width: `${e.totalContract > 0 ? Math.round((e.totalPaid / e.totalContract) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredPayables.length === 0 && (
              <div className="recv-empty">✅ Không còn nợ ai trong mục này</div>
            )}
          </div>
          <div className="recv-total-bar payable">
            <span>Tổng phải trả {payFilter !== 'all' || paySearch ? '(đang lọc)' : ''}</span>
            <span className="text-expense" style={{ fontWeight: 800 }}>{formatVND(totalPayableFiltered)}</span>
          </div>
        </div>
      </div>
    </>
  );
}



// ─── Shared Components ──────────────────────────────
function StatCard({ icon, label, value, sub, className, valueClass }: {
  icon: string; label: string; value: number; sub: string; className?: string; valueClass?: string;
}) {
  return (
    <div className={`debt-stat-card animate-slide-up`}>
      <div className={`debt-stat-icon ${className || ''}`}>{icon}</div>
      <div className="debt-stat-body">
        <span className="debt-stat-label">{label}</span>
        <span className={`debt-stat-value ${valueClass || ''}`}>{formatVND(value)}</span>
        <span className="debt-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

function DetailPanel({ entry, emptyIcon, emptyText }: {
  entry: {
    name: string; avatar: string; typeLabel: string;
    stat1: { label: string; value: number; cls?: string };
    stat2: { label: string; value: number; cls?: string };
    stat3: { label: string; value: number; cls?: string };
    note?: string;
    transactions: Transaction[];
    isManual?: boolean;
    manualIds?: string[];
    onEdit?: (id: string) => void;
  } | null;
  emptyIcon: string; emptyText: string;
}) {
  if (!entry) {
    return (
      <div className="card debt-detail-card">
        <div className="debt-detail-empty">
          <div className="empty-icon">{emptyIcon}</div>
          <p>{emptyText}</p>
          <span className="empty-hint">Click vào tên người/tổ chức bên trái</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card debt-detail-card">
      <div className="debt-detail-header">
        <div className="debt-detail-avatar">{entry.avatar}</div>
        <div>
          <h3 className="debt-detail-name">{entry.name}</h3>
          <span className="debt-detail-type">{entry.typeLabel}</span>
        </div>
        {entry.isManual && entry.manualIds && entry.onEdit && (
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }}
            onClick={() => entry.onEdit!(entry.manualIds![0])}>
            ✏️ Sửa
          </button>
        )}
      </div>
      {entry.isManual && (
        <div style={{ marginBottom: 8 }}>
          <span className="manual-badge-large">📝 Khoản nợ nhập tay</span>
        </div>
      )}
      <div className="debt-detail-stats">
        <div className="debt-detail-stat">
          <span className="dds-label">{entry.stat1.label}</span>
          <span className={`dds-value ${entry.stat1.cls || ''}`}>{formatFullVND(entry.stat1.value)}</span>
        </div>
        <div className="debt-detail-stat">
          <span className="dds-label">{entry.stat2.label}</span>
          <span className={`dds-value ${entry.stat2.cls || ''}`}>{formatFullVND(entry.stat2.value)}</span>
        </div>
        <div className="debt-detail-stat highlight">
          <span className="dds-label">{entry.stat3.label}</span>
          <span className={`dds-value ${entry.stat3.cls || ''}`}>{formatFullVND(entry.stat3.value)}</span>
        </div>
      </div>
      {entry.note && <div className="debt-detail-note">📝 {entry.note}</div>}
      <h4 className="debt-history-title">📋 Lịch sử giao dịch</h4>
      <div className="debt-history">
        {entry.transactions.map(t => (
          <div key={t.id} className="debt-tx-row">
            <span className="debt-tx-date">{new Date(t.date).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' })}</span>
            <span className={`debt-tx-icon ${t.type === 'thu' ? 'borrow' : 'repay'}`}>
              {t.type === 'thu' ? '💵 THU' : '💸 CHI'}
            </span>
            <span className="debt-tx-desc">{t.description}</span>
            <span className={`debt-tx-amount ${t.type === 'thu' ? 'text-income' : 'text-expense'}`}>
              {t.type === 'thu' ? '+' : '−'}{formatVND(t.amount)}
            </span>
          </div>
        ))}
        {entry.transactions.length === 0 && (
          <div className="empty-state" style={{ padding: '1rem', fontSize: '0.85rem' }}>
            Chưa có giao dịch liên quan
          </div>
        )}
      </div>
    </div>
  );
}
