-- ─── Migration: Salary Roster Support ───────────────────────────────────────
-- Adds base_salary column to people table for auto-fill in payroll roster.
-- Run once in Supabase SQL Editor.
-- Date: 2026-04-23

-- 1. Add base_salary to people table
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC DEFAULT 0;

COMMENT ON COLUMN people.base_salary IS 'Lương cơ bản mặc định — dùng để auto-fill bảng lương hàng tháng';

-- 2. Ensure staff_salaries table exists (create if not yet created)
CREATE TABLE IF NOT EXISTS staff_salaries (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name  TEXT        NOT NULL,
  month        TEXT        NOT NULL,          -- 'YYYY-MM'
  base_salary  NUMERIC     NOT NULL DEFAULT 0,
  bonus        NUMERIC     NOT NULL DEFAULT 0,
  deduction    NUMERIC     NOT NULL DEFAULT 0,
  net_salary   NUMERIC     NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'pending', -- 'pending'|'partial'|'paid'
  paid_amount  NUMERIC     NOT NULL DEFAULT 0,
  paid_date    DATE,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(person_name, month)   -- 1 record per person per month
);

COMMENT ON TABLE staff_salaries IS 'Bảng lương tháng — 1 dòng/người/tháng';

-- 3. Enable Realtime for staff_salaries (run in Supabase dashboard if not already done)
-- ALTER PUBLICATION supabase_realtime ADD TABLE staff_salaries;
