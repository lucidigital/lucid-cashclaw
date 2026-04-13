// ─── Transaction Form Modal — Add / Edit ────────────────
import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import PersonAutocomplete from './PersonAutocomplete';
import BudgetLineAutocomplete from './BudgetLineAutocomplete';
import { CATEGORIES_THU, CATEGORIES_CHI, type Transaction } from '../data/mockData';
import { useData } from '../data/DataContext';

interface Props {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  defaultProjectId?: string;
}

export default function TransactionFormModal({ open, onClose, editTransaction, defaultProjectId }: Props) {
  const { projects, budgetLines, addTransaction, updateTransaction } = useData();
  const isEdit = !!editTransaction;

  const [type, setType] = useState<'thu' | 'chi'>('chi');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState('');
  const [person, setPerson] = useState('');
  const [budgetLineId, setBudgetLineId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'thu' ? CATEGORIES_THU : CATEGORIES_CHI;

  // Fill form
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount / 1_000_000));
      setCategory(editTransaction.category);
      setProjectId(editTransaction.projectId);
      setPerson(editTransaction.person || '');
      setBudgetLineId(editTransaction.budgetLineId);
      setDescription(editTransaction.description);
      setDate(editTransaction.date);
    } else {
      setType('chi');
      setAmount('');
      setCategory('');
      setProjectId(defaultProjectId || '');
      setPerson('');
      setBudgetLineId(undefined);
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editTransaction, defaultProjectId, open]);

  // Reset category when type changes (only for new transactions)
  useEffect(() => {
    if (!isEdit) setCategory('');
  }, [type, isEdit]);

  // Budget lines for current project + person (for Chi autocomplete)
  const filteredChiBudgetLines = useMemo(() =>
    budgetLines.filter(bl =>
      bl.projectId === projectId &&
      bl.type === 'chi' &&
      (!person || !bl.person || bl.person.toLowerCase() === person.toLowerCase())
    ),
    [budgetLines, projectId, person]
  );

  // Budget lines for current project (for Thu autocomplete)
  const filteredThuBudgetLines = useMemo(() =>
    budgetLines.filter(bl =>
      bl.projectId === projectId &&
      bl.type === 'thu'
    ),
    [budgetLines, projectId]
  );

  const parseAmount = (val: string): number => {
    const cleaned = val.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return num * 1_000_000;
  };

  const handleSave = () => {
    const amountNum = parseAmount(amount);
    if (amountNum <= 0 || !description.trim()) return;

    const data = {
      type,
      amount: amountNum,
      category: category || (type === 'chi' ? 'khac' : 'thukhac'),
      projectId,
      person: person.trim() || undefined,
      budgetLineId,
      description: description.trim(),
      date,
    };

    if (isEdit && editTransaction) {
      updateTransaction(editTransaction.id, data);
    } else {
      addTransaction(data);
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch'}
      icon={isEdit ? '✏️' : '💰'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? '💾 Lưu' : '✅ Thêm giao dịch'}
          </button>
        </>
      }
    >
      {/* Type toggle */}
      <div className="type-toggle">
        <button
          className={type === 'thu' ? 'active-thu' : ''}
          onClick={() => setType('thu')}
        >
          📥 THU
        </button>
        <button
          className={type === 'chi' ? 'active-chi' : ''}
          onClick={() => setType('chi')}
        >
          📤 CHI
        </button>
      </div>

      {/* Amount */}
      <div className="form-group">
        <label>Số tiền <span className="required">*</span></label>
        <div className="amount-input-wrapper">
          <input
            className="input"
            type="text"
            placeholder="VD: 40"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
          />
          <span className="currency">triệu ₫</span>
        </div>
      </div>

      {/* Project + Category */}
      <div className="form-row">
        <div className="form-group">
          <label>Project</label>
          <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">— Không thuộc project —</option>
            {projects.filter(p => p.status !== 'archived').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Danh mục</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">— Chọn danh mục —</option>
            {categories.map(c => (
              <option key={c.code} value={c.code}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Person + Date */}
      <div className="form-row">
        <div className="form-group">
          <label>Partners &amp; Staff</label>
          <PersonAutocomplete
            value={person}
            onChange={setPerson}
            placeholder="Hùng, Sound Studio..."
          />
        </div>
        <div className="form-group">
          <label>Ngày</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Mô tả <span className="required">*</span></label>
        {type === 'chi' ? (
          <BudgetLineAutocomplete
            value={description}
            budgetLineId={budgetLineId}
            onChange={(desc, lineId) => { setDescription(desc); setBudgetLineId(lineId); }}
            budgetLines={filteredChiBudgetLines}
            placeholder="Chọn từ dự toán hoặc ghi tự do..."
          />
        ) : projectId && filteredThuBudgetLines.length > 0 ? (
          <BudgetLineAutocomplete
            value={description}
            budgetLineId={budgetLineId}
            onChange={(desc, lineId) => { setDescription(desc); setBudgetLineId(lineId); }}
            budgetLines={filteredThuBudgetLines}
            placeholder="Chọn từ dự toán thu hoặc ghi tự do..."
          />
        ) : (
          <textarea
            className="input"
            placeholder="VD: Đặt cọc 50%, Thanh toán đợt 2..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
