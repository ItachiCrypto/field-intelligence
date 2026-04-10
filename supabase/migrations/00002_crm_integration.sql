-- =====================================================================
-- Field Intelligence — CRM Integration Schema
-- Salesforce sync + NLP processing pipeline
-- =====================================================================

-- Enums
CREATE TYPE crm_provider AS ENUM ('salesforce', 'hubspot', 'dynamics', 'pipedrive');
CREATE TYPE connection_status AS ENUM ('pending', 'connected', 'error', 'revoked');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'done', 'error', 'skipped');

-- =====================================================================
-- CRM Connections (one per company per provider)
-- =====================================================================
CREATE TABLE crm_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider crm_provider NOT NULL DEFAULT 'salesforce',
  access_token_encrypted text,
  refresh_token_encrypted text,
  instance_url text,
  salesforce_org_id text,
  token_expires_at timestamptz,
  status connection_status NOT NULL DEFAULT 'pending',
  config_json jsonb DEFAULT '{}',
  last_sync_at timestamptz,
  last_sync_error text,
  records_synced int DEFAULT 0,
  api_calls_today int DEFAULT 0,
  api_calls_reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

-- =====================================================================
-- Raw Visit Reports (imported from CRM, before NLP)
-- =====================================================================
CREATE TABLE raw_visit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  crm_connection_id uuid NOT NULL REFERENCES crm_connections(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  external_updated_at timestamptz,
  content_text text,
  subject text,
  commercial_email text,
  commercial_name text,
  client_name text,
  client_external_id text,
  visit_date date,
  raw_json jsonb,
  synced_at timestamptz DEFAULT now(),
  processing_status processing_status NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  processing_error text,
  processing_attempts int DEFAULT 0,
  UNIQUE(company_id, external_id)
);

-- =====================================================================
-- Processing Results (audit log of NLP extractions)
-- =====================================================================
CREATE TABLE processing_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_report_id uuid NOT NULL REFERENCES raw_visit_reports(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  extracted_json jsonb,
  signals_created int DEFAULT 0,
  model_used text DEFAULT 'claude-sonnet-4-20250514',
  tokens_used int DEFAULT 0,
  processing_time_ms int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- Add source_report_id to existing tables (traceability)
-- =====================================================================
ALTER TABLE signals ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE deals_marketing ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE deals_commerciaux ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE prix_signals ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE cr_objectifs ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE offres_concurrentes ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE comm_concurrentes ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE needs ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_report_id uuid REFERENCES raw_visit_reports(id) ON DELETE SET NULL;

-- =====================================================================
-- Indexes
-- =====================================================================
CREATE INDEX idx_crm_connections_company ON crm_connections(company_id);
CREATE INDEX idx_crm_connections_status ON crm_connections(status);
CREATE INDEX idx_raw_reports_company ON raw_visit_reports(company_id);
CREATE INDEX idx_raw_reports_processing ON raw_visit_reports(company_id, processing_status);
CREATE INDEX idx_raw_reports_external ON raw_visit_reports(company_id, external_id);
CREATE INDEX idx_raw_reports_date ON raw_visit_reports(company_id, visit_date DESC);
CREATE INDEX idx_processing_results_report ON processing_results(raw_report_id);

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_results ENABLE ROW LEVEL SECURITY;

-- CRM connections: admin only
CREATE POLICY "crm_connections_admin" ON crm_connections
  FOR ALL USING (
    company_id = current_company_id()
    AND current_user_role() = 'admin'
  )
  WITH CHECK (
    company_id = current_company_id()
    AND current_user_role() = 'admin'
  );

-- Raw reports: all company members can read
CREATE POLICY "raw_reports_read" ON raw_visit_reports
  FOR SELECT USING (company_id = current_company_id());

CREATE POLICY "raw_reports_write" ON raw_visit_reports
  FOR INSERT WITH CHECK (company_id = current_company_id());

CREATE POLICY "raw_reports_update" ON raw_visit_reports
  FOR UPDATE USING (company_id = current_company_id());

-- Processing results: all company members can read
CREATE POLICY "processing_results_read" ON processing_results
  FOR SELECT USING (company_id = current_company_id());

CREATE POLICY "processing_results_write" ON processing_results
  FOR INSERT WITH CHECK (company_id = current_company_id());
