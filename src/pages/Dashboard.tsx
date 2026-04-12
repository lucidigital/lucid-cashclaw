import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { formatVND, formatFullVND, getStatusLabel } from '../data/mockData';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, transactions, milestones, getProjectTotals, getDebtSummary } = useData();

  // ─── Calculate KPIs ───────────────────────────────
  const allThu = transactions
    .filter(t => t.type === 'thu' && t.category !== 'ung')
    .reduce((s, t) => s + t.amount, 0);
  const allChi = transactions
    .filter(t => t.type === 'chi' && t.category !== 'ung')
    .reduce((s, t) => s + t.amount, 0);
  const profit = allThu - allChi;
  const profitMargin = allThu > 0 ? Math.round((profit / allThu) * 100) : 0;
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'review').length;

  // ─── Debt KPI ─────────────────────────────────────
  const debtSummary = getDebtSummary();

  // ─── Upcoming milestones ──────────────────────────
  const upcoming = milestones
    .filter(m => m.status === 'pending')
    .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
    .slice(0, 5);

  // ─── Chi by category ─────────────────────────────
  const chiByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'chi' && t.category !== 'ung').forEach(t => {
    chiByCategory[t.category] = (chiByCategory[t.category] || 0) + t.amount;
  });
  const topExpenses = Object.entries(chiByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const maxExpense = topExpenses.length > 0 ? topExpenses[0][1] : 1;

  const catNames: Record<string, string> = {
    comp: '🎨 Compositing', render: '🖥️ Render', '3d': '📐 3D/CG',
    color: '🎬 Color', roto: '✂️ Roto', sound: '🔊 Sound',
    edit: '✏️ Edit', free: '👤 Freelancer', vanhanh: '🏢 Vận hành',
    anuong: '🍜 Ăn uống', soft: '💻 Software', hw: '🖥️ Hardware',
    ship: '🚗 Ship', ps: '⚠️ Phát sinh', khac: '📋 Khác',
    ungcty: '💵 Ứng NV',
  };

  return (
    <div className="dashboard animate-fade-in">
      {/* ── 5 KPI Cards ─────────────────────────────── */}
      <div className="kpi-grid stagger">
        <div className="kpi-card animate-slide-up" style={{ '--kpi-color': 'var(--color-income)' } as React.CSSProperties}>
          <div className="kpi-icon income">💵</div>
          <div className="kpi-body">
            <span className="kpi-label">Tổng thu</span>
            <span className="kpi-value text-income">{formatVND(allThu)}</span>
            <span className="kpi-sub">{formatFullVND(allThu)}</span>
          </div>
        </div>

        <div className="kpi-card animate-slide-up" style={{ '--kpi-color': 'var(--color-expense)' } as React.CSSProperties}>
          <div className="kpi-icon expense">💸</div>
          <div className="kpi-body">
            <span className="kpi-label">Tổng chi</span>
            <span className="kpi-value text-expense">{formatVND(allChi)}</span>
            <span className="kpi-sub">{formatFullVND(allChi)}</span>
          </div>
        </div>

        <div className="kpi-card animate-slide-up" style={{ '--kpi-color': 'var(--color-profit)' } as React.CSSProperties}>
          <div className="kpi-icon profit">📈</div>
          <div className="kpi-body">
            <span className="kpi-label">Lợi nhuận</span>
            <span className={`kpi-value ${profit >= 0 ? 'text-income' : 'text-expense'}`}>{formatVND(profit)}</span>
            <span className="kpi-sub">{profitMargin}% margin</span>
          </div>
        </div>

        <div className="kpi-card animate-slide-up" style={{ '--kpi-color': 'var(--color-danger)' } as React.CSSProperties}
          onClick={() => navigate('/debt')}
        >
          <div className="kpi-icon debt">🏦</div>
          <div className="kpi-body">
            <span className="kpi-label">Đang nợ</span>
            <span className={`kpi-value ${debtSummary.totalRemaining > 0 ? 'text-danger' : 'text-income'}`}>
              {formatVND(debtSummary.totalRemaining)}
            </span>
            <span className="kpi-sub">{debtSummary.activeCount} khoản</span>
          </div>
        </div>

        <div className="kpi-card animate-slide-up" style={{ '--kpi-color': 'var(--brand-primary)' } as React.CSSProperties}>
          <div className="kpi-icon projects">📁</div>
          <div className="kpi-body">
            <span className="kpi-label">Projects</span>
            <span className="kpi-value" style={{ color: 'var(--brand-primary)' }}>{activeProjects}</span>
            <span className="kpi-sub">{projects.length} total</span>
          </div>
        </div>
      </div>

      {/* ── Project Health + Upcoming ─────────────── */}
      <div className="dashboard-grid">
        {/* Project Health */}
        <div className="card dash-card">
          <h3 className="dash-card-title">🏥 Projects Health</h3>
          <div className="health-list">
            {projects.filter(p => p.status !== 'archived').map(project => {
              const totals = getProjectTotals(project.id);
              const statusInfo = getStatusLabel(project.status);
              return (
                <div key={project.id} className="health-row" onClick={() => navigate(`/projects/${project.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="health-info">
                    <span className="health-name">{project.name}</span>
                    <span className="health-client">{project.client}</span>
                  </div>
                  <div className="health-bar-wrapper">
                    <div className="progress-bar">
                      <div
                        className={`fill ${totals.healthHD > 80 ? 'expense' : totals.healthHD > 60 ? 'brand' : 'income'}`}
                        style={{ width: `${Math.min(totals.healthHD, 100)}%` }}
                      />
                    </div>
                    <span className="health-pct">{totals.healthHD}%</span>
                  </div>
                  <span className="badge" style={{
                    background: `${statusInfo.color}20`,
                    color: statusInfo.color,
                  }}>{statusInfo.icon} {statusInfo.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="card dash-card">
          <h3 className="dash-card-title">📅 Dòng tiền sắp tới</h3>
          <div className="upcoming-list">
            {upcoming.map(m => {
              const project = projects.find(p => p.id === m.projectId);
              const date = new Date(m.expectedDate);
              const daysDiff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
              return (
                <div key={m.id} className="upcoming-row">
                  <div className="upcoming-date-badge">
                    <span className="upcoming-day">{date.getDate()}</span>
                    <span className="upcoming-month">{date.toLocaleDateString('vi', { month: 'short' })}</span>
                  </div>
                  <div className="upcoming-info">
                    <span className="upcoming-name">{project?.name}</span>
                    <span className="upcoming-dot">Đợt {m.dot} • {m.percentage}%</span>
                  </div>
                  <div className="upcoming-amount-box">
                    <span className="upcoming-amount text-income">{formatVND(m.amount)}</span>
                    <span className={`upcoming-days ${daysDiff <= 7 ? 'soon' : ''}`}>
                      {daysDiff <= 0 ? 'Hôm nay!' : `${daysDiff} ngày`}
                    </span>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div className="empty-state">Không có khoản thu sắp tới</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Expense Breakdown ────────────────────── */}
      <div className="card dash-card">
        <h3 className="dash-card-title">📊 Chi phí theo danh mục</h3>
        <div className="expense-bars">
          {topExpenses.map(([cat, amount]) => (
            <div key={cat} className="expense-bar-row">
              <span className="expense-bar-label">{catNames[cat] || cat}</span>
              <div className="expense-bar-track">
                <div className="expense-bar-fill" style={{ width: `${(amount / maxExpense) * 100}%` }} />
              </div>
              <span className="expense-bar-value">{formatVND(amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
