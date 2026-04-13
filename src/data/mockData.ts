// ─── Lucid CashClaw — Mock Data ─────────────────────
// Realistic sample data for UI/UX prototyping (Phase A)
// Updated: v2 — THU/CHI only, dynamic milestones, Nợ & Ứng

export interface Project {
  id: string;
  name: string;
  client: string;
  type: string;
  budget: number;
  status: 'in_progress' | 'review' | 'completed' | 'archived';
  createdAt: string;
  timeline?: { start: string; end: string };
  note?: string;
}

export interface Transaction {
  id: number;
  projectId: string;
  type: 'thu' | 'chi';           // Only 2 types now
  amount: number;
  category: string;               // See CATEGORIES_THU / CATEGORIES_CHI
  person?: string;
  budgetLineId?: string;          // Link to budget_lines.id (null = overflow)
  description: string;
  date: string;
  createdAt: string;
}

export interface PaymentMilestone {
  id: string;
  projectId: string;
  dot: number;                    // Dynamic — 1, 2, 3, ... N (no limit)
  amount: number;
  percentage: number;
  expectedDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  note?: string;
}

export interface PhatSinh {
  id: string;
  projectId: string;
  person?: string;              // Person/org this phat sinh relates to
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'paid';
  date: string;
}

export interface DebtEntry {
  id: string;
  name: string;
  type: 'bank' | 'personal' | 'family';
  note?: string;
}

export interface ManualDebt {
  id: string;
  person: string;
  type: 'bank' | 'personal' | 'family';
  amount: number;
  repaid: number;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  type: 'leader' | 'staff' | 'freelance' | 'supplier' | 'org';
  role?: string;
  phone?: string;
  taxCode?: string;
  bankInfo?: string;
  note?: string;
  createdAt: string;
}

// ─── Project Types ──────────────────────────────────
export const PROJECT_TYPES = [
  'TVC Post', 'Animation', 'VFX Feature', 'Full CG',
  'Color Grade', 'Sound Design', 'Music Video', 'Other',
];

// ─── Categories ─────────────────────────────────────
export const CATEGORIES_THU = [
  { code: 'dot',      icon: '💵', name: 'Thanh toán đợt' },
  { code: 'full',     icon: '✅', name: 'Thanh toán full' },
  { code: 'ps_thu',   icon: '⚠️', name: 'Phát sinh (thu)' },
  { code: 'vay_ung',  icon: '🏦', name: 'Vay / Ứng (nhận)' },
  { code: 'thu_ung',  icon: '🔄', name: 'Thu lại ứng' },
  { code: 'thu_khac', icon: '💰', name: 'Thu khác' },
];

export const CATEGORIES_CHI = [
  { code: 'nhansu',    icon: '👥', name: 'Chi nhân sự' },
  { code: 'freelance', icon: '👤', name: 'Chi freelance' },
  { code: 'ps_nhansu', icon: '⚠️', name: 'Chi nhân sự phát sinh' },
  { code: 'chi_khac',  icon: '📋', name: 'Chi dự toán khác' },
  { code: 'chi_ung',   icon: '💸', name: 'Chi ứng' },
  { code: 'tra_no',    icon: '🏦', name: 'Chi trả nợ' },
  { code: 'thue',      icon: '📋', name: 'Chi thuế' },
  { code: 'vanhanh',   icon: '🏢', name: 'Chi vận hành' },
  { code: 'khac',      icon: '📦', name: 'Chi khác' },
];

// ─── People Types ────────────────────────────────────
export const PEOPLE_TYPES = [
  { code: 'leader',    icon: '👑', name: 'Leader',     color: '#fdcb6e' },
  { code: 'staff',     icon: '👥', name: 'Staff',      color: '#00b894' },
  { code: 'freelance', icon: '👤', name: 'Freelance',  color: '#0984e3' },
  { code: 'supplier',  icon: '🏢', name: 'Supplier',   color: '#e17055' },
  { code: 'org',       icon: '🏦', name: 'Tổ chức',   color: '#6c5ce7' },
] as const;

