-- Migration 00009 : Salesforce objects enrichment
-- Ajoute les colonnes SF sur accounts, contacts, commercials
-- et crée la table opportunities.

-- Colonnes SF sur accounts
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS sf_id text,
  ADD COLUMN IF NOT EXISTS nb_employees int,
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS sf_owner_id text;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_sf_id_company ON accounts(company_id, sf_id) WHERE sf_id IS NOT NULL;

-- Colonnes SF sur contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS sf_id text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS sf_account_id text;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_sf_id_company ON contacts(company_id, sf_id) WHERE sf_id IS NOT NULL;

-- Colonnes SF sur commercials
ALTER TABLE commercials
  ADD COLUMN IF NOT EXISTS sf_id text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS cr_total int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cr_week int DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS commercials_sf_id_company ON commercials(company_id, sf_id) WHERE sf_id IS NOT NULL;

-- Table opportunities (deals Salesforce)
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sf_id text NOT NULL,
  name text,
  amount numeric,
  stage text,
  close_date date,
  is_won boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  loss_reason text,
  account_sf_id text,
  account_name text,
  commercial_name text,
  commercial_sf_id text,
  region text,
  probability int,
  lead_source text,
  competitor_name text,
  sf_created_date timestamptz,
  sf_modified_date timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS opportunities_sf_id_company ON opportunities(company_id, sf_id);
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'company_isolation'
  ) THEN
    CREATE POLICY "company_isolation" ON opportunities FOR ALL
      USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
  END IF;
END$$;
