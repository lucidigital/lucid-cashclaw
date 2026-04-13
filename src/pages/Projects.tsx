import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { formatVND, formatFullVND, getStatusLabel } from '../data/mockData';
import ProjectFormModal from '../components/ProjectFormModal';
import './Projects.css';

export default function Projects() {
  const navigate = useNavigate();
  const { projects, transactions, budgetLines, getProjectTotals } = useData();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="projects-page animate-fade-in">
      {/* Toolbar */}
      <div className="projects-toolbar">
        <div className="filter-pills">
          {['all', 'in_progress', 'review', 'completed'].map(f => {
            const info = f === 'all'
              ? { label: 'Tất cả', icon: '📁' }
              : getStatusLabel(f);
            return (
              <button
                key={f}
                className={`pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {'icon' in info ? info.icon : ''} {f === 'all' ? 'Tất cả' : info.label}
              </button>
            );
          })}
        </div>
        <div className="toolbar-right">
          <input
            className="input search-input"
            placeholder="🔍 Tìm project hoặc client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Tạo mới
          </button>
        </div>
      </div>

      {/* Project Cards */}
      <div className="project-grid stagger">
        {filtered.map(project => {
          const totals = getProjectTotals(project.id);
          const statusInfo = getStatusLabel(project.status);
          const txnCount = transactions.filter(t => t.projectId === project.id).length;

          return (
            <div key={project.id} className="project-card card animate-slide-up" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="pc-header">
                <div>
                  <h3 className="pc-name">{project.name}</h3>
                  <span className="pc-client">{project.client} • {project.type}</span>
                </div>
                <span className="badge" style={{
                  background: `${statusInfo.color}20`,
                  color: statusInfo.color,
                }}>{statusInfo.icon} {statusInfo.label}</span>
              </div>

              <div className="pc-finance">
                <div className="pc-stat">
                  <span className="pc-stat-label">Hợp đồng</span>
                  <span className="pc-stat-value">{formatVND(totals.budget)}</span>
                </div>
                <div className="pc-stat">
                  <span className="pc-stat-label">Dự toán chi</span>
                  <span className="pc-stat-value" style={{ color: 'var(--color-warning)' }}>
                    {formatVND(budgetLines.filter(b => b.projectId === project.id && b.type === 'chi').reduce((s, b) => s + b.estimatedAmount, 0))}
                  </span>
                </div>
                <div className="pc-stat">
                  <span className="pc-stat-label">Đã thu</span>
                  <span className="pc-stat-value text-income">{formatVND(totals.thuHD)}</span>
                </div>
                <div className="pc-stat">
                  <span className="pc-stat-label">Đã chi</span>
                  <span className="pc-stat-value text-expense">{formatVND(totals.chiHD)}</span>
                </div>
                <div className="pc-stat">
                  <span className="pc-stat-label">Lợi nhuận</span>
                  <span className={`pc-stat-value ${totals.profit >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatVND(totals.profit)}
                  </span>
                </div>
              </div>

              {/* Health bar */}
              <div className="pc-health">
                <div className="pc-health-info">
                  <span>Chi/HĐ</span>
                  <span className="pc-health-pct">{totals.healthHD}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`fill ${totals.healthHD > 80 ? 'expense' : totals.healthHD > 60 ? 'brand' : 'income'}`}
                    style={{ width: `${Math.min(totals.healthHD, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pc-footer">
                <span>{txnCount} giao dịch</span>
                {totals.totalPS > 0 && (
                  <span className="pc-ps-badge">⚠️ PS: {formatVND(totals.totalPS)}</span>
                )}
                <span className="pc-budget-full">{formatFullVND(totals.budget)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card">
          <span style={{ fontSize: '2rem' }}>📭</span>
          <p>Không tìm thấy project nào</p>
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