// ─── Mock People ─────────────────────────────────────
export const MOCK_PEOPLE: Person[] = [
  { id: 'pe1', name: 'Hùng',         type: 'staff',     role: 'VFX Compositor', phone: '0912345678', taxCode: '031234xxxx', createdAt: '2025-01-10' },
  { id: 'pe2', name: 'Nam',          type: 'staff',     role: 'Roto Artist',    phone: '0915678901', createdAt: '2025-02-01' },
  { id: 'pe3', name: 'Linh',         type: 'staff',     role: 'Editor',         phone: '0917890123', createdAt: '2025-01-15' },
  { id: 'pe4', name: 'Trung Ca',     type: 'freelance', role: 'Colorist',       phone: '0908123456', taxCode: '031567xxxx', createdAt: '2025-03-05' },
  { id: 'pe5', name: 'Đạt 3D',       type: 'freelance', role: '3D Artist',      phone: '0909234567', createdAt: '2025-04-01' },
  { id: 'pe6', name: 'Sound Studio', type: 'supplier',  role: 'Sound Design',   phone: '02838xxxx',  taxCode: '031678xxxx', bankInfo: 'VCB - 123456789', createdAt: '2025-01-20' },
  { id: 'pe7', name: 'Studio Render',type: 'supplier',  role: 'Cloud Render',   taxCode: '031789xxxx', createdAt: '2025-02-10' },
  { id: 'pe8', name: 'ACB',          type: 'org',       role: 'Ngân hàng',      phone: '19006247',   createdAt: '2025-01-01' },
];

// ─── Mock Projects ──────────────────────────────────
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Knorr TVC',
    client: 'Unilever',
    type: 'TVC Post',
    budget: 210_000_000,
    status: 'in_progress',
    createdAt: '2026-03-01',
    timeline: { start: '2026-03-01', end: '2026-04-30' },
  },
  {
    id: 'p2',
    name: 'Milo Champion',
    client: 'Nestle',
    type: 'Animation',
    budget: 350_000_000,
    status: 'in_progress',
    createdAt: '2026-03-10',
    timeline: { start: '2026-03-10', end: '2026-05-15' },
  },
  {
    id: 'p3',
    name: 'Sunlight Clean',
    client: 'Unilever',
    type: 'TVC Post',
    budget: 180_000_000,
    status: 'review',
    createdAt: '2026-02-01',
    timeline: { start: '2026-02-01', end: '2026-03-31' },
  },
  {
    id: 'p4',
    name: 'Vinamilk Organic',
    client: 'Vinamilk',
    type: 'Full CG',
    budget: 450_000_000,
    status: 'completed',
    createdAt: '2026-01-15',
    timeline: { start: '2026-01-15', end: '2026-03-15' },
  },
  {
    id: 'p5',
    name: 'DHG Pharma',
    client: 'DHG',
    type: 'VFX Feature',
    budget: 120_000_000,
    status: 'in_progress',
    createdAt: '2026-04-01',
    timeline: { start: '2026-04-01', end: '2026-04-30' },
  },
];

