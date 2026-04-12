import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { formatVND, formatFullVND, getStatusLabel, CATEGORIES_CHI, type Transaction } from '../data/mockData';
import ProjectFormModal from '../components/ProjectFormModal';
import TransactionFormModal from '../components/TransactionFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, transactions, milestones, phatSinhs, getProjectTotals, deleteProject, deleteTransaction } = useData();

  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'project' | 'transaction'; id: string | number } | null>(null);

  const project = projects.find(p => p.id === id);
  if (!project) return <div className="card">❌ Project not found</div>;

  const totals = getProjectTotals(project.id);
  const statusInfo = getStatusLabel(project.status);
  const projectMilestones = milestones.filter(m => m.projectId === id);
  const phatSinh = phatSinhs.filter(ps => ps.projectId === id);
  const projectTxns = transactions.filter(t => t.projectId === id);

  // Chi by category
  const chiByCategory: Record<string, number> = {};
  projectTxns.filter(t => t.type === 'chi').forEach(t => {
    chiByCategory[t.category] = (chiByCategory[t.category] || 0) + t.amount;
  });
  const chiEntries = Object.entries(chiByCategory).sort(([, a], [, b]) => b - a);
  const maxChi = chiEntries.length > 0 ? chiEntries[0][1] : 1;
  const catMap = Object.fromEntries(CATEGORIES_CHI.map(c => [c.code, c]));
  const conLai = totals.budget - totals.thuHD;

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'project') {
      deleteProject(deleteTarget.id as string);
      navigate('/projects');
    } else {
      deleteTransaction(deleteTarget.id as number);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="detail-page animate-fade-in">
      {/* Back button */}
      <div className="detail-actions-bar">
        <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
          ← Back to Projects
        </button>
        <div className="detail-actions-right">
          <button className="btn btn-ghost" onClick={() => setShowEditProject(true)}>✏️ Sửa</button>
          <button className="btn btn-primary" onClick={() => setShowAddTxn(true)}>+ Thêm giao dịch</button>
          <button className="btn btn-danger" onClick={() => setDeleteTarget({ type: 'project', id: project.id })}>
            🗑️
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="detail-header card">
        <div className="dh-left">
          <h2 className="dh-name">{project.name}</h2>
          <span className="dh-meta">{project.client} • {project.type}</span>
        </div>
        <span className="badge" style={{
          background: `${statusInfo.color}20`,
          color: statusInfo.color,
          fontSize: '0.85rem',
          padding: '6px 14px',
        }}>{statusInfo.icon} {statusInfo.label}</span>
      </div>

      {/* Finance KPIs */}
      <div className="detail-kpis stagger">
        <div className="detail-kpi animate-slide-up">
          <span className="dk-label">Hợp đồng gốc</span>
          <span className="dk-value">{formatVND(totals.budget)}</span>
          <span className="dk-sub">{formatFullVND(totals.budget)}</span>
        </div>
        <div className="detail-kpi animate-slide-up">
          <span className="dk-label">Đã thu</span>
          <span className="dk-value text-income">{formatVND(totals.thuHD)}</span>
          <span className="dk-sub">Còn lại: {formatVND(conLai)}</span>
        </div>
        <div className="detail-kpi animate-slide-up">
          <span className="dk-label">Đã chi (HĐ)</span>
          <span className="dk-value text-expense">{formatVND(totals.chiHD)}</span>
          <span className="dk-sub">{totals.healthHD}% ngân sách</span>
        </div>
        <div className="detail-kpi animate-slide-up">
          <span className="dk-label">Phát sinh</span>
          <span className="dk-value" style={{ color: totals.totalPS > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
            {totals.totalPS > 0 ? formatVND(totals.totalPS) : '—'}
          </span>
          <span className="dk-sub">Tách riêng HĐ</span>
        </div>
        <div className="detail-kpi animate-slide-up">
          <span className="dk-label">Lợi nhuận HĐ</span>
          <span className={`dk-value ${totals.profit >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatVND(totals.profit)}
          </span>
          <span className="dk-sub">{totals.budget > 0 ? Math.round((totals.profit / totals.budget) * 100) : 0}% margin</span>
        </div>
      </div>

      <div className="detail-grid">
        {/* Milestones */}
        <div className="card">
          <h3 className="dash-card-title">💵 Đợt thanh toán</h3>
          <div className="milestone-list">
            {projectMilestones.map(m => {
              const date = new Date(m.expectedDate);
              const isPaid = m.status === 'paid';
              return (
                <div key={m.id} className={`milestone-row ${isPaid ? 'paid' : ''}`}>
                  <div className="ms-dot-badge">
                    <span className="ms-dot-num">Đợt {m.dot}</span>
                    <span className="ms-dot-pct">{m.percentage}%</span>
                  </div>
                  <div className="ms-info">
                    <span className="ms-amount">{formatVND(m.amount)}</span>
                    <span className="ms-date">
                      {isPaid ? `✅ ${new Date(m.paidDate!).toLocaleDateString('vi')}` : `📅 ${date.toLocaleDateString('vi')}`}
                    </span>
                  </div>
                  <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                    {isPaid ? 'Đã thu' : 'Chờ thu'}
                  </span>
                </div>
              );
            })}
            {projectMilestones.length === 0 && (
              <div className="empty-state">Chưa có đợt thanh toán</div>
            )}
          </div>
        </div>

        {/* Phát sinh */}
        <div className="card">
          <h3 className="dash-card-title">⚠️ Phụ lục phát sinh</h3>
          <div className="ps-list">
            {phatSinh.map(ps => (
              <div key={ps.id} className="ps-row">
                <div className="ps-info">
                  <span className="ps-desc">{ps.description}</span>
                  <span className="ps-date">{new Date(ps.date).toLocaleDateString('vi')}</span>
                </div>
                <span className="ps-amount text-warning">{formatVND(ps.amount)}</span>
                <span className={`badge ${ps.status === 'approved' ? 'badge-success' : ps.status === 'paid' ? 'badge-info' : 'badge-warning'}`}>
                  {ps.status === 'approved' ? '✅ Duyệt' : ps.status === 'paid' ? '💵 Đã trả' : '⏳ Chờ duyệt'}
                </span>
              </div>
            ))}
            {phatSinh.length === 0 && (
              <div className="empty-state">Không có phát sinh 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* Chi by Category */}
      <div className="card">
        <h3 className="dash-card-title">📊 Chi tiết chi phí</h3>
        <div className="chi-bars">
          {chiEntries.map(([cat, amt]) => {
            const info = catMap[cat];
            return (
              <div key={cat} className="expense-bar-row">
                <span className="expense-bar-label">{info ? `${info.icon} ${info.name}` : cat}</span>
                <div className="expense-bar-track">
                  <div className="expense-bar-fill" style={{ width: `${(amt / maxChi) * 100}%` }} />
                </div>
                <span className="expense-bar-value">{formatVND(amt)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">📋 Giao dịch gần đây</h3>
        </div>
        <div className="txn-table">
          <div className="txn-header">
            <span>Ngày</span>
            <span>Loại</span>
            <span>Mô tả</span>
            <span>Người</span>
            <span className="txn-right">Số tiền</span>
            <span className="txn-right">Thao tác</span>
          </div>
          {[...projectTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
            <div key={t.id} className="txn-row">
              <span className="txn-date">{new Date(t.date).toLocaleDateString('vi')}</span>
              <span className={`txn-type ${t.type}`}>
                {t.type === 'thu' ? '💵 Thu' : '💸 Chi'}
              </span>
              <span className="txn-desc">{t.description}</span>
              <span className="txn-person">{t.person || '—'}</span>
              <span className={`txn-amount ${t.type === 'thu' ? 'text-income' : 'text-expense'}`}>
                {t.type === 'thu' ? '+' : '-'}{formatVND(t.amount)}
              </span>
              <span className="txn-actions">
                <button className="btn-icon" title="Sửa" onClick={(e) => { e.stopPropagation(); setEditTxn(t); }}>✏️</button>
                <button className="btn-icon" title="Xóa" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'transaction', id: t.id }); }}>🗑️</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ProjectFormModal
        open={showEditProject}
        onClose={() => setShowEditProject(false)}
        editProject={project}
      />
      <TransactionFormModal
        open={showAddTxn || !!editTxn}
        onClose={() => { setShowAddTxn(false); setEditTxn(null); }}
        editTransaction={editTxn}
        defaultProjectId={project.id}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.type === 'project' ? 'Xóa Project?' : 'Xóa Giao Dịch?'}
        description={deleteTarget?.type === 'project'
          ? `Xóa "${project.name}" sẽ xóa toàn bộ giao dịch, đợt thanh toán, phát sinh liên quan. Không thể hoàn tác!`
          : 'Giao dịch này sẽ bị xóa vĩnh viễn. Không thể hoàn tác!'
        }
      />
    </div>
  );
}
