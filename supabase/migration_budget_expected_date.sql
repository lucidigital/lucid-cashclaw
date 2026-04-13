-- Migration: Add expected_date to budget_lines
-- Ngày dự kiến nhận/trả tiền theo từng dòng dự toán thu/chi

ALTER TABLE budget_lines
  ADD COLUMN IF NOT EXISTS expected_date DATE DEFAULT NULL;

COMMENT ON COLUMN budget_lines.expected_date IS 'Ngày dự kiến thu/chi theo dòng dự toán HĐ';
