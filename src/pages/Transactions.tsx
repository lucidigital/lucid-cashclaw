import { useState } from 'react';
import { useData } from '../data/DataContext';
import { formatVND, CATEGORIES_CHI, CATEGORIES_THU, type Transaction } from '../data/mockData';
import TransactionFormModal from '../components/TransactionFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import './Transactions.css';

const ALL_CATEGORIES = [...CATEGORIES_THU, ...CATEGORIES_CHI];
const catMap = Object.fromEntries(ALL_CATEGORIES.map(c => [c.code, c]));

export default function Transactions() {
  const { projects, transactions, deleteTransaction } = useData();
  const [typeFilter, setTypeFilter] = useState<'all' | 'thu' | 'chi'>('all');
  const [catFilter, setCatFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [deleteTxnId, setDeleteTxnId] = useState<number | null>(null);

  const filtered = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (catFilter && t.category !== catFilter) return false;
    if (projectFilter && t.projectId !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matched = t.description.toLowerCase().includes(q)
        || (t.person && t.person.toLowerCase().includes(q));
      if (!matched) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalThu = filtered.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
  const totalChi = filtered.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="txn-page animate-fade-in">
      {/* Toolbar */}
      <div className="txn-toolbar">
        <div className="txn-filters">
          <div className="type-pills">
            {(['all', 'thu', 'chi'] as const).map(f => (
              <button
                key={f}
                className={`pill ${typeFilter === f ? (f === 'thu' ? 'pill-thu' : f === 'chi' ? 'pill-chi' : 'active') : ''}`}
                onClick={() => setTypeFilter(f)}
              >
                {f === 'all' ? '📋 Tất cả' : f === 'thu' ? '📥 Thu' : '📤 Chi'}
              </button>
            ))}
          </div>
          <select className="input filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">🏷️ Tất cả danh mục</option>
            <optgroup label="📥 Thu">
              {CATEGORIES_THU.map(c => <option key={`thu-${c.code}`} value={c.code}>{c.icon} {c.name}</option>)}
            </optgroup>
            <optgroup label="📤 Chi">
              {CATEGORIES_CHI.map(c => <option key={`chi-${c.code}`} value={c.code}>{c.icon} {c.name}</option>)}
            </optgroup>
          </select>
          <select className="input filter-select" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="">📁 Tất cả project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            className="input search-input"
            placeholder="🔍 Tìm mô tả, người..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Thêm giao dịch
        </button>
      </div>

      {/* Summary pills */}
      <div className="txn-summary">
        <span className="summary-badge">{filtered.length} giao dịch</span>
        <span className="summary-badge text-income">📥 +{formatVND(totalThu)}</span>
        <span className="summary-badge text-expense">📤 −{formatVND(totalChi)}</span>
        <span className={`summary-badge ${totalThu - totalChi >= 0 ? 'text-income' : 'text-expense'}`}>
          📈 {formatVND(totalThu - totalChi)}
        </span>
      </div>

      {/* Table */}
      <div className="card txn-table-card">
        <div className="txn-table">
          <div className="txn-header">
            <span>Ngày</span>
            <span>Loại</span>
            <span>Project</span>
            <span>Danh mục</span>
            <span>Mô tả</span>
            <span>Người</span>
            <span className="txn-right">Số tiền</span>
            <span className="txn-right">Thao tác</span>
          </div>
          {filtered.map(t => {
            const project = projects.find(p => p.id === t.projectId);
            const cat = catMap[t.category];
            return (
              <div
                key={t.id}
                className="txn-row txn-row-clickable"
                onDoubleClick={() => setEditTxn(t)}
                title="Double-click để sửa"
              >
                <span className="txn-date">{new Date(t.date).toLocaleDateString('vi')}</span>
                <span className={`txn-type ${t.type}`}>
                  {t.type === 'thu' ? '📥 Thu' : '📤 Chi'}
                </span>
                <span className="txn-project">{project?.name || '—'}</span>
                <span className="txn-cat">{cat ? `${cat.icon} ${cat.name}` : t.category}</span>
                <span className="txn-desc">{t.description}</span>
                <span className="txn-person">{t.person || '—'}</span>
                <span className={`txn-amount ${t.type === 'thu' ? 'text-income' : 'text-expense'}`}>
                  {t.type === 'thu' ? '+' : '−'}{formatVND(t.amount)}
                </span>
                <span className="txn-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" title="Sửa" onClick={() => setEditTxn(t)}>✏️</button>
                  <button className="btn-icon" title="Xóa" onClick={() => setDeleteTxnId(t.id)}>🗑️</button>
                </span>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <span style={{ fontSize: '2rem' }}>📭</span>
            <p>Không có giao dịch nào</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionFormModal
        open={showAddModal || !!editTxn}
        onClose={() => { setShowAddModal(false); setEditTxn(null); }}
        editTransaction={editTxn}
      />
      <DeleteConfirmModal
        open={deleteTxnId !== null}
        onClose={() => setDeleteTxnId(null)}
        onConfirm={() => { if (deleteTxnId !== null) deleteTransaction(deleteTxnId); setDeleteTxnId(null); }}
        title="Xóa Giao Dịch?"
        description="Giao dịch này sẽ bị xóa vĩnh viễn. Ảnh hưởng đến tính toán tài chính. Không thể hoàn tác!"
      />
    </div>
  );
}
