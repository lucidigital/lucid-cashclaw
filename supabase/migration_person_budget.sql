-- ═══════════════════════════════════════════════════════
-- Migration: Add person column to budget_lines & phat_sinhs
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Add person column to budget_lines
ALTER TABLE budget_lines ADD COLUMN IF NOT EXISTS person TEXT;

-- 2. Add person column to phat_sinhs
ALTER TABLE phat_sinhs ADD COLUMN IF NOT EXISTS person TEXT;

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_budget_lines_person ON budget_lines(person);
CREATE INDEX IF NOT EXISTS idx_transactions_person ON transactions(person);

-- 4. Update existing seed data with person names
-- Knorr TVC chi lines
UPDATE budget_lines SET person = 'Trung Ca' WHERE description LIKE '%Compositing%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');
UPDATE budget_lines SET person = 'Studio Render' WHERE description LIKE '%Render%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');
UPDATE budget_lines SET person = 'Hà Roto' WHERE description LIKE '%Roto%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');
UPDATE budget_lines SET person = 'Minh Color' WHERE description LIKE '%Color%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');
UPDATE budget_lines SET person = 'Team' WHERE description LIKE '%OT meals%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');

-- Milo Champion chi lines
UPDATE budget_lines SET person = 'Đạt 3D' WHERE description LIKE '%3D character%' AND project_id = (SELECT id FROM projects WHERE name = 'Milo Champion');
UPDATE budget_lines SET person = 'Trung Ca' WHERE description LIKE '%Animation compositing%' AND project_id = (SELECT id FROM projects WHERE name = 'Milo Champion');
UPDATE budget_lines SET person = 'Studio Render' WHERE description LIKE '%Cloud render%' AND project_id = (SELECT id FROM projects WHERE name = 'Milo Champion');
UPDATE budget_lines SET person = 'Sound Studio' WHERE description LIKE '%Sound%' AND project_id = (SELECT id FROM projects WHERE name = 'Milo Champion');

-- DHG Pharma chi lines
UPDATE budget_lines SET person = 'Linh Edit' WHERE description LIKE '%Offline edit%' AND project_id = (SELECT id FROM projects WHERE name = 'DHG Pharma');
UPDATE budget_lines SET person = 'Trung Ca' WHERE description LIKE '%VFX compositing%' AND project_id = (SELECT id FROM projects WHERE name = 'DHG Pharma');
UPDATE budget_lines SET person = 'Minh Color' WHERE description LIKE '%Color grade%' AND project_id = (SELECT id FROM projects WHERE name = 'DHG Pharma');

-- Update phat_sinhs with person
UPDATE phat_sinhs SET person = 'Trung Ca' WHERE description LIKE '%Client đổi brief%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');
UPDATE phat_sinhs SET person = 'Trung Ca' WHERE description LIKE '%Thêm 3 shot%' AND project_id = (SELECT id FROM projects WHERE name = 'Knorr TVC');
