// ─── Lucid CashClaw — Data Mappers ──────────────────
// Convert between camelCase (TypeScript) ↔ snake_case (PostgreSQL)

import type { Project, Transaction, PaymentMilestone, PhatSinh, DebtEntry, ManualDebt, Person, StaffSalary, SalaryBaseHistory } from './mockData';
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
    isInternal: row.is_internal || false,
    createdAt: row.created_at?.split('T')[0] || '',
    timeline: row.timeline_start ? { start: row.timeline_start, end: row.timeline_end || '' } : undefined,
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
    budgetLineId: row.budget_line_id || undefined,
    salaryMonth: row.salary_month || undefined,
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
    person: row.person || undefined,
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
export function rowToManualDebt(row: Record<string, any>): ManualDebt {
  return {
    id: row.id,
    person: row.person,
    type: row.type,
    amount: row.amount,
    repaid: row.repaid || 0,
    note: row.note || undefined,
    date: row.date,
    createdAt: row.created_at?.split('T')[0] || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function manualDebtToRow(data: Partial<ManualDebt>): Record<string, any> {
  const row: Record<string, unknown> = {};
  if (data.person !== undefined) row.person = data.person;
  if (data.type !== undefined) row.type = data.type;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.repaid !== undefined) row.repaid = data.repaid;
  if (data.note !== undefined) row.note = data.note || null;
  if (data.date !== undefined) row.date = data.date;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToBudgetLine(row: Record<string, any>): BudgetLine {
  return {
    id: row.id,
    projectId: row.project_id,
    person: row.person || undefined,
    type: row.type,
    category: row.category,
    description: row.description,
    estimatedAmount: row.estimated_amount,
    actualAmount: row.actual_amount,
    status: row.status,
    expectedDate: row.expected_date || undefined,
    note: row.note || undefined,
  };
}

// ─── TypeScript → Row (for insert/update) ───────────

export function projectToRow(data: Partial<Project>) {
  const row: Record<string, any> = {};
  if (data.name       !== undefined) row.name         = data.name;
  if (data.client     !== undefined) row.client       = data.client;
  if (data.type       !== undefined) row.type         = data.type;
  if (data.budget     !== undefined) row.budget       = data.budget;
  if (data.status     !== undefined) row.status       = data.status;
  if (data.isInternal !== undefined) row.is_internal  = data.isInternal;
  if (data.timeline?.start) row.timeline_start = data.timeline.start;
  if (data.timeline?.end)   row.timeline_end   = data.timeline.end;
  if (data.note       !== undefined) row.note         = data.note;
  return row;
}

export function transactionToRow(data: Partial<Transaction>) {
  const row: Record<string, any> = {};
  if (data.projectId    !== undefined) row.project_id     = data.projectId || null;
  if (data.type         !== undefined) row.type           = data.type;
  if (data.amount       !== undefined) row.amount         = data.amount;
  if (data.category     !== undefined) row.category       = data.category;
  if (data.person       !== undefined) row.person         = data.person;
  if (data.budgetLineId !== undefined) row.budget_line_id = data.budgetLineId || null;
  if (data.salaryMonth  !== undefined) row.salary_month   = data.salaryMonth || null;
  if (data.description  !== undefined) row.description    = data.description;
  if (data.date         !== undefined) row.date           = data.date;
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

// ─── Person Mappers ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToPerson(row: Record<string, any>): Person {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    role: row.role || undefined,
    phone: row.phone || undefined,
    taxCode: row.tax_code || undefined,
    bankInfo: row.bank_info || undefined,
    baseSalary: row.base_salary || undefined,
    industry: row.industry || undefined,
    representative: row.representative || undefined,
    location: row.location || undefined,
    note: row.note || undefined,
    createdAt: row.created_at?.split('T')[0] || '',
  };
}

export function personToRow(data: Partial<Person>) {
  const row: Record<string, unknown> = {};
  if (data.name           !== undefined) row.name           = data.name;
  if (data.type           !== undefined) row.type           = data.type;
  if (data.role           !== undefined) row.role           = data.role;
  if (data.phone          !== undefined) row.phone          = data.phone;
  if (data.taxCode        !== undefined) row.tax_code       = data.taxCode;
  if (data.bankInfo       !== undefined) row.bank_info      = data.bankInfo;
  if (data.baseSalary     !== undefined) row.base_salary    = data.baseSalary;
  if (data.industry       !== undefined) row.industry       = data.industry || null;
  if (data.representative !== undefined) row.representative = data.representative || null;
  if (data.location       !== undefined) row.location       = data.location || null;
  if (data.note           !== undefined) row.note           = data.note;
  return row;
}

// ─── StaffSalary Mappers ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToStaffSalary(row: Record<string, any>): StaffSalary {
  const base = row.base_salary ?? 0;
  const bonus = row.bonus ?? 0;
  const deduction = row.deduction ?? 0;
  return {
    id: row.id,
    personName: row.person_name,
    month: row.month,
    baseSalary: base,
    bonus,
    deduction,
    netSalary: row.net_salary ?? (base + bonus - deduction),
    status: row.status ?? 'pending',
    paidAmount: row.paid_amount ?? 0,
    paidDate: row.paid_date || undefined,
    note: row.note || undefined,
    createdAt: row.created_at?.split('T')[0] || '',
  };
}

export function staffSalaryToRow(data: Partial<StaffSalary>) {
  const row: Record<string, unknown> = {};
  if (data.personName  !== undefined) row.person_name  = data.personName;
  if (data.month       !== undefined) row.month        = data.month;
  if (data.baseSalary  !== undefined) row.base_salary  = data.baseSalary;
  if (data.bonus       !== undefined) row.bonus        = data.bonus;
  if (data.deduction   !== undefined) row.deduction    = data.deduction;
  if (data.netSalary   !== undefined) row.net_salary   = data.netSalary;
  if (data.status      !== undefined) row.status       = data.status;
  if (data.paidAmount  !== undefined) row.paid_amount  = data.paidAmount;
  if (data.paidDate    !== undefined) row.paid_date    = data.paidDate || null;
  if (data.note        !== undefined) row.note         = data.note || null;
  return row;
}

// ─── SalaryBaseHistory Mappers ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToSalaryBaseHistory(row: Record<string, any>): SalaryBaseHistory {
  return {
    id: row.id,
    personName: row.person_name,
    baseSalary: row.base_salary ?? 0,
    effectiveFrom: row.effective_from,
    note: row.note || undefined,
    createdAt: row.created_at?.split('T')[0] || '',
  };
}

export function salaryBaseHistoryToRow(data: Partial<SalaryBaseHistory>) {
  const row: Record<string, unknown> = {};
  if (data.personName    !== undefined) row.person_name    = data.personName;
  if (data.baseSalary    !== undefined) row.base_salary    = data.baseSalary;
  if (data.effectiveFrom !== undefined) row.effective_from = data.effectiveFrom;
  if (data.note          !== undefined) row.note           = data.note || null;
  return row;
}
