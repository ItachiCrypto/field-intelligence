-- =====================================================================
-- Field Intelligence — Initial schema
-- Multi-tenant SaaS (Supabase / Postgres 15+)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;

-- =====================================================================
-- 1. ENUMS
-- =====================================================================
CREATE TYPE user_role AS ENUM ('admin', 'marketing', 'kam', 'dirco');
CREATE TYPE plan_id AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
CREATE TYPE signal_type AS ENUM ('concurrence', 'besoin', 'prix', 'satisfaction', 'opportunite');
CREATE TYPE severity AS ENUM ('rouge', 'orange', 'jaune', 'vert');
CREATE TYPE alert_status AS ENUM ('nouveau', 'en_cours', 'traite', 'archive');
CREATE TYPE deal_motif AS ENUM ('prix', 'produit', 'offre', 'timing', 'concurrent', 'relation', 'budget', 'autre');
CREATE TYPE motif_commercial AS ENUM ('prix_non_competitif', 'timing_rate', 'concurrent_mieux_positionne', 'relation_insuffisante', 'besoin_mal_identifie', 'suivi_insuffisant');
CREATE TYPE objectif_type AS ENUM ('signature', 'sell_out', 'sell_in', 'formation', 'decouverte', 'fidelisation');
CREATE TYPE objectif_resultat AS ENUM ('atteint', 'non_atteint');
CREATE TYPE offre_type AS ENUM ('bundle', 'promotion', 'nouvelle_gamme', 'conditions_paiement', 'essai_gratuit', 'autre');
CREATE TYPE comm_type AS ENUM ('salon', 'pub', 'emailing', 'social', 'presse', 'sponsoring', 'partenariat', 'autre');
CREATE TYPE reaction_client AS ENUM ('positive', 'neutre', 'negative');
CREATE TYPE attribut_pos AS ENUM ('prix', 'qualite', 'sav', 'delai', 'relation', 'innovation');
CREATE TYPE valeur_percue AS ENUM ('fort', 'moyen', 'faible');
CREATE TYPE sentiment_type AS ENUM ('positif', 'negatif', 'neutre', 'interesse');
CREATE TYPE client_segment AS ENUM ('nouveau', 'etabli');
CREATE TYPE trend_direction AS ENUM ('hausse', 'baisse', 'stable');
CREATE TYPE reco_type AS ENUM ('opportunite', 'risque', 'territoire', 'coaching');
CREATE TYPE reco_statut AS ENUM ('nouvelle', 'vue', 'en_cours', 'done');
CREATE TYPE abbrev_category AS ENUM ('general', 'commercial', 'technique', 'organisation');
CREATE TYPE ecart_type AS ENUM ('inferieur', 'superieur');
CREATE TYPE statut_deal AS ENUM ('gagne', 'perdu', 'en_cours');
CREATE TYPE need_trend AS ENUM ('up', 'down', 'stable', 'new');

-- =====================================================================
-- 2. CORE MULTI-TENANT TABLES
-- =====================================================================

CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan plan_id DEFAULT 'free',
  plan_user_limit int DEFAULT 3,
  subscription_status subscription_status DEFAULT 'active',
  current_period_end timestamptz
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text,
  role user_role NOT NULL DEFAULT 'marketing',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role user_role NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_invitations_company_id ON invitations(company_id);
CREATE INDEX idx_invitations_token ON invitations(token);

-- =====================================================================
-- 3. HELPER FUNCTIONS
-- =====================================================================

CREATE OR REPLACE FUNCTION current_company_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Public lookup of invitation by token (used in accept-invite flow, unauthenticated)
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  company_name text,
  email text,
  role user_role,
  expires_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT i.id, i.company_id, c.name, i.email, i.role, i.expires_at, i.accepted_at
  FROM invitations i
  JOIN companies c ON c.id = i.company_id
  WHERE i.token = p_token
$$;

-- =====================================================================
-- 4. BUSINESS TABLES
-- =====================================================================

