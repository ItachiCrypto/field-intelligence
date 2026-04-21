-- =====================================================================
-- Migration 00007 : auto-création entités depuis CRM
-- =====================================================================

-- 1. Unique constraint sur commercials(company_id, name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_commercials_company_name'
  ) THEN
    ALTER TABLE commercials ADD CONSTRAINT uniq_commercials_company_name UNIQUE (company_id, name);
  END IF;
END $$;

-- 2. Unique constraint sur accounts(company_id, name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_accounts_company_name'
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT uniq_accounts_company_name UNIQUE (company_id, name);
  END IF;
END $$;

-- 3. Fonction RPC pour incrémenter les compteurs CR d'un commercial
CREATE OR REPLACE FUNCTION increment_commercial_cr(
  p_company_id uuid,
  p_name       text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE commercials
  SET
    cr_total = COALESCE(cr_total, 0) + 1,
    cr_week  = COALESCE(cr_week,  0) + 1
  WHERE company_id = p_company_id
    AND name       = p_name;
$$;

-- 4. Backfill : créer les lignes commercials manquantes
INSERT INTO commercials (company_id, name, region, quality_score, quality_trend, cr_total, cr_week)
SELECT DISTINCT ON (r.company_id, r.commercial_name)
  r.company_id,
  r.commercial_name,
  '',
  50,
  0,
  (SELECT COUNT(*) FROM raw_visit_reports r2
   WHERE r2.company_id = r.company_id
     AND r2.commercial_name = r.commercial_name
     AND r2.processing_status IN ('done','skipped')),
  0
FROM raw_visit_reports r
WHERE r.commercial_name IS NOT NULL
  AND r.commercial_name <> ''
ON CONFLICT (company_id, name) DO UPDATE
  SET cr_total = EXCLUDED.cr_total;

-- 5. Backfill : créer les lignes accounts manquantes
INSERT INTO accounts (company_id, name, sector, region, risk_score, risk_trend)
SELECT DISTINCT ON (r.company_id, r.client_name)
  r.company_id,
  r.client_name,
  'Autre',
  '',
  0,
  0
FROM raw_visit_reports r
WHERE r.client_name IS NOT NULL
  AND r.client_name <> ''
ON CONFLICT (company_id, name) DO NOTHING;
