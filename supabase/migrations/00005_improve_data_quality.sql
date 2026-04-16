-- Migration : amelioration qualite donnees (audit 2026-04-16)
-- - cr_total sur commercials (CR total analyses, pas glissant 7j)
-- - first_seen_at sur competitors (pour gerer is_new)
-- - Extension enums pour permettre des statuts realistes

-- 1. commercials.cr_total : nombre total de CR analyses depuis le debut
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS cr_total int DEFAULT 0;

-- 2. competitors.first_seen_at : date de la premiere mention (pour is_new glissant)
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now();

-- 3. offres_concurrentes.last_seen_at : pour desactiver les offres non mentionnees recemment
ALTER TABLE offres_concurrentes ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- 4. Extension enum objectif_resultat pour couvrir 'partiel'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'objectif_resultat' AND e.enumlabel = 'partiel'
  ) THEN
    ALTER TYPE objectif_resultat ADD VALUE 'partiel';
  END IF;
END$$;

-- 5. Backfill cr_total depuis raw_visit_reports
UPDATE commercials c SET cr_total = (
  SELECT count(*) FROM raw_visit_reports r
  WHERE r.company_id = c.company_id AND r.commercial_name = c.name AND r.processing_status = 'done'
);

-- 6. Backfill first_seen_at pour competitors existants (via source_report)
UPDATE competitors co SET first_seen_at = COALESCE(
  (SELECT r.visit_date::timestamptz FROM raw_visit_reports r WHERE r.id = co.source_report_id),
  co.first_seen_at
) WHERE co.source_report_id IS NOT NULL;

-- 7. Nettoyage immediat : supprimer les competitors avec nom invalide
DELETE FROM competitors WHERE name IS NULL OR trim(name) = '' OR lower(trim(name)) IN ('null', 'undefined', 'none', 'nan');

-- 8. Recalcul is_new : true uniquement si mentionne pour la premiere fois < 14 jours
UPDATE competitors SET is_new = (first_seen_at > now() - INTERVAL '14 days');
