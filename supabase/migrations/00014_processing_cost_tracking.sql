-- =====================================================================
-- 00014 — Tracking precis du cout d'extraction par CR
--
-- Avant : processing_results.tokens_used totalise prompt+completion en
-- une seule colonne. On ne peut pas calculer le cout reel parce que les
-- tarifs sont differents en input vs output (chez OpenAI Anthropic
-- l'output est 3-4x plus cher que l'input).
--
-- Apres : input_tokens / output_tokens / cost_usd renseignes a chaque
-- call. cost_usd est calcule serveur en utilisant le pricing du modele
-- au moment de l'appel — on garde la trace meme si les tarifs changent.
-- =====================================================================

ALTER TABLE processing_results
  ADD COLUMN IF NOT EXISTS input_tokens int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens int DEFAULT 0,
  -- numeric(10, 6) : 4 chiffres entiers + 6 decimales (jusqu'a $9999.999999)
  -- largement suffisant pour le cout par CR (de l'ordre du millieme de $).
  ADD COLUMN IF NOT EXISTS cost_usd numeric(10, 6) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_processing_results_company_cost
  ON processing_results(company_id, created_at DESC);
