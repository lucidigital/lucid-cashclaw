-- ─── Add budget_line_id to transactions ──────────────
-- Run in Supabase SQL Editor

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS budget_line_id UUID
  REFERENCES budget_lines(id) ON DELETE SET NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_transactions_budget_line_id
  ON transactions(budget_line_id)
  WHERE budget_line_id IS NOT NULL;
