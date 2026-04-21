-- =====================================================================
-- Migration 00008 : contrainte unique competitors + backfill
-- =====================================================================

-- 1. Unique constraint sur competitors(company_id, name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_competitors_company_name'
  ) THEN
    ALTER TABLE competitors ADD CONSTRAINT uniq_competitors_company_name UNIQUE (company_id, name);
  END IF;
END $$;

-- 2. Backfill competitors depuis les signaux (competitor_name non null)
INSERT INTO competitors (company_id, name, mention_type, risk)
SELECT DISTINCT ON (s.company_id, s.competitor_name)
  s.company_id,
  s.competitor_name,
  s.type,
  CASE
    WHEN s.severity = 'rouge'   THEN 'rouge'
    WHEN s.severity = 'orange'  THEN 'orange'
    ELSE 'jaune'
  END
FROM signals s
WHERE s.competitor_name IS NOT NULL
  AND s.competitor_name <> ''
ON CONFLICT (company_id, name) DO NOTHING;

-- 3. Backfill competitors depuis les prix_signals (concurrent_nom non null)
INSERT INTO competitors (company_id, name, mention_type, risk)
SELECT DISTINCT ON (p.company_id, p.concurrent_nom)
  p.company_id,
  p.concurrent_nom,
  'prix',
  'jaune'
FROM prix_signals p
WHERE p.concurrent_nom IS NOT NULL
  AND p.concurrent_nom <> ''
ON CONFLICT (company_id, name) DO NOTHING;

-- 4. Backfill alerts content depuis le signal lié
-- Note: signals n'a pas client_name → client_name reste null pour les Tasks sans WhatId
UPDATE alerts SET
  content = s.content
FROM signals s
WHERE alerts.signal_id = s.id
  AND alerts.content IS NULL
  AND s.content IS NOT NULL;
