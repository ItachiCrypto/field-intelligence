-- Migration 001 — Corrections audit backend
-- Ajoute la table segment_insights, et complete accounts si besoin.

-- Table segment_insights (insights textuels par segment client)
CREATE TABLE IF NOT EXISTS segment_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  segment text NOT NULL,
  insight text NOT NULL,
  priorite int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_segment_insights_company ON segment_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_segment_insights_segment ON segment_insights(segment);

-- S'assurer que accounts a les colonnes utiles (sentiment_dominant, commercial_attitre, nb_cr)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sentiment_dominant text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS commercial_attitre text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS nb_cr integer DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS risk_level text;
