// ─── Lucid CashClaw — Budget Forecast Data ──────────
// Dự toán thu chi cho từng project



export interface BudgetLine {
  id: string;
  projectId: string;
  person?: string;              // Person or organization name (for chi lines)
  type: 'thu' | 'chi';
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount: number;        // Auto-calculated from real transactions
  status: 'planned' | 'partial' | 'done' | 'over';
  note?: string;
}

export const MOCK_BUDGET_LINES: BudgetLine[] = [
  // ─── Knorr TVC ────────────────────────────────────
  // THU
  { id: 'b1', projectId: 'p1', type: 'thu', category: 'dot', description: 'Đặt cọc 50%', estimatedAmount: 105_000_000, actualAmount: 105_000_000, status: 'done' },
  { id: 'b2', projectId: 'p1', type: 'thu', category: 'dot', description: 'Giao offline 30%', estimatedAmount: 63_000_000, actualAmount: 0, status: 'planned' },
  { id: 'b3', projectId: 'p1', type: 'thu', category: 'dot', description: 'Nghiệm thu 20%', estimatedAmount: 42_000_000, actualAmount: 0, status: 'planned' },
  // CHI
  { id: 'b4', projectId: 'p1', type: 'chi', category: 'comp', description: 'Compositing 20 shot', estimatedAmount: 45_000_000, actualAmount: 40_000_000, status: 'partial' },
  { id: 'b5', projectId: 'p1', type: 'chi', category: 'render', description: 'Render farm', estimatedAmount: 30_000_000, actualAmount: 35_000_000, status: 'over', note: 'Vượt 5tr do re-render' },
  { id: 'b6', projectId: 'p1', type: 'chi', category: 'roto', description: 'Roto & Prep 30 shot', estimatedAmount: 15_000_000, actualAmount: 15_000_000, status: 'done' },
  { id: 'b7', projectId: 'p1', type: 'chi', category: 'color', description: 'Color grading', estimatedAmount: 12_000_000, actualAmount: 10_000_000, status: 'partial' },
  { id: 'b8', projectId: 'p1', type: 'chi', category: 'anuong', description: 'OT meals', estimatedAmount: 5_000_000, actualAmount: 8_000_000, status: 'over' },

  // ─── Milo Champion ────────────────────────────────
  // THU
  { id: 'b9', projectId: 'p2', type: 'thu', category: 'dot', description: 'Đặt cọc 50%', estimatedAmount: 175_000_000, actualAmount: 175_000_000, status: 'done' },
  { id: 'b10', projectId: 'p2', type: 'thu', category: 'dot', description: 'Giao animatic 20%', estimatedAmount: 70_000_000, actualAmount: 0, status: 'planned' },
  { id: 'b11', projectId: 'p2', type: 'thu', category: 'dot', description: 'Giao offline 20%', estimatedAmount: 70_000_000, actualAmount: 0, status: 'planned' },
  { id: 'b12', projectId: 'p2', type: 'thu', category: 'dot', description: 'Nghiệm thu 10%', estimatedAmount: 35_000_000, actualAmount: 0, status: 'planned' },
  // CHI
  { id: 'b13', projectId: 'p2', type: 'chi', category: '3d', description: '3D character modeling', estimatedAmount: 70_000_000, actualAmount: 60_000_000, status: 'partial' },
  { id: 'b14', projectId: 'p2', type: 'chi', category: 'comp', description: 'Animation compositing', estimatedAmount: 50_000_000, actualAmount: 45_000_000, status: 'partial' },
  { id: 'b15', projectId: 'p2', type: 'chi', category: 'render', description: 'Cloud render', estimatedAmount: 25_000_000, actualAmount: 20_000_000, status: 'partial' },
  { id: 'b16', projectId: 'p2', type: 'chi', category: 'sound', description: 'Sound design', estimatedAmount: 15_000_000, actualAmount: 0, status: 'planned' },

  // ─── DHG Pharma ───────────────────────────────────
  // THU
  { id: 'b17', projectId: 'p5', type: 'thu', category: 'dot', description: 'Đặt cọc 50%', estimatedAmount: 60_000_000, actualAmount: 60_000_000, status: 'done' },
  { id: 'b18', projectId: 'p5', type: 'thu', category: 'dot', description: 'Nghiệm thu 50%', estimatedAmount: 60_000_000, actualAmount: 0, status: 'planned' },
  // CHI
  { id: 'b19', projectId: 'p5', type: 'chi', category: 'edit', description: 'Offline edit', estimatedAmount: 20_000_000, actualAmount: 18_000_000, status: 'partial' },
  { id: 'b20', projectId: 'p5', type: 'chi', category: 'comp', description: 'VFX compositing', estimatedAmount: 30_000_000, actualAmount: 0, status: 'planned' },
  { id: 'b21', projectId: 'p5', type: 'chi', category: 'color', description: 'Color grade', estimatedAmount: 10_000_000, actualAmount: 0, status: 'planned' },
];

export function getBudgetSummary(projectId: string) {
  const lines = MOCK_BUDGET_LINES.filter(b => b.projectId === projectId);
  const thuLines = lines.filter(b => b.type === 'thu');
  const chiLines = lines.filter(b => b.type === 'chi');

  const estThu = thuLines.reduce((s, b) => s + b.estimatedAmount, 0);
  const actThu = thuLines.reduce((s, b) => s + b.actualAmount, 0);
  const estChi = chiLines.reduce((s, b) => s + b.estimatedAmount, 0);
  const actChi = chiLines.reduce((s, b) => s + b.actualAmount, 0);

  const estProfit = estThu - estChi;
  const actProfit = actThu - actChi;
  const variance = actChi - estChi; // positive = over budget

  return { thuLines, chiLines, estThu, actThu, estChi, actChi, estProfit, actProfit, variance };
}
