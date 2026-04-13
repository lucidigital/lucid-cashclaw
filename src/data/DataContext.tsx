// ─── Lucid CashClaw — Data Context (Phase B: Supabase) ──
// All CRUD operations go through Supabase
// Interface unchanged → pages don't need any modifications

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from './supabaseClient';
import {
  rowToProject, rowToTransaction, rowToMilestone, rowToPhatSinh,
  rowToDebtEntry, rowToBudgetLine, rowToPerson,
  projectToRow, transactionToRow, milestoneToRow, phatSinhToRow, budgetLineToRow, personToRow,
} from './mappers';
import type { Project, Transaction, PaymentMilestone, PhatSinh, DebtEntry, Person } from './mockData';
import type { BudgetLine } from './budgetData';

// ─── Context Type (unchanged from Phase A) ──────────
interface DataContextType {
  // Data
  projects: Project[];
  transactions: Transaction[];
  milestones: PaymentMilestone[];
  phatSinhs: PhatSinh[];
  debtEntries: DebtEntry[];
  budgetLines: BudgetLine[];

  // Loading / Error
  loading: boolean;
  error: string | null;

  // Project CRUD
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Transaction CRUD
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // Milestone CRUD
  addMilestone: (ms: Omit<PaymentMilestone, 'id'>) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<PaymentMilestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;

  // Phat Sinh CRUD
  addPhatSinh: (ps: Omit<PhatSinh, 'id'>) => Promise<void>;
  updatePhatSinh: (id: string, updates: Partial<PhatSinh>) => Promise<void>;
  deletePhatSinh: (id: string) => Promise<void>;

  // Budget Line CRUD
  addBudgetLine: (bl: Omit<BudgetLine, 'id'>) => Promise<void>;
  updateBudgetLine: (id: string, updates: Partial<BudgetLine>) => Promise<void>;
  deleteBudgetLine: (id: string) => Promise<void>;

  // People
  people: Person[];
  addPerson: (p: Omit<Person, 'id' | 'createdAt'>) => Promise<Person>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;

  // Helpers (computed from state — same as Phase A)
  getProjectTotals: (projectId: string) => {
    thuHD: number; chiHD: number; totalPS: number;
    budget: number; healthHD: number; profit: number;
  };
  getDebtSummary: () => {
    entries: Array<{
      name: string; type: string; typeIcon: string; typeLabel: string;
      borrowed: number; repaid: number; remaining: number;
      note?: string; transactions: Transaction[];
    }>;
    totalBorrowed: number; totalRepaid: number;
    totalRemaining: number; activeCount: number;
  };
  getAdvanceSummary: () => {
    entries: Array<{
      name: string; advanced: number; returned: number;
      outstanding: number; transactions: Transaction[];
    }>;
    totalAdvanced: number; totalReturned: number;
    totalOutstanding: number; activeCount: number;
  };
  getReceivablesSummary: () => {
    receivables: Array<{
      id: string; name: string; project: string; type: 'receivable';
      total: number; paid: number; outstanding: number; status: string;
    }>;
    payables: Array<{
      id: string; name: string; project: string; type: 'payable';
      total: number; paid: number; outstanding: number; status: string;
    }>;
    totalReceivable: number; totalPayable: number; netPosition: number;
  };
  getBudgetSummary: (projectId: string) => {
    thuLines: BudgetLine[]; chiLines: BudgetLine[];
    estThu: number; actThu: number; estChi: number; actChi: number;
    estProfit: number; actProfit: number; variance: number;
  };
  getPayableSummary: () => {
    entries: Array<{
      person: string;
      totalEstimated: number;
      totalPhatSinh: number;
      totalContract: number;
      totalPaid: number;
      outstanding: number;
      jobs: Array<{ projectId: string; projectName: string; estimated: number; phatSinh: number; paid: number }>;
    }>;
    totalEstimated: number;
    totalPhatSinh: number;
    totalPaid: number;
    totalOutstanding: number;
    activeCount: number;
  };
}

const DataContext = createContext<DataContextType | null>(null);

