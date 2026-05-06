-- =====================================================================
-- 00015 — Security hardening v2
--
-- Suite de l'audit securite : ferme deux failles concretes identifiees.
--
-- 1. Race condition sur enforce_user_limit. Le COUNT + INSERT n'etait pas
--    atomique : 2 invitations acceptees en parallele pouvaient toutes
--    deux passer le check (3/3) avant que l'INSERT ne se manifeste,
--    aboutissant a 4 users sur un plan limite a 3. On utilise un
--    pg_advisory_xact_lock par company_id pour serialiser strictement
--    les inserts dans la meme transaction.
--
-- 2. competitors n'avait pas d'unicite par (company_id, lower(name)).
--    Si 2 CR passaient ensemble a "Marque" et "marque", on creait des
--    doublons (deja patche cote process-report avec ilike, mais sans
--    contrainte SQL le bug pouvait revenir). On ajoute la contrainte.
-- =====================================================================

-- ── 1. enforce_user_limit atomique ──────────────────────────────────────
CREATE OR REPLACE FUNCTION enforce_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
  v_limit int;
  v_lock_key bigint;
BEGIN
  -- Hash le company_id en bigint stable pour l'advisory lock. hashtextextended
  -- est seed=0 par defaut donc deterministe — 2 transactions sur la meme
  -- company prendront le meme lock et s'attendront mutuellement.
  v_lock_key := hashtextextended(NEW.company_id::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT count(*) INTO v_current FROM profiles WHERE company_id = NEW.company_id;
  SELECT plan_user_limit INTO v_limit FROM companies WHERE id = NEW.company_id;

  IF v_current >= v_limit THEN
    RAISE EXCEPTION 'User limit reached for current plan'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 2. Unicite des competitors par company + lower(name) ────────────────
-- Cleanup avant ajout de la contrainte : si des doublons subsistent
-- (script dedup-competitors-case.mjs deja execute mais defense-in-depth)
DELETE FROM competitors a
  USING competitors b
  WHERE a.ctid < b.ctid
    AND a.company_id = b.company_id
    AND lower(a.name) = lower(b.name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_company_name_lower
  ON competitors (company_id, lower(name));
