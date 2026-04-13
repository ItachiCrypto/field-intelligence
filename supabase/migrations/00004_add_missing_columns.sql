-- Migration 00004: Add missing columns expected by the UI

-- Competitors: dashboard expects mentions count and evolution trend
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS mentions int DEFAULT 0;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS evolution int DEFAULT 0;
