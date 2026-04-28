-- =====================================================================
-- 00012 — business_context sur companies + extension du trigger
--          handle_new_user() pour le persister depuis le signup form.
--
-- A la creation d'une entreprise, l'admin decrit en texte libre ce
-- que fait sa boite (secteur, contexte commercial, particularites).
-- Cette description est ensuite injectee comme contexte dans le prompt
-- d'extraction des CR pour aider l'IA a mieux les classifier.
-- =====================================================================

-- 1. Colonne business_context (texte libre, peut etre tres long).
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS business_context text;

-- 2. Extension du trigger handle_new_user() pour lire business_context
--    depuis raw_user_meta_data lorsque la company est creee a l'inscription.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_business_context text;
  v_role user_role;
BEGIN
  IF NEW.raw_user_meta_data ? 'company_id' AND NEW.raw_user_meta_data->>'company_id' <> '' THEN
    v_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'marketing');
  ELSE
    v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), 'Mon Entreprise');
    v_business_context := NULLIF(NEW.raw_user_meta_data->>'business_context', '');
    INSERT INTO companies (name, plan, business_context)
    VALUES (v_company_name, 'free', v_business_context)
    RETURNING id INTO v_company_id;
    v_role := 'admin';
  END IF;

  INSERT INTO profiles (id, company_id, email, name, role)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    v_role
  );

  RETURN NEW;
END;
$$;
