-- =====================================================================
-- 00011 — Auto-seed des abbreviations par defaut a la creation d'une
-- entreprise, + backfill des entreprises existantes.
--
-- Chaque nouvelle company recoit automatiquement un lexique de base
-- (CRM, CA, RDV, ROI, etc.). Les abbreviations custom de la company
-- restent intactes. Unique (company_id, short) pour eviter les doublons.
-- =====================================================================

-- 1. Contrainte d'unicite pour rendre le seeding idempotent.
--    On nettoie d'abord les eventuels doublons existants (garde le plus recent).
DELETE FROM abbreviations a
  USING abbreviations b
  WHERE a.ctid < b.ctid
    AND a.company_id = b.company_id
    AND lower(a.short) = lower(b.short);

ALTER TABLE abbreviations
  ADD CONSTRAINT abbreviations_company_short_unique UNIQUE (company_id, short);

-- 2. Fonction qui insere la liste par defaut pour une company.
CREATE OR REPLACE FUNCTION seed_default_abbreviations(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO abbreviations (company_id, short, "full", category) VALUES
    (p_company_id, 'AO',    'Appel d''Offres',                        'commercial'),
    (p_company_id, 'BtoB',  'Business to Business',                   'commercial'),
    (p_company_id, 'CA',    'Chiffre d''Affaires',                    'commercial'),
    (p_company_id, 'CR',    'Compte Rendu',                           'general'),
    (p_company_id, 'CRM',   'Customer Relationship Management',       'technique'),
    (p_company_id, 'DAF',   'Directeur Administratif et Financier',   'organisation'),
    (p_company_id, 'DG',    'Directeur General',                      'organisation'),
    (p_company_id, 'Dirco', 'Directeur Commercial',                   'organisation'),
    (p_company_id, 'ERP',   'Enterprise Resource Planning',           'technique'),
    (p_company_id, 'ETI',   'Entreprise de Taille Intermediaire',     'organisation'),
    (p_company_id, 'IDF',   'Ile-de-France',                          'general'),
    (p_company_id, 'KAM',   'Key Account Manager',                    'organisation'),
    (p_company_id, 'NPS',   'Net Promoter Score',                     'technique'),
    (p_company_id, 'PDG',   'President-Directeur General',            'organisation'),
    (p_company_id, 'PME',   'Petite et Moyenne Entreprise',           'organisation'),
    (p_company_id, 'RDV',   'Rendez-vous',                            'general'),
    (p_company_id, 'ROI',   'Retour sur Investissement',              'commercial'),
    (p_company_id, 'SAV',   'Service Apres-Vente',                    'commercial'),
    (p_company_id, 'SLA',   'Service Level Agreement',                'technique'),
    (p_company_id, 'TCO',   'Total Cost of Ownership',                'technique')
  ON CONFLICT (company_id, short) DO NOTHING;
END;
$$;

-- 3. Trigger qui appelle le seeding apres chaque creation d'entreprise.
CREATE OR REPLACE FUNCTION on_company_created_seed_abbrev()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM seed_default_abbreviations(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_seed_abbrev ON companies;
CREATE TRIGGER trg_company_seed_abbrev
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION on_company_created_seed_abbrev();

-- 4. Backfill : toutes les companies existantes recoivent le lexique de base
--    si certaines abbreviations par defaut manquent. ON CONFLICT protege
--    l'existant.
DO $$
DECLARE
  comp_id uuid;
BEGIN
  FOR comp_id IN SELECT id FROM companies LOOP
    PERFORM seed_default_abbreviations(comp_id);
  END LOOP;
END $$;