// ─── Mock Transactions ──────────────────────────────
// type: only 'thu' | 'chi' — category handles the rest
export const MOCK_TRANSACTIONS: Transaction[] = [
  // Knorr TVC
  { id: 1, projectId: 'p1', type: 'thu', amount: 105_000_000, category: 'dot', description: 'Đặt cọc 50% HĐ', date: '2026-03-01', createdAt: '2026-03-01' },
  { id: 2, projectId: 'p1', type: 'chi', amount: 40_000_000, category: 'nhansu', person: 'Hùng', description: 'Comp 20 shot', date: '2026-03-15', createdAt: '2026-03-15' },
  { id: 3, projectId: 'p1', type: 'chi', amount: 35_000_000, category: 'chi_khac', description: 'Render farm 500 frames', date: '2026-03-20', createdAt: '2026-03-20' },
  { id: 4, projectId: 'p1', type: 'chi', amount: 15_000_000, category: 'nhansu', person: 'Nam', description: 'Roto 30 shot', date: '2026-03-22', createdAt: '2026-03-22' },
  { id: 5, projectId: 'p1', type: 'chi', amount: 10_000_000, category: 'nhansu', description: 'Color grade 30s TVC', date: '2026-03-25', createdAt: '2026-03-25' },
  { id: 6, projectId: 'p1', type: 'chi', amount: 8_000_000, category: 'vanhanh', description: 'OT meals team 2 tuần', date: '2026-04-01', createdAt: '2026-04-01' },
  { id: 7, projectId: 'p1', type: 'chi', amount: 15_000_000, category: 'ps_nhansu', description: 'Client đổi brief, làm lại 5 shot (phát sinh)', date: '2026-04-05', createdAt: '2026-04-05' },
  { id: 8, projectId: 'p1', type: 'chi', amount: 8_000_000, category: 'ps_nhansu', description: 'Thêm 3 shot mới (phát sinh)', date: '2026-04-08', createdAt: '2026-04-08' },

  // Milo Champion
  { id: 9, projectId: 'p2', type: 'thu', amount: 175_000_000, category: 'dot', description: 'Đặt cọc 50%', date: '2026-03-10', createdAt: '2026-03-10' },
  { id: 10, projectId: 'p2', type: 'chi', amount: 60_000_000, category: 'nhansu', person: 'Trung', description: '3D character modeling', date: '2026-03-20', createdAt: '2026-03-20' },
  { id: 11, projectId: 'p2', type: 'chi', amount: 45_000_000, category: 'nhansu', description: 'Animation compositing', date: '2026-04-01', createdAt: '2026-04-01' },
  { id: 12, projectId: 'p2', type: 'chi', amount: 20_000_000, category: 'chi_khac', description: 'Cloud render', date: '2026-04-05', createdAt: '2026-04-05' },

  // Sunlight Clean
  { id: 13, projectId: 'p3', type: 'thu', amount: 90_000_000, category: 'dot', description: 'Đặt cọc 50%', date: '2026-02-01', createdAt: '2026-02-01' },
  { id: 14, projectId: 'p3', type: 'thu', amount: 54_000_000, category: 'dot', description: 'Giao offline', date: '2026-03-15', createdAt: '2026-03-15' },
  { id: 15, projectId: 'p3', type: 'chi', amount: 50_000_000, category: 'nhansu', description: 'VFX compositing', date: '2026-02-15', createdAt: '2026-02-15' },
  { id: 16, projectId: 'p3', type: 'chi', amount: 25_000_000, category: 'nhansu', description: 'Color grade final', date: '2026-03-10', createdAt: '2026-03-10' },
  { id: 17, projectId: 'p3', type: 'chi', amount: 12_000_000, category: 'freelance', description: 'Sound mix', date: '2026-03-20', createdAt: '2026-03-20' },

  // Vinamilk Organic
  { id: 18, projectId: 'p4', type: 'thu', amount: 225_000_000, category: 'dot', description: 'Đặt cọc 50%', date: '2026-01-15', createdAt: '2026-01-15' },
  { id: 19, projectId: 'p4', type: 'thu', amount: 135_000_000, category: 'dot', description: 'Giao offline', date: '2026-02-28', createdAt: '2026-02-28' },
  { id: 20, projectId: 'p4', type: 'thu', amount: 90_000_000, category: 'dot', description: 'Nghiệm thu', date: '2026-03-15', createdAt: '2026-03-15' },
  { id: 21, projectId: 'p4', type: 'chi', amount: 120_000_000, category: 'nhansu', description: 'Full CG production', date: '2026-02-01', createdAt: '2026-02-01' },
  { id: 22, projectId: 'p4', type: 'chi', amount: 80_000_000, category: 'nhansu', description: 'Compositing final', date: '2026-02-20', createdAt: '2026-02-20' },
  { id: 23, projectId: 'p4', type: 'chi', amount: 45_000_000, category: 'chi_khac', description: 'Render farm', date: '2026-03-01', createdAt: '2026-03-01' },

  // DHG Pharma
  { id: 24, projectId: 'p5', type: 'thu', amount: 60_000_000, category: 'dot', description: 'Đặt cọc 50%', date: '2026-04-01', createdAt: '2026-04-01' },
  { id: 25, projectId: 'p5', type: 'chi', amount: 18_000_000, category: 'nhansu', description: 'Offline edit', date: '2026-04-05', createdAt: '2026-04-05' },

  // General (no project)
  { id: 26, projectId: '', type: 'chi', amount: 12_000_000, category: 'vanhanh', description: 'VP tháng 4', date: '2026-04-01', createdAt: '2026-04-01' },
  { id: 27, projectId: '', type: 'chi', amount: 3_000_000, category: 'vanhanh', description: 'Nuke license tháng 4', date: '2026-04-01', createdAt: '2026-04-01' },

  // ─── Nợ & Vay Transactions ─────────────────────────
  { id: 28, projectId: '', type: 'thu', amount: 100_000_000, category: 'vay_ung', person: 'ACB', description: 'Vay ACB lãi suất 0.8%/tháng', date: '2026-02-01', createdAt: '2026-02-01' },
  { id: 29, projectId: '', type: 'chi', amount: 30_000_000, category: 'tra_no', person: 'ACB', description: 'Trả nợ ACB đợt 1', date: '2026-03-15', createdAt: '2026-03-15' },
  { id: 30, projectId: '', type: 'thu', amount: 50_000_000, category: 'vay_ung', person: 'Anh Vũ', description: 'Mượn anh Vũ', date: '2026-01-20', createdAt: '2026-01-20' },
  { id: 31, projectId: '', type: 'chi', amount: 50_000_000, category: 'tra_no', person: 'Anh Vũ', description: 'Trả hết anh Vũ', date: '2026-03-01', createdAt: '2026-03-01' },
  { id: 32, projectId: '', type: 'thu', amount: 30_000_000, category: 'vay_ung', person: 'Mẹ', description: 'Mẹ hỗ trợ mua thiết bị', date: '2026-01-10', createdAt: '2026-01-10' },
  { id: 33, projectId: '', type: 'chi', amount: 30_000_000, category: 'tra_no', person: 'Mẹ', description: 'Trả lại mẹ', date: '2026-02-20', createdAt: '2026-02-20' },

  // ─── Ứng trước nhân viên (Company Advances) ────────
  { id: 34, projectId: 'p1', type: 'chi', amount: 5_000_000, category: 'chi_ung', person: 'Trung', description: 'Ứng mua ổ cứng SSD', date: '2026-03-05', createdAt: '2026-03-05' },
  { id: 35, projectId: 'p1', type: 'thu', amount: 5_000_000, category: 'thu_ung', person: 'Trung', description: 'Trung hoàn trả tiền SSD', date: '2026-04-01', createdAt: '2026-04-01' },
  { id: 36, projectId: 'p2', type: 'chi', amount: 8_000_000, category: 'chi_ung', person: 'Hùng', description: 'Ứng tiền đi công tác', date: '2026-03-15', createdAt: '2026-03-15' },
  { id: 37, projectId: '', type: 'chi', amount: 3_000_000, category: 'chi_ung', person: 'Hùng', description: 'Ứng mua thiết bị nhỏ', date: '2026-04-02', createdAt: '2026-04-02' },
  { id: 38, projectId: 'p2', type: 'thu', amount: 5_000_000, category: 'thu_ung', person: 'Hùng', description: 'Hùng hoàn trả một phần', date: '2026-04-08', createdAt: '2026-04-08' },
  { id: 39, projectId: 'p5', type: 'chi', amount: 2_000_000, category: 'chi_ung', person: 'Linh', description: 'Ứng mua phụ kiện quay', date: '2026-04-03', createdAt: '2026-04-03' },
];

