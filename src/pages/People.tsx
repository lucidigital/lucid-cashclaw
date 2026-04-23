import { useState, useMemo } from 'react';
import { useData } from '../data/DataContext';
import { PEOPLE_TYPES, ORG_INDUSTRIES } from '../data/mockData';
import type { Person } from '../data/mockData';
import Modal from '../components/Modal';
import StaffSalary from './StaffSalary';
import './People.css';
import './StaffSalary.css';

// ─── Type config map ─────────────────────────────────
const TYPE_MAP = Object.fromEntries(PEOPLE_TYPES.map(t => [t.code, t]));

// Danh bạ = leader/staff/freelance/partners | Tổ chức = org/supplier
const CONTACT_TYPES   = ['leader', 'staff', 'freelance', 'partners'];
const ORG_TYPES       = ['org', 'supplier'];
const CONTACT_TYPE_LIST = PEOPLE_TYPES.filter(t => CONTACT_TYPES.includes(t.code));
const ORG_TYPE_LIST     = PEOPLE_TYPES.filter(t => ORG_TYPES.includes(t.code));

// ─── Empty form ──────────────────────────────────────
const emptyForm = (): Omit<Person, 'id' | 'createdAt'> => ({
  name: '', type: 'staff', role: '', phone: '', taxCode: '', bankInfo: '',
  baseSalary: 0, note: '', industry: '', representative: '', location: '',
});