CREATE TABLE commercials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text,
  region text,
  quality_score int,
  quality_trend int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text,
  sector text,
  region text,
  ca_annual bigint,
  kam_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  risk_score int DEFAULT 0,
  risk_trend int DEFAULT 0,
  last_rdv date,
  health severity DEFAULT 'vert',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  name text,
  role text,
  first_detected date,
  is_new boolean DEFAULT true
);

CREATE TABLE competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text,
  mention_type text,
  risk severity,
  is_new boolean DEFAULT false
);

CREATE TABLE signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type signal_type,
  severity severity,
  title text,
  content text,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  commercial_id uuid REFERENCES commercials(id) ON DELETE SET NULL,
  region text,
  competitor_id uuid REFERENCES competitors(id) ON DELETE SET NULL,
  competitor_name text,
  price_delta int,
  treated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  signal_id uuid REFERENCES signals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  severity severity,
  status alert_status DEFAULT 'nouveau',
  created_at timestamptz DEFAULT now(),
  treated_at timestamptz
);

CREATE TABLE needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  label text,
  mentions int,
  evolution int,
  trend need_trend,
  rank_order int
);

CREATE TABLE prix_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  concurrent_nom text,
  ecart_pct int,
  ecart_type ecart_type,
  statut_deal statut_deal,
  commercial_name text,
  client_name text,
  region text,
  verbatim text,
  date date
);

CREATE TABLE deals_marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  motif_principal deal_motif,
  resultat statut_deal,
  concurrent_nom text,
  commercial_name text,
  client_name text,
  region text,
  verbatim text,
  date date
);

CREATE TABLE deals_commerciaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  motif motif_commercial,
  resultat statut_deal,
  concurrent_nom text,
  commercial_name text,
  client_name text,
  region text,
  verbatim text,
  date date
);

CREATE TABLE offres_concurrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  concurrent_nom text,
  type_offre offre_type,
  description text,
  date_premiere_mention date,
  count_mentions int,
  deals_impactes int,
  deals_perdus int,
  deals_gagnes int,
  region text,
  secteur text,
  statut text
);

CREATE TABLE comm_concurrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  concurrent_nom text,
  type_action comm_type,
  description text,
  reaction_client reaction_client,
  date date,
  count_mentions int,
  region text
);

CREATE TABLE positionnement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  acteur text,
  attribut attribut_pos,
  valeur valeur_percue,
  count int
);

CREATE TABLE cr_objectifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  commercial_id uuid REFERENCES commercials(id) ON DELETE SET NULL,
  commercial_name text,
  client_name text,
  objectif_type objectif_type,
  resultat objectif_resultat,
  cause_echec text,
  facteur_reussite text,
  date date,
  region text
);

CREATE TABLE territoires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  territoire text,
  commercial_names text[],
  nb_cr int,
  sentiment_dominant sentiment_type,
  nb_mentions_concurrents int,
  nb_opportunites int,
  nb_risques_perte int,
  tendance_vs_mois_precedent trend_direction,
  score_priorite int,
  motifs_opportunite text[],
  motifs_risque text[]
);

CREATE TABLE region_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  region text,
  top_besoins text[],
  concurrent_principal text,
  concurrent_mentions int,
  sentiment_dominant sentiment_type,
  specificite_locale text,
  nb_signaux int
);

CREATE TABLE geo_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  region text,
  dept text,
  opportunites int,
  risques int,
  concurrence int,
  besoins int,
  intensite int
);

CREATE TABLE geo_sector_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  secteur text,
  region text,
  signaux_concurrence int,
  signaux_besoins int,
  signaux_opportunites int,
  score_intensite int
);

CREATE TABLE recommandations_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type reco_type,
  territoire text,
  commercial_suggere text,
  priorite int,
  action_recommandee text,
  statut reco_statut DEFAULT 'nouvelle',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE segment_sentiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  segment client_segment,
  nb_cr int,
  pct_positif int,
  pct_negatif int,
  pct_neutre int,
  pct_interesse int,
  top_insatisfactions text[],
  top_points_positifs text[]
);