// ─── Mock Payment Milestones (Dynamic) ──────────────
export const MOCK_MILESTONES: PaymentMilestone[] = [
  // Knorr TVC — 3 đợt
  { id: 'm1', projectId: 'p1', dot: 1, amount: 105_000_000, percentage: 50, expectedDate: '2026-03-01', status: 'paid', paidDate: '2026-03-01', note: 'Đặt cọc khi ký HĐ' },
  { id: 'm2', projectId: 'p1', dot: 2, amount: 63_000_000, percentage: 30, expectedDate: '2026-04-30', status: 'pending', note: 'Giao offline' },
  { id: 'm3', projectId: 'p1', dot: 3, amount: 42_000_000, percentage: 20, expectedDate: '2026-05-15', status: 'pending', note: 'Nghiệm thu' },

  // Milo Champion — 4 đợt (big animation project)
  { id: 'm4', projectId: 'p2', dot: 1, amount: 175_000_000, percentage: 50, expectedDate: '2026-03-10', status: 'paid', paidDate: '2026-03-10', note: 'Đặt cọc' },
  { id: 'm5', projectId: 'p2', dot: 2, amount: 70_000_000, percentage: 20, expectedDate: '2026-04-10', status: 'pending', note: 'Giao animatic' },
  { id: 'm6', projectId: 'p2', dot: 3, amount: 70_000_000, percentage: 20, expectedDate: '2026-04-25', status: 'pending', note: 'Giao offline' },
  { id: 'm7', projectId: 'p2', dot: 4, amount: 35_000_000, percentage: 10, expectedDate: '2026-05-15', status: 'pending', note: 'Nghiệm thu' },

  // DHG Pharma — 2 đợt (small project)
  { id: 'm8', projectId: 'p5', dot: 1, amount: 60_000_000, percentage: 50, expectedDate: '2026-04-01', status: 'paid', paidDate: '2026-04-01', note: 'Đặt cọc' },
  { id: 'm9', projectId: 'p5', dot: 2, amount: 60_000_000, percentage: 50, expectedDate: '2026-04-30', status: 'pending', note: 'Nghiệm thu' },
];

