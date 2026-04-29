// ─── Project Form Modal — Add / Edit ────────────────
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { PROJECT_TYPES, type Project } from '../data/mockData';
import { useData } from '../data/DataContext';

const VAT_RATE = 0.08; // 8% VAT

interface Props {
  open: boolean;
  onClose: () => void;
  editProject?: Project | null;
}

export default function ProjectFormModal({ open, onClose, editProject }: Props) {
  const { addProject, updateProject } = useData();
  const isEdit = !!editProject;

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [type, setType] = useState(PROJECT_TYPES[0]);
  const [budget, setBudget] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [status, setStatus] = useState<Project['status']>('in_progress');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');

  // Fill form when editing
  useEffect(() => {
    if (editProject) {
      setName(editProject.name);
      setClient(editProject.client);
      setType(editProject.type);
      setBudget(String(editProject.budget / 1_000_000));
      setIncludeVat(false); // default off for edits — can't detect if already included
      setStatus(editProject.status);
      setStartDate(editProject.timeline?.start || '');
      setEndDate(editProject.timeline?.end || '');
      setNote(editProject.note || '');
    } else {
      setName(''); setClient(''); setType(PROJECT_TYPES[0]);
      setBudget(''); setIncludeVat(false); setStatus('in_progress');
      setStartDate(''); setEndDate(''); setNote('');
    }
  }, [editProject, open]);

  const parseBudget = (val: string): number => {
    const cleaned = val.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return num * 1_000_000; // triệu → VND
  };

  // Live preview
  const baseAmount = parseBudget(budget);
  const vatAmount = includeVat ? Math.round(baseAmount * VAT_RATE) : 0;
  const finalAmount = baseAmount + vatAmount;

  const fmtVND = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}tỷ`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('vi')}tr`;
    return n.toLocaleString('vi') + '₫';
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (baseAmount <= 0) return;

    const data = {
      name: name.trim(),
      client: client.trim(),
      type,
      budget: finalAmount, // VAT included if checked
      status,
      timeline: startDate && endDate ? { start: startDate, end: endDate } : undefined,
      note: note.trim() || undefined,
    };

    if (isEdit && editProject) {
      updateProject(editProject.id, data);
    } else {
      addProject(data);
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa Project' : 'Tạo Project Mới'}
      icon={isEdit ? '✏️' : '📁'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? '💾 Lưu thay đổi' : '✅ Tạo Project'}
          </button>
        </>
      }
    >
      {/* Name */}
      <div className="form-group">
        <label>Tên Project <span className="required">*</span></label>
        <input className="input" placeholder="VD: Knorr TVC" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>

      {/* Client + Type */}
      <div className="form-row">
        <div className="form-group">
          <label>Client</label>
          <input className="input" placeholder="VD: Unilever" value={client} onChange={e => setClient(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Loại <span className="required">*</span></label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Budget + VAT */}
      <div className="form-group">
        <label>Budget <span className="required">*</span></label>
        <div className="amount-input-wrapper">
          <input
            className="input"
            type="text"
            placeholder="210"
            value={budget}
            onChange={e => setBudget(e.target.value)}
          />
          <span className="currency">triệu ₫</span>
        </div>

        {/* VAT checkbox + live preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              id="vat-checkbox"
              checked={includeVat}
              onChange={e => setIncludeVat(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#6c63ff', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              Có VAT <span style={{ color: '#6c63ff', fontWeight: 600 }}>+8%</span>
            </span>
          </label>

          {includeVat && baseAmount > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.78rem',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}>
              <span>{fmtVND(baseAmount)}</span>
              <span style={{ color: '#6c63ff' }}>+ {fmtVND(vatAmount)}</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>= {fmtVND(finalAmount)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Status (only for edit) */}
      {isEdit && (
        <div className="form-group">
          <label>Trạng thái</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value as Project['status'])}>
            <option value="in_progress">🟡 In Progress</option>
            <option value="review">🟠 Review</option>
            <option value="completed">🟢 Completed</option>
            <option value="archived">⚫ Archived</option>
          </select>
        </div>
      )}

      {/* Timeline */}
      <div className="form-row">
        <div className="form-group">
          <label>Ngày bắt đầu</label>
          <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Ngày kết thúc</label>
          <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Note */}
      <div className="form-group">
        <label>Ghi chú</label>
        <textarea className="input" placeholder="Thông tin thêm..." value={note} onChange={e => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
