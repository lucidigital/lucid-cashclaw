-- ═══════════════════════════════════════════════════════
-- Manual Debts — khoản nợ nhập tay ngoài transactions
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS manual_debts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person      TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'personal'
              CHECK (type IN ('bank','personal','family')),
  amount      BIGINT NOT NULL DEFAULT 0,
  repaid      BIGINT NOT NULL DEFAULT 0,
  note        TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_debts_person ON manual_debts(person);

ALTER TABLE manual_debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access" ON manual_debts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