// ─── Mock Phát Sinh ─────────────────────────────────
export const MOCK_PHAT_SINH: PhatSinh[] = [
  { id: 'ps1', projectId: 'p1', amount: 15_000_000, description: 'Client đổi brief, làm lại 5 shot', status: 'approved', date: '2026-04-05' },
  { id: 'ps2', projectId: 'p1', amount: 8_000_000, description: 'Thêm 3 shot mới', status: 'pending', date: '2026-04-08' },
];

// ─── Mock Debt Entries (metadata for people/orgs) ───
export const MOCK_DEBT_ENTRIES: DebtEntry[] = [
  { id: 'd1', name: 'ACB', type: 'bank', note: 'Lãi suất 0.8%/tháng' },
  { id: 'd2', name: 'Anh Vũ', type: 'personal' },
  { id: 'd3', name: 'Mẹ', type: 'family' },
];

// ─── Helpers ────────────────────────────────────────
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function formatFullVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function getProjectTotals(projectId: string) {
  const txns = MOCK_TRANSACTIONS.filter(t => t.projectId === projectId);
  const project = MOCK_PROJECTS.find(p => p.id === projectId);
  const psList = MOCK_PHAT_SINH.filter(ps => ps.projectId === projectId);

  const thuHD = txns.filter(t => t.type === 'thu' && t.category !== 'ung').reduce((s, t) => s + t.amount, 0);
  const chiHD = txns.filter(t => t.type === 'chi' && t.category !== 'ung').reduce((s, t) => s + t.amount, 0);
  const totalPS = psList.reduce((s, ps) => s + ps.amount, 0);
  const budget = project?.budget || 0;
  const healthHD = budget > 0 ? Math.round((chiHD / budget) * 100) : 0;
  const profit = thuHD - chiHD;

  return { thuHD, chiHD, totalPS, budget, healthHD, profit };
}

export function getStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    in_progress: { label: 'In Progress', color: '#FDCB6E', icon: '🟡' },
    review: { label: 'Review', color: '#E17055', icon: '🟠' },
    completed: { label: 'Completed', color: '#00B894', icon: '🟢' },
    archived: { label: 'Archived', color: '#636E72', icon: '⚫' },
  };
  return map[status] || { label: status, color: '#6B6D8A', icon: '⚪' };
}

