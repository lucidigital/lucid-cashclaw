-- Add 'leader' to people.type CHECK constraint
-- Run in Supabase SQL Editor

ALTER TABLE people DROP CONSTRAINT IF EXISTS people_type_check;
ALTER TABLE people ADD CONSTRAINT people_type_check
  CHECK (type IN ('leader','staff','freelance','supplier','org'));
