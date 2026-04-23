-- ─── Migration: Org Fields for People ────────────────────────────────────────
-- Thêm các trường thông tin chuyên biệt cho tab Tổ Chức
-- Date: 2026-04-23

ALTER TABLE people ADD COLUMN IF NOT EXISTS industry       TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS representative TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS location       TEXT;

COMMENT ON COLUMN people.industry       IS 'Phân ngành (VD: Quảng cáo, Ngân hàng, FMCG...)';
COMMENT ON COLUMN people.representative IS 'Tên người đại diện (link theo name từ bảng people)';
COMMENT ON COLUMN people.location       IS 'Địa điểm / địa chỉ';
