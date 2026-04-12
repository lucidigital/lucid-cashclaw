-- ═══════════════════════════════════════════════════════
-- Lucid CashClaw — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- This inserts the same sample data from Phase A mock
-- ═══════════════════════════════════════════════════════

-- ─── Projects ───────────────────────────────────────
INSERT INTO projects (id, name, client, type, budget, status, timeline_start, timeline_end, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Knorr TVC', 'Unilever', 'TVC Post', 210000000, 'in_progress', '2026-03-01', '2026-04-30', '2026-03-01'),
  ('00000000-0000-0000-0000-000000000002', 'Milo Champion', 'Nestle', 'Animation', 350000000, 'in_progress', '2026-03-10', '2026-05-15', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000003', 'Sunlight Clean', 'Unilever', 'TVC Post', 180000000, 'review', '2026-02-01', '2026-03-31', '2026-02-01'),
  ('00000000-0000-0000-0000-000000000004', 'Vinamilk Organic', 'Vinamilk', 'Full CG', 450000000, 'completed', '2026-01-15', '2026-03-15', '2026-01-15'),
  ('00000000-0000-0000-0000-000000000005', 'DHG Pharma', 'DHG', 'VFX Feature', 120000000, 'in_progress', '2026-04-01', '2026-04-30', '2026-04-01');

-- ─── Transactions ───────────────────────────────────
-- Knorr TVC transactions
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  ('00000000-0000-0000-0000-000000000001', 'thu', 105000000, 'dot', NULL, 'Đặt cọc 50% HĐ', '2026-03-01'),
  ('00000000-0000-0000-0000-000000000001', 'thu', 5000000, 'ungcty', 'Trung', 'Trung hoàn trả tiền SSD', '2026-04-01'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 40000000, 'comp', 'Hùng', 'Comp 20 shot', '2026-03-15'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 35000000, 'render', NULL, 'Render farm 500 frames', '2026-03-20'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 15000000, 'roto', 'Nam', 'Roto 30 shot', '2026-03-22'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 10000000, 'color', NULL, 'Color grade 30s TVC', '2026-03-25'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 8000000, 'food', NULL, 'OT meals team 2 tuần', '2026-04-01'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 5000000, 'ungcty', 'Trung', 'Ứng mua ổ cứng SSD', '2026-03-05'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 15000000, 'ps', NULL, 'Client đổi brief, làm lại 5 shot (phát sinh)', '2026-04-05'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 8000000, 'ps', NULL, 'Thêm 3 shot mới (phát sinh)', '2026-04-08');

-- Milo Champion transactions
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  ('00000000-0000-0000-0000-000000000002', 'thu', 175000000, 'dot', NULL, 'Đặt cọc Milo 50%', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000002', 'thu', 5000000, 'ungcty', 'Hùng', 'Hùng hoàn trả một phần', '2026-04-08'),
  ('00000000-0000-0000-0000-000000000002', 'chi', 45000000, 'comp', NULL, 'Animation compositing', '2026-04-01'),
  ('00000000-0000-0000-0000-000000000002', 'chi', 40000000, 'edit', NULL, 'Offline edit', '2026-03-20'),
  ('00000000-0000-0000-0000-000000000002', 'chi', 28000000, 'roto', NULL, 'Roto + Prep 40 shot', '2026-03-25'),
  ('00000000-0000-0000-0000-000000000002', 'chi', 20000000, 'render', NULL, 'Cloud render', '2026-04-05');

-- Sunlight Clean transactions
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  ('00000000-0000-0000-0000-000000000003', 'thu', 90000000, 'dot', NULL, 'Đợt 1 50%', '2026-02-05'),
  ('00000000-0000-0000-0000-000000000003', 'thu', 54000000, 'dot', NULL, 'Đợt 2 30%', '2026-03-15'),
  ('00000000-0000-0000-0000-000000000003', 'chi', 50000000, 'comp', NULL, 'Comp main', '2026-02-20'),
  ('00000000-0000-0000-0000-000000000003', 'chi', 22000000, 'color', NULL, 'Color + DI', '2026-03-01'),
  ('00000000-0000-0000-0000-000000000003', 'chi', 15000000, 'render', NULL, 'Render farm', '2026-02-25');

-- Vinamilk Organic transactions
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  ('00000000-0000-0000-0000-000000000004', 'thu', 225000000, 'dot', NULL, 'Đợt 1 50%', '2026-01-20'),
  ('00000000-0000-0000-0000-000000000004', 'thu', 135000000, 'dot', NULL, 'Đợt 2 30%', '2026-02-20'),
  ('00000000-0000-0000-0000-000000000004', 'thu', 90000000, 'dot', NULL, 'Đợt 3 cuối', '2026-03-15'),
  ('00000000-0000-0000-0000-000000000004', 'chi', 120000000, 'comp', NULL, 'Full CG comp', '2026-02-01'),
  ('00000000-0000-0000-0000-000000000004', 'chi', 80000000, 'render', NULL, 'Render Full CG', '2026-02-15'),
  ('00000000-0000-0000-0000-000000000004', 'chi', 45000000, 'roto', NULL, 'Roto + clean up', '2026-02-10');

-- DHG Pharma transactions
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  ('00000000-0000-0000-0000-000000000005', 'thu', 60000000, 'dot', NULL, 'Đặt cọc 50%', '2026-04-01'),
  ('00000000-0000-0000-0000-000000000005', 'chi', 18000000, 'edit', NULL, 'Offline edit', '2026-04-05'),
  ('00000000-0000-0000-0000-000000000005', 'chi', 2000000, 'ungcty', 'Linh', 'Ứng mua phụ kiện quay', '2026-04-03');

-- General company expenses (no project)
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  (NULL, 'chi', 12000000, 'vanhanh', NULL, 'VP tháng 4', '2026-04-01'),
  (NULL, 'chi', 3000000, 'soft', NULL, 'Nuke license tháng 4', '2026-04-01'),
  (NULL, 'chi', 3000000, 'ungcty', 'Hùng', 'Ứng mua thiết bị nhỏ', '2026-04-02');

-- Debt (Vay)
INSERT INTO transactions (project_id, type, amount, category, person, description, date) VALUES
  (NULL, 'thu', 50000000, 'ung', 'Anh Toàn (FE Credit)', 'Vay FE Credit trả thiết bị', '2026-02-01'),
  (NULL, 'chi', 5000000, 'ung', 'Anh Toàn (FE Credit)', 'Trả góp tháng 3', '2026-03-01'),
  (NULL, 'chi', 5000000, 'ung', 'Anh Toàn (FE Credit)', 'Trả góp tháng 4', '2026-04-01'),
  (NULL, 'thu', 30000000, 'ung', 'Chị Lan', 'Mượn chị Lan trả lương tháng 1', '2026-01-25'),
  (NULL, 'chi', 15000000, 'ung', 'Chị Lan', 'Trả chị Lan đợt 1', '2026-03-10'),
  (NULL, 'chi', 15000000, 'ung', 'Chị Lan', 'Trả xong chị Lan', '2026-04-05');

-- ─── Milestones ─────────────────────────────────────
INSERT INTO milestones (project_id, dot, amount, percentage, expected_date, status, paid_date) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 105000000, 50, '2026-03-01', 'paid', '2026-03-01'),
  ('00000000-0000-0000-0000-000000000001', 2, 63000000, 30, '2026-04-30', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000001', 3, 42000000, 20, '2026-05-15', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000002', 1, 175000000, 50, '2026-03-10', 'paid', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000002', 2, 105000000, 30, '2026-04-15', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000002', 3, 70000000, 20, '2026-05-15', 'pending', NULL);

-- ─── Phát Sinh ──────────────────────────────────────
INSERT INTO phat_sinhs (project_id, amount, description, status, date) VALUES
  ('00000000-0000-0000-0000-000000000001', 15000000, 'Client đổi brief, làm lại 5 shot', 'approved', '2026-04-05'),
  ('00000000-0000-0000-0000-000000000001', 8000000, 'Thêm 3 shot mới', 'pending', '2026-04-08');

-- ─── Debt Entries ───────────────────────────────────
INSERT INTO debt_entries (name, type, note) VALUES
  ('Anh Toàn (FE Credit)', 'bank', 'Vay trả góp máy tính'),
  ('Chị Lan', 'family', 'Mượn trả lương T1');

-- ─── Budget Lines (Knorr TVC forecast) ──────────────
INSERT INTO budget_lines (project_id, type, category, description, estimated_amount, actual_amount, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'thu', 'dot', 'Đợt 1 — Đặt cọc 50%', 105000000, 105000000, 'done'),
  ('00000000-0000-0000-0000-000000000001', 'thu', 'dot', 'Đợt 2 — 30%', 63000000, 0, 'planned'),
  ('00000000-0000-0000-0000-000000000001', 'thu', 'dot', 'Đợt 3 — 20% cuối', 42000000, 0, 'planned'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 'comp', 'Compositing / VFX', 35000000, 40000000, 'over'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 'render', 'Render / Cloud', 30000000, 35000000, 'over'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 'roto', 'Roto / Prep', 15000000, 15000000, 'done'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 'color', 'Color Grade / DI', 10000000, 10000000, 'done'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 'food', 'Ăn uống', 5000000, 8000000, 'over'),
  ('00000000-0000-0000-0000-000000000001', 'chi', 'ungcty', 'Ứng trước nhân viên', 5000000, 5000000, 'done');