export default function People() {
  const { people, addPerson, updatePerson, deletePerson } = useData();

  // ─── Tab state ────────────────────────────
  const [activeTab, setActiveTab] = useState<'people' | 'orgs' | 'salary'>('people');
  const [repFilter, setRepFilter] = useState<string>('all');

  // ─── UI State ────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Person | null>(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // ─── Derived lists ───────────────────────────────
  const contacts = useMemo(() => people.filter(p => CONTACT_TYPES.includes(p.type)), [people]);
  const orgs     = useMemo(() => people.filter(p => ORG_TYPES.includes(p.type)), [people]);

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contacts.filter(p => {
      const matchType   = typeFilter.size === 0 || typeFilter.has(p.type);
      const matchSearch = !q || [p.name, p.role, p.phone, p.taxCode].some(v => v?.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [contacts, search, typeFilter]);

  const filteredOrgs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orgs.filter(p => {
      const matchType   = typeFilter.size === 0 || typeFilter.has(p.type);
      const matchSearch = !q || [p.name, p.industry, p.phone, p.taxCode, p.location, p.representative].some(v => v?.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [orgs, search, typeFilter]);

  // Representative dropdown options filtered by repFilter
  const repOptions = useMemo(() => {
    if (repFilter === 'all') return people;
    return people.filter(p => p.type === repFilter);
  }, [people, repFilter]);

  const isOrgForm = ORG_TYPES.includes(form.type);

  // ─── Modal helpers ───────────────────────────────
  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm(), type: activeTab === 'orgs' ? 'org' : 'staff' });
    setModalOpen(true);
  }

  function openEdit(p: Person) {
    setEditing(p);
    setForm({
      name: p.name, type: p.type, role: p.role || '', phone: p.phone || '',
      taxCode: p.taxCode || '', bankInfo: p.bankInfo || '', baseSalary: p.baseSalary || 0,
      note: p.note || '', industry: p.industry || '', representative: p.representative || '',
      location: p.location || '',
    });
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
        name: form.name.trim(), type: form.type,
        role: form.role?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        taxCode: form.taxCode?.trim() || undefined,
        bankInfo: form.bankInfo?.trim() || undefined,
        baseSalary: form.baseSalary || undefined,
        note: form.note?.trim() || undefined,
        industry: form.industry?.trim() || undefined,
        representative: form.representative?.trim() || undefined,
        location: form.location?.trim() || undefined,
      };
      if (editing) { await updatePerson(editing.id, payload); }
      else { await addPerson(payload); }
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Lỗi: ' + (err instanceof Error ? err.message : 'Không thể lưu. Kiểm tra kết nối Supabase.'));
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await deletePerson(id);
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Không thể xóa.');
    } finally { setSaving(false); }
  }

  function f(key: keyof typeof form, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function toggleTypeFilter(code: string) {
    setTypeFilter(prev => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code); else n.add(code);
      return n;
    });
  }

  return (
    <div className="people-page animate-fade-in">

      {/* ── Tab Navigation ────────────────────── */}
      <div className="people-tabs">
        <button className={`ptab-btn ${activeTab === 'people' ? 'active' : ''}`} onClick={() => { setActiveTab('people'); setTypeFilter(new Set()); }}>
          📒 Danh Bạ
        </button>
        <button className={`ptab-btn ${activeTab === 'orgs' ? 'active' : ''}`} onClick={() => { setActiveTab('orgs'); setTypeFilter(new Set()); }}>
          🏢 Tổ Chức
        </button>
        <button className={`ptab-btn ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>
          💰 Bảng lương Lucid
        </button>
      </div>

      {/* ── Tab Content ─────────────────────── */}
      {activeTab === 'salary' && <StaffSalary />}

      {(activeTab === 'people' || activeTab === 'orgs') && (
        <>
          {/* ── Toolbar ─────────────────────────── */}
          <div className="people-toolbar">
            <div className="people-search-wrap">
              <span className="people-search-icon">🔍</span>
              <input className="people-search"
                placeholder={activeTab === 'orgs' ? 'Tìm tên, phân ngành, MST...' : 'Tìm tên, vị trí, MST...'}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openNew}>＋ Thêm mới</button>
          </div>

          {/* ── Filter Pills ─────────────────────── */}
          <div className="people-filters">
            <button className={`ptype-pill ${typeFilter.size === 0 ? 'active' : ''}`} onClick={() => setTypeFilter(new Set())}>
              Tất cả <span className="pill-count">{activeTab === 'orgs' ? orgs.length : contacts.length}</span>
            </button>
            {(activeTab === 'orgs' ? ORG_TYPE_LIST : CONTACT_TYPE_LIST).map(t => (
              <button key={t.code}
                className={`ptype-pill ${typeFilter.has(t.code) ? 'active' : ''}`}
                style={typeFilter.has(t.code) ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}
                onClick={() => toggleTypeFilter(t.code)}>
                {t.icon} {t.name} <span className="pill-count">{people.filter(p => p.type === t.code).length}</span>
              </button>
            ))}
          </div>

          {/* ── Danh Bạ Table ───────────────────── */}
          {activeTab === 'people' && (
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
                {filteredContacts.length === 0 ? (
                  <div className="people-empty">
                    {search || typeFilter.size > 0 ? '😔 Không tìm thấy kết quả phù hợp' : 'Chưa có nhân sự nào. Bấm "+ Thêm mới" để bắt đầu!'}
                  </div>
                ) : filteredContacts.map((p, idx) => {
                  const t = TYPE_MAP[p.type];
                  return (
                    <div key={p.id} className="people-row" onDoubleClick={() => openEdit(p)} title="Double-click để sửa">
                      <span className="pt-num">{idx + 1}</span>
                      <span className="pt-name">
                        <span className="p-avatar" style={{ background: t?.color || '#6c5ce7' }}>{p.name.charAt(0).toUpperCase()}</span>
                        <span className="p-name-text">{p.name}</span>
                      </span>
                      <span className="pt-type">
                        <span className="ptype-badge" style={{ color: t?.color, background: `${t?.color}20`, borderColor: `${t?.color}40` }}>{t?.icon} {t?.name}</span>
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
              <div className="people-footer">{filteredContacts.length} / {contacts.length} nhân sự</div>
            </div>
          )}

          {/* ── Tổ Chức Table ───────────────────── */}
          {activeTab === 'orgs' && (
            <div className="card people-table-card">
              <div className="org-table">
                <div className="org-thead">
                  <span className="pt-num">#</span>
                  <span className="ot-name">Tên tổ chức</span>
                  <span className="ot-industry">Phân ngành</span>
                  <span className="ot-rep">Người đại diện</span>
                  <span className="ot-phone">Số điện thoại</span>
                  <span className="ot-tax">MST</span>
                  <span className="ot-loc">Địa điểm</span>
                  <span className="pt-actions">Thao tác</span>
                </div>
                {filteredOrgs.length === 0 ? (
                  <div className="people-empty">
                    {search || typeFilter.size > 0 ? '😔 Không tìm thấy kết quả phù hợp' : 'Chưa có tổ chức nào. Bấm "+ Thêm mới" để bắt đầu!'}
                  </div>
                ) : filteredOrgs.map((p, idx) => {
                  const t = TYPE_MAP[p.type];
                  return (
                    <div key={p.id} className="org-row" onDoubleClick={() => openEdit(p)} title="Double-click để sửa">
                      <span className="pt-num">{idx + 1}</span>
                      <span className="ot-name">
                        <span className="p-avatar" style={{ background: t?.color || '#6c5ce7' }}>{p.name.charAt(0).toUpperCase()}</span>
                        <span className="p-name-text">
                          {p.name}
                          <span className="ptype-badge" style={{ color: t?.color, background: `${t?.color}20`, borderColor: `${t?.color}40`, marginLeft: 6, fontSize: '0.72rem' }}>{t?.icon} {t?.name}</span>
                        </span>
                      </span>
                      <span className="ot-industry">
                        {p.industry ? <span className="industry-badge">{p.industry}</span> : <span className="text-muted">—</span>}
                      </span>
                      <span className="ot-rep">{p.representative || <span className="text-muted">—</span>}</span>
                      <span className="ot-phone">{p.phone || '—'}</span>
                      <span className="ot-tax">{p.taxCode || '—'}</span>
                      <span className="ot-loc">{p.location || '—'}</span>
                      <span className="pt-actions" onClick={e => e.stopPropagation()}>
                        <button className="row-action-btn edit" title="Sửa" onClick={() => openEdit(p)}>✏️</button>
                        <button className="row-action-btn del" title="Xóa" onClick={() => { openEdit(p); setDeleteConfirm(p.id); }}>🗑️</button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="people-footer">{filteredOrgs.length} / {orgs.length} tổ chức</div>
            </div>
          )}

          {/* ── Modal ───────────────────────────── */}
          <Modal open={modalOpen} onClose={closeModal}
            title={editing ? '✏️ Sửa thông tin' : (isOrgForm ? '＋ Thêm tổ chức' : '＋ Thêm vào danh bạ')}
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
                  {editing && <button className="btn-danger-ghost" onClick={() => setDeleteConfirm(editing.id)}>🗑️ Xóa</button>}
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-ghost" onClick={closeModal}>Hủy</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim() || saving}>
                    {saving ? 'Đang lưu...' : editing ? '💾 Cập nhật' : '＋ Thêm'}
                  </button>
                </>
              )
            }
          >
            {errorMsg && (
              <div className="delete-confirm-banner" style={{ background: 'rgba(214,48,49,0.12)', borderColor: 'rgba(214,48,49,0.3)', marginBottom: 16 }}>
                <span>🚨 {errorMsg}</span>
                <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setErrorMsg(null)}>Đóng</button>
              </div>
            )}
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
                  <input className="form-input input"
                    placeholder={isOrgForm ? 'VD: Unilever, ACB...' : 'VD: Hùng, Sound Studio...'}
                    value={form.name} onChange={e => f('name', e.target.value)} autoFocus />
                </div>

                {/* Danh mục */}
                <div className="form-group">
                  <label className="form-label">Danh mục <span className="form-required">*</span></label>
                  <div className="ptype-selector">
                    {(isOrgForm ? ORG_TYPE_LIST : CONTACT_TYPE_LIST).map(t => (
                      <button key={t.code}
                        className={`ptype-btn ${form.type === t.code ? 'active' : ''}`}
                        style={form.type === t.code ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}
                        onClick={() => f('type', t.code)} type="button">
                        {t.icon} {t.name}
                      </button>
                    ))}
                    <button type="button" className="ptype-btn switch-group-btn"
                      onClick={() => f('type', isOrgForm ? 'staff' : 'org')}>
                      {isOrgForm ? '→ Nhân sự' : '→ Tổ chức'}
                    </button>
                  </div>
                </div>

                {/* ─── Org fields ─── */}
                {isOrgForm ? (
                  <>
                    {/* Phân ngành */}
                    <div className="form-group">
                      <label className="form-label">🏭 Phân ngành</label>
                      <div className="industry-pills">
                        {ORG_INDUSTRIES.map(ind => (
                          <button key={ind} type="button"
                            className={`industry-pill ${form.industry === ind ? 'active' : ''}`}
                            onClick={() => f('industry', form.industry === ind ? '' : ind)}>
                            {ind}
                          </button>
                        ))}
                      </div>
                      <input className="form-input input" style={{ marginTop: 8 }}
                        placeholder="Hoặc nhập tự do..."
                        value={form.industry || ''} onChange={e => f('industry', e.target.value)} />
                    </div>

                    {/* Người đại diện */}
                    <div className="form-group">
                      <label className="form-label">👤 Người đại diện</label>
                      <div className="rep-filter-pills">
                        <button type="button" className={`rep-pill ${repFilter === 'all' ? 'active' : ''}`} onClick={() => setRepFilter('all')}>Tất cả</button>
                        {PEOPLE_TYPES.map(t => (
                          <button key={t.code} type="button"
                            className={`rep-pill ${repFilter === t.code ? 'active' : ''}`}
                            style={repFilter === t.code ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}
                            onClick={() => setRepFilter(t.code)}>
                            {t.icon} {t.name}
                          </button>
                        ))}
                      </div>
                      <select className="form-input input" style={{ marginTop: 8 }}
                        value={form.representative || ''}
                        onChange={e => f('representative', e.target.value)}>
                        <option value="">— Chọn người đại diện —</option>
                        {repOptions.map(p => (
                          <option key={p.id} value={p.name}>{p.name}{p.role ? ` (${p.role})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* SĐT & MST */}
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label className="form-label">Số điện thoại</label>
                        <input className="form-input input" placeholder="09xxxxxxxx" value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
                      </div>
                      <div className="form-group flex-1">
                        <label className="form-label">Mã số thuế</label>
                        <input className="form-input input" placeholder="0312xxxxxx" value={form.taxCode || ''} onChange={e => f('taxCode', e.target.value)} />
                      </div>
                    </div>

                    {/* Địa điểm */}
                    <div className="form-group">
                      <label className="form-label">📍 Địa điểm</label>
                      <input className="form-input input" placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                        value={form.location || ''} onChange={e => f('location', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Contact fields */}
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label className="form-label">Vị trí / Loại công việc</label>
                        <input className="form-input input" placeholder="VD: VFX Compositor, Colorist..." value={form.role || ''} onChange={e => f('role', e.target.value)} />
                      </div>
                      <div className="form-group flex-1">
                        <label className="form-label">Số điện thoại</label>
                        <input className="form-input input" placeholder="09xxxxxxxx" value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label className="form-label">Mã số thuế</label>
                        <input className="form-input input" placeholder="0312xxxxxx" value={form.taxCode || ''} onChange={e => f('taxCode', e.target.value)} />
                      </div>
                      <div className="form-group flex-1">
                        <label className="form-label">Số TK / Ngân hàng</label>
                        <input className="form-input input" placeholder="VD: VCB - 123456789" value={form.bankInfo || ''} onChange={e => f('bankInfo', e.target.value)} />
                      </div>
                    </div>
                    {(form.type === 'leader' || form.type === 'staff') && (
                      <div className="form-group">
                        <label className="form-label">💰 Lương cơ bản mặc định (₫)</label>
                        <input className="form-input input" type="number" placeholder="VD: 8000000"
                          value={form.baseSalary || ''}
                          onChange={e => setForm(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Sẽ tự điền vào bảng lương hàng tháng</span>
                      </div>
                    )}
                  </>
                )}

                {/* Ghi chú */}
                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <textarea className="form-input input" rows={2} placeholder="Ghi chú thêm..." value={form.note || ''} onChange={e => f('note', e.target.value)} />
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
