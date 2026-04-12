// ─── Lucid CashClaw — Data Mappers ──────────────────
// Convert between camelCase (TypeScript) ↔ snake_case (PostgreSQL)

import type { Project, Transaction, PaymentMilestone, PhatSinh, DebtEntry } from './mockData';
import type { BudgetLine } from './budgetData';

// ─── Generic snake_case → camelCase ─────────────────
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapKeys(obj: Record<string, any>, fn: (k: string) => string): Record<string, any> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[fn(key)] = obj[key];
  }
  return result;
}

// ─── Row → TypeScript ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToProject(row: Record<string, any>): Project {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    type: row.type,
    budget: row.budget,
    status: row.status,
    createdAt: row.created_at?.split('T')[0] || '',
    timeline: row.timeline_start ? {
      start: row.timeline_start,
      end: row.timeline_end || '',
    } : undefined,
    note: row.note || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToTransaction(row: Record<string, any>): Transaction {
  return {
    id: row.id,
    projectId: row.project_id || '',
    type: row.type,
    amount: row.amount,
    category: row.category,
    person: row.person || undefined,
    description: row.description,
    date: row.date,
    createdAt: row.created_at?.split('T')[0] || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToMilestone(row: Record<string, any>): PaymentMilestone {
  return {
    id: row.id,
    projectId: row.project_id,
    dot: row.dot,
    amount: row.amount,
    percentage: row.percentage,
    expectedDate: row.expected_date,
    status: row.status,
    paidDate: row.paid_date || undefined,
    note: row.note || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToPhatSinh(row: Record<string, any>): PhatSinh {
  return {
    id: row.id,
    projectId: row.project_id,
    amount: row.amount,
    description: row.description,
    status: row.status,
    date: row.date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToDebtEntry(row: Record<string, any>): DebtEntry {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    note: row.note || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToBudgetLine(row: Record<string, any>): BudgetLine {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    category: row.category,
    description: row.description,
    estimatedAmount: row.estimated_amount,
    actualAmount: row.actual_amount,
    status: row.status,
    note: row.note || undefined,
  };
}

// ─── TypeScript → Row (for insert/update) ───────────

export function projectToRow(data: Partial<Project>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.client !== undefined) row.client = data.client;
  if (data.type !== undefined) row.type = data.type;
  if (data.budget !== undefined) row.budget = data.budget;
  if (data.status !== undefined) row.status = data.status;
  if (data.timeline?.start) row.timeline_start = data.timeline.start;
  if (data.timeline?.end) row.timeline_end = data.timeline.end;
  if (data.note !== undefined) row.note = data.note;
  return row;
}

export function transactionToRow(data: Partial<Transaction>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (data.projectId !== undefined) row.project_id = data.projectId;
  if (data.type !== undefined) row.type = data.type;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.category !== undefined) row.category = data.category;
  if (data.person !== undefined) row.person = data.person;
  if (data.description !== undefined) row.description = data.description;
  if (data.date !== undefined) row.date = data.date;
  return row;
}

export function milestoneToRow(data: Partial<PaymentMilestone>) {
  return mapKeys(
    Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ),
    camelToSnake
  );
}

export function phatSinhToRow(data: Partial<PhatSinh>) {
  return mapKeys(
    Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ),
    camelToSnake
  );
}

export function budgetLineToRow(data: Partial<BudgetLine>) {
  return mapKeys(
    Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ),
    camelToSnake
  );
}

// Re-export generic utils
export { snakeToCamel, camelToSnake };