CREATE TABLE sentiment_periodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  periode text,
  positif int,
  negatif int,
  neutre int,
  interesse int,
  total int
);

CREATE TABLE sentiment_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  region text,
  positif int,
  negatif int,
  neutre int,
  interesse int,
  total int
);

CREATE TABLE motifs_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  motif text,
  type text CHECK (type IN ('positif', 'negatif')),
  mentions int
);

CREATE TABLE tendance_prix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  concurrent_nom text,
  semaine text,
  mentions int,
  ecart_moyen int,
  deals_perdus int,
  deals_gagnes int
);

CREATE TABLE deal_tendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  semaine text,
  prix int,
  produit int,
  offre int,
  timing int,
  concurrent int,
  relation int,
  budget int,
  autre int
);

CREATE TABLE deal_commercial_tendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  semaine text,
  prix_non_competitif int,
  timing_rate int,
  concurrent_mieux_positionne int,
  relation_insuffisante int,
  besoin_mal_identifie int,
  suivi_insuffisant int
);

CREATE TABLE ai_recommendations_text (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  text text
);

CREATE TABLE abbreviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  short text,
  full text,
  category abbrev_category
);

-- =====================================================================
-- 5. INDEXES
-- =====================================================================
CREATE INDEX idx_commercials_company_id ON commercials(company_id);

CREATE INDEX idx_accounts_company_id ON accounts(company_id);
CREATE INDEX idx_accounts_kam_id ON accounts(kam_id);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_account_id ON contacts(account_id);

CREATE INDEX idx_competitors_company_id ON competitors(company_id);

CREATE INDEX idx_signals_company_id ON signals(company_id);
CREATE INDEX idx_signals_account_id ON signals(account_id);
CREATE INDEX idx_signals_commercial_id ON signals(commercial_id);
CREATE INDEX idx_signals_competitor_id ON signals(competitor_id);

CREATE INDEX idx_alerts_company_id ON alerts(company_id);
CREATE INDEX idx_alerts_signal_id ON alerts(signal_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);

CREATE INDEX idx_needs_company_id ON needs(company_id);
CREATE INDEX idx_prix_signals_company_id ON prix_signals(company_id);
CREATE INDEX idx_deals_marketing_company_id ON deals_marketing(company_id);
CREATE INDEX idx_deals_commerciaux_company_id ON deals_commerciaux(company_id);
CREATE INDEX idx_offres_concurrentes_company_id ON offres_concurrentes(company_id);
CREATE INDEX idx_comm_concurrentes_company_id ON comm_concurrentes(company_id);
CREATE INDEX idx_positionnement_company_id ON positionnement(company_id);

CREATE INDEX idx_cr_objectifs_company_id ON cr_objectifs(company_id);
CREATE INDEX idx_cr_objectifs_commercial_id ON cr_objectifs(commercial_id);

CREATE INDEX idx_territoires_company_id ON territoires(company_id);
CREATE INDEX idx_region_profiles_company_id ON region_profiles(company_id);
CREATE INDEX idx_geo_points_company_id ON geo_points(company_id);
CREATE INDEX idx_geo_sector_data_company_id ON geo_sector_data(company_id);
CREATE INDEX idx_recommandations_ia_company_id ON recommandations_ia(company_id);
CREATE INDEX idx_segment_sentiments_company_id ON segment_sentiments(company_id);
CREATE INDEX idx_sentiment_periodes_company_id ON sentiment_periodes(company_id);
CREATE INDEX idx_sentiment_regions_company_id ON sentiment_regions(company_id);
CREATE INDEX idx_motifs_sentiment_company_id ON motifs_sentiment(company_id);
CREATE INDEX idx_tendance_prix_company_id ON tendance_prix(company_id);
CREATE INDEX idx_deal_tendance_company_id ON deal_tendance(company_id);
CREATE INDEX idx_deal_commercial_tendance_company_id ON deal_commercial_tendance(company_id);

