-- ─── Migration: Add 'partners' type to people table ──────────────────────────
-- Cập nhật CHECK constraint để cho phép type = 'partners'
-- Date: 2026-04-23

-- Drop constraint cũ (nếu có)
ALTER TABLE people
  DROP CONSTRAINT IF EXISTS people_type_check;

-- Thêm constraint mới bao gồm 'partners'
ALTER TABLE people
  ADD CONSTRAINT people_type_check
  CHECK (type IN ('leader', 'staff', 'freelance', 'partners', 'supplier', 'org'));

-- Verify
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'people_type_check';
