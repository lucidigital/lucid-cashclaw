-- ═══════════════════════════════════════════════════════════════
-- Lucid CashClaw — XÓA TOÀN BỘ DỮ LIỆU
-- ⚠️ CẢNH BÁO: Không thể hoàn tác!
-- Để restore: chạy backup_test_data.sql
-- ═══════════════════════════════════════════════════════════════

-- Xóa theo thứ tự con → cha để tránh lỗi FK constraint
TRUNCATE TABLE transactions    RESTART IDENTITY CASCADE;
TRUNCATE TABLE milestones      RESTART IDENTITY CASCADE;
TRUNCATE TABLE phat_sinhs      RESTART IDENTITY CASCADE;
TRUNCATE TABLE budget_lines    RESTART IDENTITY CASCADE;
TRUNCATE TABLE debt_entries    RESTART IDENTITY CASCADE;
TRUNCATE TABLE people          RESTART IDENTITY CASCADE;
TRUNCATE TABLE projects        RESTART IDENTITY CASCADE;