// ─── Debt/Loan Helpers ──────────────────────────────
export function getDebtSummary() {
  // Group ung transactions by person
  const ungTxns = MOCK_TRANSACTIONS.filter(t => t.category === 'ung' && t.person);
  const byPerson: Record<string, { borrowed: number; repaid: number; transactions: Transaction[] }> = {};

  ungTxns.forEach(t => {
    const key = t.person!;
    if (!byPerson[key]) byPerson[key] = { borrowed: 0, repaid: 0, transactions: [] };
    byPerson[key].transactions.push(t);
    if (t.type === 'thu') byPerson[key].borrowed += t.amount;
    if (t.type === 'chi') byPerson[key].repaid += t.amount;
  });

  const entries = Object.entries(byPerson).map(([name, data]) => {
    const meta = MOCK_DEBT_ENTRIES.find(d => d.name === name);
    return {
      name,
      type: meta?.type || 'personal',
      typeIcon: meta?.type === 'bank' ? '🏦' : meta?.type === 'family' ? '👤' : '👤',
      typeLabel: meta?.type === 'bank' ? 'Ngân hàng' : meta?.type === 'family' ? 'Gia đình' : 'Cá nhân',
      borrowed: data.borrowed,
      repaid: data.repaid,
      remaining: data.borrowed - data.repaid,
      note: meta?.note,
      transactions: data.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  });

  const totalBorrowed = entries.reduce((s, e) => s + e.borrowed, 0);
  const totalRepaid = entries.reduce((s, e) => s + e.repaid, 0);
  const totalRemaining = totalBorrowed - totalRepaid;
  const activeCount = entries.filter(e => e.remaining > 0).length;

  return { entries, totalBorrowed, totalRepaid, totalRemaining, activeCount };
}

// ─── Advance (Ứng trước) Helpers ────────────────────
export function getAdvanceSummary() {
  const ungTxns = MOCK_TRANSACTIONS.filter(t => t.category === 'ungcty' && t.person);
  const byPerson: Record<string, { advanced: number; returned: number; transactions: Transaction[] }> = {};

  ungTxns.forEach(t => {
    const key = t.person!;
    if (!byPerson[key]) byPerson[key] = { advanced: 0, returned: 0, transactions: [] };
    byPerson[key].transactions.push(t);
    if (t.type === 'chi') byPerson[key].advanced += t.amount;   // Công ty chi = ứng ra
    if (t.type === 'thu') byPerson[key].returned += t.amount;   // Nhân viên trả lại
  });

  const entries = Object.entries(byPerson).map(([name, data]) => ({
    name,
    advanced: data.advanced,
    returned: data.returned,
    outstanding: data.advanced - data.returned,
    transactions: data.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  }));

  const totalAdvanced = entries.reduce((s, e) => s + e.advanced, 0);
  const totalReturned = entries.reduce((s, e) => s + e.returned, 0);
  const totalOutstanding = totalAdvanced - totalReturned;
  const activeCount = entries.filter(e => e.outstanding > 0).length;

  return { entries, totalAdvanced, totalReturned, totalOutstanding, activeCount };
}

// ─── Receivables (Công nợ) Helpers ──────────────────
export function getReceivablesSummary() {
  // PHẢI THU: Client còn nợ = budget - đã thu (theo project in_progress/review)
  const receivables = MOCK_PROJECTS
    .filter(p => p.status !== 'archived')
    .map(p => {
      const txns = MOCK_TRANSACTIONS.filter(t => t.projectId === p.id && t.type === 'thu' && t.category !== 'ung' && t.category !== 'ungcty');
      const totalReceived = txns.reduce((s, t) => s + t.amount, 0);
      const outstanding = p.budget - totalReceived;
      return {
        id: p.id,
        name: p.client,
        project: p.name,
        type: 'receivable' as const,
        total: p.budget,
        paid: totalReceived,
        outstanding,
        status: p.status,
      };
    })
    .filter(r => r.outstanding > 0);

  // PHẢI TRẢ: Mình nợ vendor/freelancer (mock — khai báo riêng)
  const payables = [
    { id: 'pay1', name: 'Hùng', project: 'Knorr TVC', type: 'payable' as const, total: 45_000_000, paid: 40_000_000, outstanding: 5_000_000, status: 'in_progress' },
    { id: 'pay2', name: 'Studio XYZ', project: 'Milo Champion', type: 'payable' as const, total: 15_000_000, paid: 5_000_000, outstanding: 10_000_000, status: 'in_progress' },
    { id: 'pay3', name: 'Trung', project: 'Milo Champion', type: 'payable' as const, total: 60_000_000, paid: 60_000_000, outstanding: 0, status: 'completed' },
  ].filter(p => p.outstanding > 0);

  const totalReceivable = receivables.reduce((s, r) => s + r.outstanding, 0);
  const totalPayable = payables.reduce((s, p) => s + p.outstanding, 0);
  const netPosition = totalReceivable - totalPayable;

  return { receivables, payables, totalReceivable, totalPayable, netPosition };
}
