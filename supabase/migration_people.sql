-- ─── Partners & Staff: Create people table ─────────────
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS people (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('staff','freelance','supplier','org')),
  role       TEXT,
  phone      TEXT,
  tax_code   TEXT,
  bank_info  TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast name search (used in autocomplete)
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_people_type ON people(type);

-- RLS: public read/write (same pattern as other tables)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON people FOR ALL USING (true) WITH CHECK (true);

-- ─── Seed data (optional - can skip if adding via UI) ───
INSERT INTO people (name, type, role, phone, tax_code, created_at) VALUES
  ('Hùng',          'staff',     'VFX Compositor', '0912345678', '031234xxxx', now()),
  ('Nam',           'staff',     'Roto Artist',    '0915678901', NULL,         now()),
  ('Linh',          'staff',     'Editor',         '0917890123', NULL,         now()),
  ('Trung Ca',      'freelance', 'Colorist',       '0908123456', '031567xxxx', now()),
  ('Đạt 3D',        'freelance', '3D Artist',      '0909234567', NULL,         now()),
  ('Sound Studio',  'supplier',  'Sound Design',   '02838xxxx',  '031678xxxx', now()),
  ('Studio Render', 'supplier',  'Cloud Render',   NULL,         '031789xxxx', now()),
  ('ACB',           'org',       'Ngân hàng',      '19006247',   NULL,         now())
ON CONFLICT DO NOTHING;
