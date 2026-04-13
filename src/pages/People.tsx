import { useState, useMemo } from 'react';
import { useData } from '../data/DataContext';
import { PEOPLE_TYPES } from '../data/mockData';
import type { Person } from '../data/mockData';
import Modal from '../components/Modal';
import './People.css';

// ─── Type config map ─────────────────────────────────
const TYPE_MAP = Object.fromEntries(PEOPLE_TYPES.map(t => [t.code, t]));

// ─── Empty form ──────────────────────────────────────
const emptyForm = (): Omit<Person, 'id' | 'createdAt'> => ({
  name: '', type: 'staff', role: '', phone: '', taxCode: '', bankInfo: '', note: '',
});

export default function People() {
  const { people, addPerson, updatePerson, deletePerson } = useData();

  // ─── UI State ────────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Filtered list ───────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return people.filter(p => {
      const matchType = typeFilter.size === 0 || typeFilter.has(p.type);
      const matchSearch = !q || [p.name, p.role, p.phone, p.taxCode].some(
        v => v?.toLowerCase().includes(q)
      );
      return matchType && matchSearch;
    });
  }, [people, search, typeFilter]);

  // ─── Counts per type ─────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: people.length };
    PEOPLE_TYPES.forEach(t => {
      c[t.code] = people.filter(p => p.type === t.code).length;
    });
    return c;
  }, [people]);

  // ─── Modal helpers ───────────────────────────────
  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(p: Person) {
    setEditing(p);
    setForm({ name: p.name, type: p.type, role: p.role || '', phone: p.phone || '', taxCode: p.taxCode || '', bankInfo: p.bankInfo || '', note: p.note || '' });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setDeleteConfirm(null);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        role: form.role?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        taxCode: form.taxCode?.trim() || undefined,
        bankInfo: form.bankInfo?.trim() || undefined,
        note: form.note?.trim() || undefined,
      };
      if (editing) {
        await updatePerson(editing.id, payload);
      } else {
        await addPerson(payload);
      }
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Lỗi: ' + (err instanceof Error ? err.message : 'Không thể lưu. Kiểm tra kết nối Supabase.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    setErrorMsg(null);
    try {
      await deletePerson(id);
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Lỗi: ' + (err instanceof Error ? err.message : 'Không thể xóa. Kiểm tra kết nối Supabase.'));
    } finally {
      setSaving(false);
    }
  }

  function f(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="people-page animate-fade-in">

      {/* ── Toolbar ───────────────────────────────── */}
      <div className="people-toolbar">
        <div className="people-search-wrap">
          <span className="people-search-icon">🔍</span>
          <input
            className="people-search"
            placeholder="Tìm tên, vị trí, MST..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openNew}>＋ Thêm mới</button>
      </div>

      {/* ── Filter Pills ──────────────────────────── */}
      <div className="people-filters">
        <button
          className={`ptype-pill ${typeFilter.size === 0 ? 'active' : ''}`}
          onClick={() => setTypeFilter(new Set())}
        >
          Tất cả <span className="pill-count">{counts.all}</span>
        </button>
        {PEOPLE_TYPES.map(t => (
          <button
            key={t.code}
            className={`ptype-pill ${typeFilter.has(t.code) ? 'active' : ''}`}
            style={typeFilter.has(t.code) ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}
            onClick={() => {
              setTypeFilter(prev => {
                const next = new Set(prev);
                if (next.has(t.code)) next.delete(t.code);
                else next.add(t.code);
                return next;
              });
            }}
          >
            {t.icon} {t.name} <span className="pill-count">{counts[t.code] || 0}</span>
          </button>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────── */}
      <div className="card people-table-card">
        <div className="people-table">
          <div className="people-thead">
            <span className="pt-num">#</span>
            <span className="pt-name">Tên</span>
            <span className="pt-type">Danh mục</span>
            <span className="pt-role">Vị trí</span>
            <span className="pt-phone">Số điện thoại</span>
            <span className="pt-tax">Mã số thuế</span>
            <span className="pt-actions">Thao tác</span>
          </div>

          {filtered.length === 0 ? (
            <div className="people-empty">
              {search || typeFilter.size > 0
                ? '😔 Không tìm thấy kết quả phù hợp'
                : 'Chưa có nhân sự / đối tác nào. Bấm "+ Thêm mới" để bắt đầu!'}
            </div>
          ) : filtered.map((p, idx) => {
            const t = TYPE_MAP[p.type];
            return (
              <div key={p.id} className="people-row" onClick={() => openEdit(p)}>
                <span className="pt-num">{idx + 1}</span>
                <span className="pt-name">
                  <span className="p-avatar" style={{ background: t?.color || '#6c5ce7' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="p-name-text">{p.name}</span>
                </span>
                <span className="pt-type">
                  <span className="ptype-badge" style={{ color: t?.color, background: `${t?.color}20`, borderColor: `${t?.color}40` }}>
                    {t?.icon} {t?.name}
                  </span>
                </span>
                <span className="pt-role">{p.role || '—'}</span>
                <span className="pt-phone">{p.phone || '—'}</span>
                <span className="pt-tax">{p.taxCode || '—'}</span>
                <span className="pt-actions" onClick={e => e.stopPropagation()}>
                  <button className="row-action-btn edit" title="Sửa" onClick={() => openEdit(p)}>✏️</button>
                  <button className="row-action-btn del" title="Xóa" onClick={() => { openEdit(p); setDeleteConfirm(p.id); }}>🗑️</button>
                </span>
              </div>
            );
          })}
        </div>
        <div className="people-footer">
          {filtered.length} / {people.length} người &amp; tổ chức
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? '✏️ Sửa thông tin' : '＋ Thêm nhân sự / đối tác'}
        footer={
          deleteConfirm ? (
            <>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={saving}>
                {saving ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </>
          ) : (
            <>
              {editing && (
                <button className="btn-danger-ghost" onClick={() => setDeleteConfirm(editing.id)}>🗑️ Xóa</button>
              )}
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={closeModal}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim() || saving}>
                {saving ? 'Đang lưu...' : editing ? '💾 Cập nhật' : '＋ Thêm'}
              </button>
            </>
          )
        }
      >
        {/* Error banner */}
        {errorMsg && (
          <div className="delete-confirm-banner" style={{ background: 'rgba(214,48,49,0.12)', borderColor: 'rgba(214,48,49,0.3)', marginBottom: 16 }}>
            <span>🚨 {errorMsg}</span>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setErrorMsg(null)}>Đóng</button>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm ? (
          <div className="delete-confirm" style={{ padding: '24px 0' }}>
            <div className="delete-icon">🗑️</div>
            <h3>Xóa {editing?.name}?</h3>
            <p>Hành động này không thể hoàn tác.</p>
          </div>
        ) : (
          <div className="people-form">
            {/* Tên */}
            <div className="form-group">
              <label className="form-label">Tên <span className="form-required">*</span></label>
              <input className="form-input input" placeholder="VD: Hùng, Sound Studio..." value={form.name} onChange={e => f('name', e.target.value)} autoFocus />
            </div>

            {/* Danh mục */}
            <div className="form-group">
              <label className="form-label">Danh mục <span className="form-required">*</span></label>
              <div className="ptype-selector">
                {PEOPLE_TYPES.map(t => (
                  <button
                    key={t.code}
                    className={`ptype-btn ${form.type === t.code ? 'active' : ''}`}
                    style={form.type === t.code ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}
                    onClick={() => f('type', t.code)}
                    type="button"
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Vị trí & SĐT */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Vị trí / Loại công việc</label>
                <input className="form-input input" placeholder="VD: VFX Compositor, Colorist..." value={form.role} onChange={e => f('role', e.target.value)} />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input input" placeholder="09xxxxxxxx" value={form.phone} onChange={e => f('phone', e.target.value)} />
              </div>
            </div>

            {/* MST & Ngân hàng */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Mã số thuế</label>
                <input className="form-input input" placeholder="0312xxxxxx" value={form.taxCode} onChange={e => f('taxCode', e.target.value)} />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Số TK / Ngân hàng</label>
                <input className="form-input input" placeholder="VD: VCB - 123456789" value={form.bankInfo} onChange={e => f('bankInfo', e.target.value)} />
              </div>
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label">Ghi chú</label>
              <textarea className="form-input input" rows={2} placeholder="Ghi chú thêm..." value={form.note} onChange={e => f('note', e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
