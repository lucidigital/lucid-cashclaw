-- ─── Migration: Salary Month + Internal Project ─────────────────────────────
-- Date: 2026-04-23
-- Run once in Supabase SQL Editor

-- 1. Add salary_month column to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS salary_month TEXT;

COMMENT ON COLUMN transactions.salary_month IS
  'Tháng lương thực tế (YYYY-MM) — chỉ có khi category=luong, projectId=salary project';

-- 2. Add is_internal flag to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN projects.is_internal IS
  'true = project nội bộ (Lương Lucid) — ẩn khỏi danh sách client project';

-- 3. Create the "Lương Lucid" internal project (run once)
INSERT INTO projects (name, client, type, budget, status, is_internal)
VALUES ('Lương Lucid', 'Internal', 'internal', 0, 'in_progress', true)
ON CONFLICT DO NOTHING;