// ─── Provider ───────────────────────────────────────
export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [phatSinhs, setPhatSinhs] = useState<PhatSinh[]>([]);
  const [debtEntries, setDebtEntries] = useState<DebtEntry[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);

  // ─── Initial fetch ────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [pRes, tRes, mRes, psRes, dRes, blRes, peRes] = await Promise.all([
          supabase.from('projects').select('*').order('created_at', { ascending: false }),
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('milestones').select('*').order('dot'),
          supabase.from('phat_sinhs').select('*').order('date', { ascending: false }),
          supabase.from('debt_entries').select('*'),
          supabase.from('budget_lines').select('*'),
          supabase.from('people').select('*').order('name'),
        ]);

        if (pRes.error) throw pRes.error;
        if (tRes.error) throw tRes.error;
        if (mRes.error) throw mRes.error;
        if (psRes.error) throw psRes.error;
        if (dRes.error) throw dRes.error;
        if (blRes.error) throw blRes.error;
        // people table may not exist yet — soft fail
        if (peRes.error) console.warn('people table not found, skipping:', peRes.error.message);

        setProjects((pRes.data || []).map(rowToProject));
        setTransactions((tRes.data || []).map(rowToTransaction));
        setMilestones((mRes.data || []).map(rowToMilestone));
        setPhatSinhs((psRes.data || []).map(rowToPhatSinh));
        setDebtEntries((dRes.data || []).map(rowToDebtEntry));
        setBudgetLines((blRes.data || []).map(rowToBudgetLine));
        setPeople((peRes.data || []).map(rowToPerson));
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ─── Project CRUD ─────────────────────────────────
  const addProject = useCallback(async (data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    const row = projectToRow(data);
    const { data: rows, error: err } = await supabase
      .from('projects').insert(row).select().single();
    if (err) throw err;
    const newProject = rowToProject(rows);
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const row = projectToRow(updates);
    const { error: err } = await supabase
      .from('projects').update(row).eq('id', id);
    if (err) throw err;
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('projects').delete().eq('id', id);
    if (err) throw err;
    setProjects(prev => prev.filter(p => p.id !== id));
    // CASCADE handles related data in DB, update local state too
    setTransactions(prev => prev.filter(t => t.projectId !== id));
    setMilestones(prev => prev.filter(m => m.projectId !== id));
    setPhatSinhs(prev => prev.filter(ps => ps.projectId !== id));
    setBudgetLines(prev => prev.filter(bl => bl.projectId !== id));
  }, []);

  // ─── Transaction CRUD ─────────────────────────────
  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const row = transactionToRow(data);
    const { data: rows, error: err } = await supabase
      .from('transactions').insert(row).select().single();
    if (err) throw err;
    const newTxn = rowToTransaction(rows);
    setTransactions(prev => [newTxn, ...prev]);
    return newTxn;
  }, []);

  const updateTransaction = useCallback(async (id: number, updates: Partial<Transaction>) => {
    const row = transactionToRow(updates);
    const { error: err } = await supabase
      .from('transactions').update(row).eq('id', id);
    if (err) throw err;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback(async (id: number) => {
    const { error: err } = await supabase
      .from('transactions').delete().eq('id', id);
    if (err) throw err;
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Milestone CRUD ───────────────────────────────
  const addMilestone = useCallback(async (data: Omit<PaymentMilestone, 'id'>) => {
    const row = milestoneToRow(data);
    const { data: rows, error: err } = await supabase
      .from('milestones').insert(row).select().single();
    if (err) throw err;
    setMilestones(prev => [...prev, rowToMilestone(rows)]);
  }, []);

  const updateMilestone = useCallback(async (id: string, updates: Partial<PaymentMilestone>) => {
    const row = milestoneToRow(updates);
    const { error: err } = await supabase
      .from('milestones').update(row).eq('id', id);
    if (err) throw err;
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMilestone = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('milestones').delete().eq('id', id);
    if (err) throw err;
    setMilestones(prev => prev.filter(m => m.id !== id));
  }, []);

  // ─── Phat Sinh CRUD ──────────────────────────────
  const addPhatSinh = useCallback(async (data: Omit<PhatSinh, 'id'>) => {
    const row = phatSinhToRow(data);
    const { data: rows, error: err } = await supabase
      .from('phat_sinhs').insert(row).select().single();
    if (err) throw err;
    setPhatSinhs(prev => [...prev, rowToPhatSinh(rows)]);
  }, []);

  const updatePhatSinh = useCallback(async (id: string, updates: Partial<PhatSinh>) => {
    const row = phatSinhToRow(updates);
    const { error: err } = await supabase
      .from('phat_sinhs').update(row).eq('id', id);
    if (err) throw err;
    setPhatSinhs(prev => prev.map(ps => ps.id === id ? { ...ps, ...updates } : ps));
  }, []);

  const deletePhatSinh = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('phat_sinhs').delete().eq('id', id);
    if (err) throw err;
    setPhatSinhs(prev => prev.filter(ps => ps.id !== id));
  }, []);

  // ─── Budget Line CRUD ─────────────────────────────
  const addBudgetLine = useCallback(async (data: Omit<BudgetLine, 'id'>) => {
    const row = budgetLineToRow(data);
    const { data: rows, error: err } = await supabase
      .from('budget_lines').insert(row).select().single();
    if (err) throw err;
    setBudgetLines(prev => [...prev, rowToBudgetLine(rows)]);
  }, []);

  const updateBudgetLine = useCallback(async (id: string, updates: Partial<BudgetLine>) => {
    const row = budgetLineToRow(updates);
    const { error: err } = await supabase
      .from('budget_lines').update(row).eq('id', id);
    if (err) throw err;
    setBudgetLines(prev => prev.map(bl => bl.id === id ? { ...bl, ...updates } : bl));
  }, []);

  const deleteBudgetLine = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('budget_lines').delete().eq('id', id);
    if (err) throw err;
    setBudgetLines(prev => prev.filter(bl => bl.id !== id));
  }, []);

  // ─── Helpers (computed from state — same as Phase A) ──
  const getProjectTotals = useCallback((projectId: string) => {
    const txns = transactions.filter(t => t.projectId === projectId);
    const project = projects.find(p => p.id === projectId);
    const psList = phatSinhs.filter(ps => ps.projectId === projectId);

    // Exclude all non-operational categories from project P&L
    const DEBT_CATS = ['vay_ung', 'tra_no', 'chi_ung', 'thu_ung'];
    const thuHD = txns.filter(t => t.type === 'thu' && !DEBT_CATS.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    const chiHD = txns.filter(t => t.type === 'chi' && !DEBT_CATS.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    const totalPS = psList.reduce((s, ps) => s + ps.amount, 0);
    const budget = project?.budget || 0;
    const healthHD = budget > 0 ? Math.round((chiHD / budget) * 100) : 0;
    const profit = thuHD - chiHD;

    return { thuHD, chiHD, totalPS, budget, healthHD, profit };
  }, [transactions, projects, phatSinhs]);

  const getDebtSummary = useCallback(() => {
    // Thu vay_ung = vay tiền về, Chi tra_no = trả lại
    const ungTxns = transactions.filter(t => (t.category === 'vay_ung' || t.category === 'tra_no') && t.person);
    const byPerson: Record<string, { borrowed: number; repaid: number; transactions: Transaction[] }> = {};

    ungTxns.forEach(t => {
      const key = t.person!;
      if (!byPerson[key]) byPerson[key] = { borrowed: 0, repaid: 0, transactions: [] };
      byPerson[key].transactions.push(t);
      if (t.type === 'thu') byPerson[key].borrowed += t.amount;   // vay_ung
      if (t.type === 'chi') byPerson[key].repaid += t.amount;     // tra_no
    });

    const entries = Object.entries(byPerson).map(([name, data]) => {
      const meta = debtEntries.find(d => d.name === name);
      return {
        name,
        type: meta?.type || 'personal',
        typeIcon: meta?.type === 'bank' ? '🏦' : '👤',
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
  }, [transactions, debtEntries]);

  const getAdvanceSummary = useCallback(() => {
    // Chi chi_ung = ứng tiền ra, Thu thu_ung = nhân viên trả lại
    const ungTxns = transactions.filter(t => (t.category === 'chi_ung' || t.category === 'thu_ung') && t.person);
    const byPerson: Record<string, { advanced: number; returned: number; transactions: Transaction[] }> = {};

    ungTxns.forEach(t => {
      const key = t.person!;
      if (!byPerson[key]) byPerson[key] = { advanced: 0, returned: 0, transactions: [] };
      byPerson[key].transactions.push(t);
      if (t.type === 'chi') byPerson[key].advanced += t.amount;   // chi_ung
      if (t.type === 'thu') byPerson[key].returned += t.amount;   // thu_ung
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
  }, [transactions]);

  const getReceivablesSummary = useCallback(() => {
    const DEBT_CATS = ['vay_ung', 'tra_no', 'chi_ung', 'thu_ung'];

    // Phải thu: per-project, from budget THU lines vs actual THU transactions
    const receivables = projects
      .filter(p => p.status !== 'archived')
      .map(p => {
        const thuLines = budgetLines.filter(b => b.projectId === p.id && b.type === 'thu');
        const total = thuLines.reduce((s, b) => s + b.estimatedAmount, 0);
        if (total === 0) return null; // skip projects with no budget thu
        const totalReceived = transactions
          .filter(t => t.projectId === p.id && t.type === 'thu' && !DEBT_CATS.includes(t.category))
          .reduce((s, t) => s + t.amount, 0);
        const outstanding = total - totalReceived;
        return {
          id: p.id, name: p.client, project: p.name,
          type: 'receivable' as const,
          total, paid: totalReceived, outstanding, status: p.status,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.outstanding > 0);

    // Phải trả: delegated to getPayableSummary in the UI layer
    // returning empty here; UI uses getPayableSummary directly
    const payables: Array<{
      id: string; name: string; project: string; type: 'payable';
      total: number; paid: number; outstanding: number; status: string;
    }> = [];

    const totalReceivable = receivables.reduce((s, r) => s + r.outstanding, 0);
    const totalPayable = payables.reduce((s, p) => s + p.outstanding, 0);
    const netPosition = totalReceivable - totalPayable;

    return { receivables, payables, totalReceivable, totalPayable, netPosition };
  }, [projects, budgetLines, transactions]);

  const getBudgetSummary = useCallback((projectId: string) => {
    const lines = budgetLines.filter(b => b.projectId === projectId);
    const thuLines = lines.filter(b => b.type === 'thu');
    const chiLines = lines.filter(b => b.type === 'chi');

    const estThu = thuLines.reduce((s, b) => s + b.estimatedAmount, 0);
    const actThu = thuLines.reduce((s, b) => s + b.actualAmount, 0);
    const estChi = chiLines.reduce((s, b) => s + b.estimatedAmount, 0);
    
    // Auto-compute actChi: for chi lines with person, sum matching transactions
    let actChi = 0;
    chiLines.forEach(line => {
      if (line.person) {
        // Auto-compute from transactions matching project + person + chi
        const paid = transactions
          .filter(t => t.projectId === projectId && t.person === line.person && t.type === 'chi' && t.category !== 'ung' && t.category !== 'ungcty')
          .reduce((s, t) => s + t.amount, 0);
        actChi += paid;
      } else {
        // Fallback to manual actualAmount for lines without person
        actChi += line.actualAmount;
      }
    });

    const estProfit = estThu - estChi;
    const actProfit = actThu - actChi;
    const variance = actChi - estChi;

    return { thuLines, chiLines, estThu, actThu, estChi, actChi, estProfit, actProfit, variance };
  }, [budgetLines, transactions]);

  // ─── Payable Summary (Công nợ — per person) ────────
  const getPayableSummary = useCallback(() => {
    // Get all chi budget lines that have a person
    const personLines = budgetLines.filter(b => b.type === 'chi' && b.person);
    const byPerson: Record<string, {
      totalEstimated: number;
      totalPhatSinh: number;
      totalPaid: number;
      jobs: Array<{ projectId: string; projectName: string; estimated: number; phatSinh: number; paid: number }>;
    }> = {};

    personLines.forEach(line => {
      const person = line.person!;
      if (!byPerson[person]) byPerson[person] = { totalEstimated: 0, totalPhatSinh: 0, totalPaid: 0, jobs: [] };

      const project = projects.find(p => p.id === line.projectId);
      const projectName = project?.name || 'Unknown';

      // Phát sinh for this person + project
      const personPS = phatSinhs
        .filter(ps => ps.projectId === line.projectId && ps.person === person)
        .reduce((s, ps) => s + ps.amount, 0);

      // Paid = chi transactions matching project + person
      // Exclude: debt/advance cats, AND ps_nhansu/ps_thu (phát sinh ≠ payment for original budget)
      const DEBT_CATS_PAY = ['vay_ung', 'tra_no', 'chi_ung', 'thu_ung', 'ung', 'ungcty'];
      const PS_CATS = ['ps_nhansu', 'ps_thu'];
      const paid = transactions
        .filter(t =>
          t.projectId === line.projectId &&
          t.person === person &&
          t.type === 'chi' &&
          !DEBT_CATS_PAY.includes(t.category) &&
          !PS_CATS.includes(t.category)  // ← phát sinh không tính vào đã trả
        )
        .reduce((s, t) => s + t.amount, 0);

      byPerson[person].totalEstimated += line.estimatedAmount;
      byPerson[person].totalPhatSinh += personPS;
      byPerson[person].totalPaid += paid;
      byPerson[person].jobs.push({
        projectId: line.projectId,
        projectName,
        estimated: line.estimatedAmount,
        phatSinh: personPS,
        paid,
      });
    });

    const entries = Object.entries(byPerson).map(([person, data]) => ({
      person,
      totalEstimated: data.totalEstimated,
      totalPhatSinh: data.totalPhatSinh,
      totalContract: data.totalEstimated + data.totalPhatSinh,
      totalPaid: data.totalPaid,
      outstanding: data.totalEstimated + data.totalPhatSinh - data.totalPaid,
      jobs: data.jobs,
    }));

    const totalEstimated = entries.reduce((s, e) => s + e.totalEstimated, 0);
    const totalPhatSinh = entries.reduce((s, e) => s + e.totalPhatSinh, 0);
    const totalPaid = entries.reduce((s, e) => s + e.totalPaid, 0);
    const totalOutstanding = entries.reduce((s, e) => s + e.outstanding, 0);
    const activeCount = entries.filter(e => e.outstanding > 0).length;

    return { entries, totalEstimated, totalPhatSinh, totalPaid, totalOutstanding, activeCount };
  }, [budgetLines, transactions, phatSinhs, projects]);

  // ─── People CRUD ─────────────────────────────────
  const addPerson = useCallback(async (data: Omit<Person, 'id' | 'createdAt'>): Promise<Person> => {
    const row = personToRow(data);
    const { data: rows, error: err } = await supabase
      .from('people').insert(row).select().single();
    if (err) throw err;
    const newPerson = rowToPerson(rows);
    setPeople(prev => [newPerson, ...prev]);
    return newPerson;
  }, []);

  const updatePerson = useCallback(async (id: string, updates: Partial<Person>) => {
    const row = personToRow(updates);
    const { error: err } = await supabase
      .from('people').update(row).eq('id', id);
    if (err) throw err;
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePerson = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('people').delete().eq('id', id);
    if (err) throw err;
    setPeople(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <DataContext.Provider value={{
      projects, transactions, milestones, phatSinhs, debtEntries, budgetLines,
      people,
      loading, error,
      addProject, updateProject, deleteProject,
      addTransaction, updateTransaction, deleteTransaction,
      addMilestone, updateMilestone, deleteMilestone,
      addPhatSinh, updatePhatSinh, deletePhatSinh,
      addBudgetLine, updateBudgetLine, deleteBudgetLine,
      addPerson, updatePerson, deletePerson,
      getProjectTotals, getDebtSummary, getAdvanceSummary,
      getReceivablesSummary, getBudgetSummary, getPayableSummary,
    }}>
      {children}
    </DataContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