CREATE INDEX idx_ai_recommendations_text_company_id ON ai_recommendations_text(company_id);
CREATE INDEX idx_ai_recommendations_text_account_id ON ai_recommendations_text(account_id);

CREATE INDEX idx_abbreviations_company_id ON abbreviations(company_id);

-- =====================================================================
-- 6. TRIGGERS
-- =====================================================================

-- Create a profile (and company if needed) when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_role user_role;
BEGIN
  IF NEW.raw_user_meta_data ? 'company_id' AND NEW.raw_user_meta_data->>'company_id' <> '' THEN
    v_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'marketing');
  ELSE
    v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), 'Mon Entreprise');
    INSERT INTO companies (name, plan)
    VALUES (v_company_name, 'free')
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enforce per-plan user limit
CREATE OR REPLACE FUNCTION enforce_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
  v_limit int;
BEGIN
  SELECT count(*) INTO v_current FROM profiles WHERE company_id = NEW.company_id;
  SELECT plan_user_limit INTO v_limit FROM companies WHERE id = NEW.company_id;
  IF v_current >= v_limit THEN
    RAISE EXCEPTION 'User limit reached for current plan';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_limit_trigger ON profiles;
CREATE TRIGGER enforce_user_limit_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_user_limit();

-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on everything
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

ALTER TABLE commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prix_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals_commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE offres_concurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_concurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE positionnement ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE territoires ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_sector_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommandations_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_sentiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_periodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE motifs_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tendance_prix ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_tendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE abbreviations ENABLE ROW LEVEL SECURITY;

-- ---- companies ----
CREATE POLICY "company_select_own" ON companies
  FOR SELECT USING (id = current_company_id());

CREATE POLICY "company_update_admin" ON companies
  FOR UPDATE USING (id = current_company_id() AND current_user_role() = 'admin');

-- ---- profiles ----
CREATE POLICY "profiles_select_same_company" ON profiles
  FOR SELECT USING (company_id = current_company_id());

CREATE POLICY "profiles_update_self_or_admin" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR (company_id = current_company_id() AND current_user_role() = 'admin')
  );

-- INSERT is handled by the handle_new_user() trigger (SECURITY DEFINER). No policy = no direct insert.

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (
    company_id = current_company_id() AND current_user_role() = 'admin'
  );

-- ---- invitations ----
CREATE POLICY "invitations_select_admin" ON invitations
  FOR SELECT USING (
    company_id = current_company_id() AND current_user_role() = 'admin'
  );

CREATE POLICY "invitations_insert_admin" ON invitations
  FOR INSERT WITH CHECK (
    company_id = current_company_id() AND current_user_role() = 'admin'
  );

CREATE POLICY "invitations_delete_admin" ON invitations
  FOR DELETE USING (
    company_id = current_company_id() AND current_user_role() = 'admin'
  );

-- ---- business tables: single "company_isolation" policy, ALL operations ----
CREATE POLICY "company_isolation" ON commercials
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON accounts
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON contacts
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON competitors
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON signals
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON alerts
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON needs
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON prix_signals
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON deals_marketing
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON deals_commerciaux
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON offres_concurrentes
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON comm_concurrentes
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON positionnement
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON cr_objectifs
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON territoires
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON region_profiles
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON geo_points
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON geo_sector_data
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON recommandations_ia
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON segment_sentiments
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON sentiment_periodes
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON sentiment_regions
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON motifs_sentiment
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON tendance_prix
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON deal_tendance
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON deal_commercial_tendance
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON ai_recommendations_text
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "company_isolation" ON abbreviations
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

-- =====================================================================
-- 8. GRANTS for public invitation-by-token lookup
-- =====================================================================
GRANT EXECUTE ON FUNCTION get_invitation_by_token(text) TO anon, authenticated;
