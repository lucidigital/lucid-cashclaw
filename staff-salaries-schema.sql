-- ─── Lucid CashClaw — Staff Salaries Table ──────────────
-- Run this in Supabase SQL Editor to create the staff_salaries table

CREATE TABLE IF NOT EXISTS staff_salaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,           -- Tên staff (match với bảng people.name)
  month       TEXT NOT NULL,           -- Format: 'YYYY-MM'
  base_salary NUMERIC NOT NULL DEFAULT 0,
  bonus       NUMERIC NOT NULL DEFAULT 0,
  deduction   NUMERIC NOT NULL DEFAULT 0,
  net_salary  NUMERIC NOT NULL DEFAULT 0,  -- = base_salary + bonus - deduction
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'partial')),
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  paid_date   DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast month-based queries
CREATE INDEX IF NOT EXISTS idx_staff_salaries_month ON staff_salaries(month);
CREATE INDEX IF NOT EXISTS idx_staff_salaries_person ON staff_salaries(person_name);

-- Unique constraint: one salary record per person per month
CREATE UNIQUE INDEX IF NOT EXISTS uidx_salary_person_month
  ON staff_salaries(person_name, month);

-- Enable RLS
ALTER TABLE staff_salaries ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (team shared login)
CREATE POLICY "Allow all for authenticated" ON staff_salaries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff_salaries;
