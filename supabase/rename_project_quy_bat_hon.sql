-- Rename project: Cau_Hoa_Nguc_Movie → Quỷ Bắt Hồn Movie
-- Run this in Supabase SQL Editor

UPDATE projects
SET name = 'Quỷ Bắt Hồn Movie'
WHERE name ILIKE '%Cau%Hoa%Nguc%'
   OR name ILIKE '%Cầu%Hỏa%Ngục%'
   OR name = 'Cau_Hoa_Nguc_Movie';

-- Verify
SELECT id, name, status, budget FROM projects WHERE name = 'Quỷ Bắt Hồn Movie';
