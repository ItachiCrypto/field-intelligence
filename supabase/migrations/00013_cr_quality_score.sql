-- =====================================================================
-- 00013 — Score qualite par CR + breakdown reasons
--
-- Avant : commercials.quality_score etait hardcode a 50 a la creation et
-- jamais mis a jour. Aucun moyen pour le user de savoir comment ameliorer.
--
-- Apres : chaque raw_visit_reports porte un score 0-100 calcule a partir
-- de la richesse de l'extraction IA (presence verbatims, chiffres, next
-- steps, concurrents nommes, objectifs explicites, etc.). quality_reasons
-- est un jsonb listant les criteres remplis ET manquants pour pouvoir
-- afficher au commercial "ce qui te manque pour atteindre 80".
-- commercials.quality_score est ensuite la moyenne des N derniers CRs.
-- =====================================================================

ALTER TABLE raw_visit_reports
  ADD COLUMN IF NOT EXISTS quality_score int CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

ALTER TABLE raw_visit_reports
  ADD COLUMN IF NOT EXISTS quality_reasons jsonb;

CREATE INDEX IF NOT EXISTS idx_raw_visit_reports_quality
  ON raw_visit_reports(company_id, quality_score)
  WHERE quality_score IS NOT NULL;

-- Fonction pour mettre a jour commercials.quality_score depuis la moyenne
-- des CR du commercial. Seuil min : 3 CRs pour eviter qu'un seul score
-- aberrant ne tire la moyenne. Sinon on garde la valeur par defaut 50.
CREATE OR REPLACE FUNCTION refresh_commercial_quality_score(
  p_company_id uuid,
  p_commercial_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric;
  v_count int;
BEGIN
  SELECT AVG(quality_score)::numeric, COUNT(*)::int
    INTO v_avg, v_count
  FROM raw_visit_reports
  WHERE company_id = p_company_id
    AND commercial_name = p_commercial_name
    AND quality_score IS NOT NULL;

  IF v_count >= 1 THEN
    UPDATE commercials
       SET quality_score = ROUND(v_avg)::int
     WHERE company_id = p_company_id
       AND name = p_commercial_name;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_commercial_quality_score TO authenticated, service_role;
