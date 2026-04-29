import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { formatVND, formatFullVND, getStatusLabel } from '../data/mockData';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, transactions, budgetLines, getProjectTotals, getDebtSummary } = useData();

  // ─── Calculate KPIs ───────────────────────────────
  const allThu = transactions
    .filter(t => t.type === 'thu' && t.category !== 'ung')
    .reduce((s, t) => s + t.amount, 0);
  const allChi = transactions
    .filter(t => t.type === 'chi' && t.category !== 'ung')
    .reduce((s, t) => s + t.amount, 0);
  const profit = allThu - allChi;
  const profitMargin = allThu > 0 ? Math.round((profit / allThu) * 100) : 0;

  // ─── Debt KPI ─────────────────────────────────────
  const debtSummary = getDebtSummary();
  // Exclude internal/salary projects from all dashboard stats
  const clientProjects = projects.filter(p => !p.isInternal);
  const activeProjects = clientProjects.filter(p => p.status === 'in_progress' || p.status === 'review');
  const nonArchivedProjects = clientProjects.filter(p => p.status !== 'archived');

  // ─── Tổng Dự Thu KPI = tất cả project budget (completed + active) ───
  const tongDuThuTatCa = nonArchivedProjects.reduce((s, p) => s + (p.budget || 0), 0);
  const tongDuThuConLaiTatCa = tongDuThuTatCa - nonArchivedProjects.reduce((s, p) => {
    const received = transactions
      .filter(t => t.projectId === p.id && t.type === 'thu')
      .reduce((ss, t) => ss + t.amount, 0);
    return s + received;
  }, 0);

  // ─── Dự Thu HĐ = tổng budget của các job đang làm (active only) ───
  const duThuHD = activeProjects.reduce((s, p) => s + (p.budget || 0), 0);
  const duThuHDConLai = activeProjects.reduce((s, p) => {
    const received = transactions
      .filter(t => t.projectId === p.id && t.type === 'thu')
      .reduce((ss, t) => ss + t.amount, 0);
    return s + Math.max(0, (p.budget || 0) - received);
  }, 0);

  // ─── Tổng Dự Chi = ALL budget_lines type=chi (tất cả project) ───
  const allChiLines = budgetLines.filter(bl => bl.type === 'chi');
  const tongDuChi = allChiLines.reduce((s, bl) => s + bl.estimatedAmount, 0);
  const tongDuChiConLai = allChiLines.reduce((s, bl) => {
    const paid = transactions
      .filter(t => t.budgetLineId === bl.id && t.type === 'chi')
      .reduce((ss, t) => ss + t.amount, 0);
    return s + Math.max(0, bl.estimatedAmount - paid);
  }, 0);

  // ─── Dòng tiền sắp tới ───
  // Tất cả project non-archived: remaining = budget/dự thu - đã thu thực tế
  const thuLines = budgetLines.filter(bl => bl.type === 'thu');
  const upcomingCashFlow: Array<{ projectName: string; label: string; remaining: number; hasLine: boolean; isCompleted: boolean; expectedDate?: string }> = [];

  for (const proj of nonArchivedProjects) {
    const projThuLines = thuLines.filter(bl => bl.projectId === proj.id);
    const isCompleted = proj.status === 'completed';

    // Tổng thu thực tế của project (không quan tâm budgetLineId)
    const totalReceived = transactions
      .filter(t => t.projectId === proj.id && t.type === 'thu')
      .reduce((ss, t) => ss + t.amount, 0);

    if (projThuLines.length > 0) {
      // Có budget lines thu → so sánh tổng estimated vs tổng đã thu
      const totalEstimated = projThuLines.reduce((s, bl) => s + bl.estimatedAmount, 0);
      const remaining = totalEstimated - totalReceived;
      if (remaining > 0) {
        // Hiện từng dòng còn thiếu (pro-rata nếu đã nhận một phần)
        let received = totalReceived;
        for (const bl of projThuLines) {
          const lineRemaining = Math.max(0, bl.estimatedAmount - received);
          received = Math.max(0, received - bl.estimatedAmount);
          if (lineRemaining > 0) {
            upcomingCashFlow.push({ projectName: proj.name, label: bl.description || bl.category, remaining: lineRemaining, hasLine: true, isCompleted, expectedDate: bl.expectedDate });
          }
        }
      }
    } else if ((proj.budget || 0) > 0) {
      // Không có budget lines → fallback theo project.budget
      const remaining = (proj.budget || 0) - totalReceived;
      if (remaining > 0) {
        upcomingCashFlow.push({ projectName: proj.name, label: 'Budget (chưa có dự thu)', remaining, hasLine: false, isCompleted, expectedDate: undefined });
      }
    }
  }
  // Sort: có ngày trước (gần nhất), không có ngày xuống dưới
  upcomingCashFlow.sort((a, b) => {
    if (a.expectedDate && b.expectedDate) return new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime();
    if (a.expectedDate) return -1;
    if (b.expectedDate) return 1;
    return b.remaining - a.remaining;
  });


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

        <div className="kpi-card animate-slide-up" style={{ '--kpi-color': 'var(--color-income)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background: 'rgba(0,184,148,0.15)' }}>📊</div>
          <div className="kpi-body">
            <span className="kpi-label">Tổng Dự Thu</span>
            <span className="kpi-value text-income">{formatVND(Math.max(0, tongDuThuConLaiTatCa))}</span>
            <span className="kpi-sub">tổng HĐ: {formatVND(tongDuThuTatCa)}</span>
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
            <span className="kpi-value" style={{ color: 'var(--brand-primary)' }}>{activeProjects.length}</span>
            <span className="kpi-sub">{clientProjects.length} total</span>
          </div>
        </div>
      </div>

      <div className="forecast-row stagger">
        <div className="forecast-card thu">
          <div className="forecast-icon">📥</div>
          <div className="forecast-body">
            <span className="forecast-label">Dự Thu HĐ (active jobs)</span>
            <span className="forecast-value text-income">{formatVND(duThuHDConLai)}</span>
            <span className="forecast-sub">tổng budget: {formatVND(duThuHD)}</span>
          </div>
        </div>
        <div className="forecast-card chi">
          <div className="forecast-icon">📤</div>
          <div className="forecast-body">
            <span className="forecast-label">Tổng Dự Chi (all jobs)</span>
            <span className="forecast-value text-expense">{formatVND(tongDuChi)}</span>
            <span className="forecast-sub">
              Chưa trả: <strong className="text-expense">{formatVND(tongDuChiConLai)}</strong>
            </span>
          </div>
        </div>
        <div className="forecast-card net">
          <div className="forecast-icon">📊</div>
          <div className="forecast-body">
            <span className="forecast-label">Dự lãi ườc tính</span>
            <span className={`forecast-value ${tongDuThuTatCa - tongDuChi >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatVND(tongDuThuTatCa - tongDuChi)}
            </span>
            <span className="forecast-sub">
              {tongDuThuTatCa > 0 ? Math.round(((tongDuThuTatCa - tongDuChi) / tongDuThuTatCa) * 100) : 0}% margin dự kiến
            </span>
          </div>
        </div>
      </div>

      {/* ── Project Health + Upcoming ─────────────── */}
      <div className="dashboard-grid">
        {/* Project Health */}
        <div className="card dash-card">
          <h3 className="dash-card-title">🏥 Projects Health</h3>
          <div className="health-list">
            {clientProjects.filter(p => p.status !== 'archived').map(project => {
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

        {/* Upcoming Cash Flow */}
        <div className="card dash-card">
          <h3 className="dash-card-title">📅 Dòng tiền sắp tới</h3>
          <div className="upcoming-list">
            {upcomingCashFlow.slice(0, 8).map((item, idx) => {
              const date = item.expectedDate ? new Date(item.expectedDate) : null;
              const daysDiff = date ? Math.ceil((date.getTime() - Date.now()) / 86_400_000) : null;
              return (
              <div key={idx} className="upcoming-row">
                <div className="upcoming-date-badge" style={{ background: date ? 'rgba(108,92,231,0.15)' : item.hasLine ? 'rgba(0,184,148,0.15)' : 'rgba(255,255,255,0.04)' }}>
                  {date ? (
                    <>
                      <span className="upcoming-day">{date.getDate()}</span>
                      <span className="upcoming-month">{date.toLocaleDateString('vi', { month: 'short' })}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>{item.hasLine ? '💵' : '📁'}</span>
                  )}
                </div>
                <div className="upcoming-info">
                  <span className="upcoming-name">
                    {item.projectName}
                    {item.isCompleted && <span style={{ fontSize: '0.65rem', marginLeft: 6, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,184,148,0.15)', color: 'var(--color-income)' }}>✅ done</span>}
                  </span>
                  <span className="upcoming-dot">{item.label}</span>
                </div>
                <div className="upcoming-amount-box">
                  <span className="upcoming-amount text-income">{formatVND(item.remaining)}</span>
                  <span className={`upcoming-days ${daysDiff !== null && daysDiff <= 7 ? 'soon' : ''}`} style={{ color: daysDiff !== null && daysDiff <= 0 ? 'var(--color-danger)' : item.hasLine ? 'var(--color-income)' : 'var(--color-muted)' }}>
                    {daysDiff === null ? (item.hasLine ? 'chưa nhận' : 'budget')
                      : daysDiff <= 0 ? 'Quá hạn!'
                      : daysDiff === 0 ? 'Hôm nay'
                      : `${daysDiff} ngày`}
                  </span>
                </div>
              </div>
              );
            })}
            {upcomingCashFlow.length === 0 && (
              <div className="empty-state">Tất cả các job đều đã thu đủ ! ✅</div>
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
