-- ─── Migration: Salary Base History ──────────────────────────────────────────
-- Tạo bảng lưu lịch sử lương CB theo từng mốc thời gian.
-- Mỗi record = 1 lần thay đổi lương của 1 nhân sự, với tháng hiệu lực.
-- Date: 2026-04-23

-- 1. Tạo bảng salary_base_history
CREATE TABLE IF NOT EXISTS salary_base_history (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name    TEXT        NOT NULL,
  base_salary    NUMERIC     NOT NULL DEFAULT 0,
  effective_from TEXT        NOT NULL,   -- 'YYYY-MM': tháng bắt đầu áp dụng
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE salary_base_history IS 'Lịch sử lương cơ bản — mỗi record là 1 mốc thay đổi lương của 1 nhân sự';
COMMENT ON COLUMN salary_base_history.effective_from IS 'Tháng bắt đầu áp dụng mức lương này, format YYYY-MM';

-- Index để query nhanh theo person + tháng
CREATE INDEX IF NOT EXISTS idx_salary_history_person ON salary_base_history(person_name, effective_from DESC);

-- 2. Migrate dữ liệu hiện tại từ people.base_salary sang history
-- effective_from = '2026-03' theo yêu cầu
INSERT INTO salary_base_history (person_name, base_salary, effective_from, note)
SELECT
  name,
  COALESCE(base_salary, 0),
  '2026-03',
  'Migration từ people.base_salary — mức lương ban đầu'
FROM people
WHERE (type = 'leader' OR type = 'staff')
  AND COALESCE(base_salary, 0) > 0
ON CONFLICT DO NOTHING;

-- 3. Enable Realtime (run in Supabase dashboard if needed)
-- ALTER PUBLICATION supabase_realtime ADD TABLE salary_base_history;
