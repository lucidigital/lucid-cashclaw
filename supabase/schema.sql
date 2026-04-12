-- ═══════════════════════════════════════════════════════
-- Lucid CashClaw — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ═══════════════════════════════════════════════════════

-- ─── Projects ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  client         TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'TVC Post',
  budget         BIGINT NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress','review','completed','archived')),
  timeline_start DATE,
  timeline_end   DATE,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── Transactions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          BIGSERIAL PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('thu','chi')),
  amount      BIGINT NOT NULL DEFAULT 0,
  category    TEXT NOT NULL,
  person      TEXT,
  description TEXT NOT NULL DEFAULT '',
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Payment Milestones ─────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  dot           INT NOT NULL,
  amount        BIGINT NOT NULL DEFAULT 0,
  percentage    REAL NOT NULL DEFAULT 0,
  expected_date DATE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('paid','pending','overdue')),
  paid_date     DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Phát Sinh (Project Overruns) ───────────────────
CREATE TABLE IF NOT EXISTS phat_sinhs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount      BIGINT NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','paid')),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Budget Lines (Forecast) ────────────────────────
CREATE TABLE IF NOT EXISTS budget_lines (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('thu','chi')),
  category         TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  estimated_amount BIGINT NOT NULL DEFAULT 0,
  actual_amount    BIGINT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'planned'
                   CHECK (status IN ('planned','partial','done','over')),
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── Debt Entries (metadata for borrowers) ──────────
CREATE TABLE IF NOT EXISTS debt_entries (
  id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  type  TEXT NOT NULL DEFAULT 'personal'
        CHECK (type IN ('bank','personal','family')),
  note  TEXT
);

-- ─── Indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_phat_sinhs_project ON phat_sinhs(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_project ON budget_lines(project_id);

-- ─── Enable public access (no RLS for shared account) ──
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE phat_sinhs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_entries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated full access" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON phat_sinhs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON budget_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON debt_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
