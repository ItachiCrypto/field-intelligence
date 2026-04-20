-- =====================================================================
-- Field Intelligence — Security hardening
-- =====================================================================
-- Goals:
--  1. Close RLS holes:
--     - Add WITH CHECK to UPDATE policies so attackers cannot re-anchor rows
--       into another tenant, change their role, or flip company plan.
--     - Lock sensitive columns (role, company_id, plan, *_stripe_*) from
--       being updated via client-side UPDATE.
--  2. Harden the signup trigger handle_new_user():
--     - Never trust raw_user_meta_data.role (always start as 'marketing'
--       unless the user is the first of a newly-created company -> 'admin').
--     - Never trust raw_user_meta_data.company_id unless it matches a valid,
--       unexpired, not-yet-accepted invitation keyed by invitation_token.
--  3. Invitations:
--     - Hash the token at rest (token_hash column).
--     - Scope get_invitation_by_token() to unexpired / unaccepted rows.
--     - Return the invitation id so the signup trigger can mark it accepted.
--  4. Lock down SECURITY DEFINER functions with SET search_path = pg_catalog,
--     public so they cannot be hijacked by a CURRENT_USER-scoped search_path.
--  5. Enforce uniqueness on stripe_customer_id / stripe_subscription_id.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Prerequisites
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Helper functions: pin search_path
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_company_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 2. Invitations: store hash instead of trusting plaintext only
-- ---------------------------------------------------------------------
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS token_hash text;

-- Backfill: hash existing plaintext tokens once so the column is populated.
-- We keep `token` in the row for now (clients accepting existing invites may
-- still present plaintext); once clients migrate to hashed lookup only we
-- will drop it in a follow-up migration.
UPDATE invitations
SET token_hash = encode(extensions.digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL;

-- Going forward every invitation must carry a hash.
ALTER TABLE invitations
  ALTER COLUMN token_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token_hash
  ON invitations(token_hash);

-- Refresh lookup function: accepts plaintext token, compares against hash,
-- filters expired / already-accepted invites. Returns invitation id so the
-- signup trigger can mark it consumed atomically.
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
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT i.id, i.company_id, c.name, i.email, i.role, i.expires_at, i.accepted_at
  FROM public.invitations i
  JOIN public.companies c ON c.id = i.company_id
  WHERE i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    AND i.expires_at > now()
    AND i.accepted_at IS NULL
$$;

REVOKE ALL ON FUNCTION get_invitation_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(text) TO anon, authenticated;

-- Mark invitation accepted. Security definer so the signup trigger and the
-- /auth/callback handler can atomically consume the invite. Only the owner
-- (email match) may accept.
CREATE OR REPLACE FUNCTION accept_invitation(p_token text, p_user_email text)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  role user_role
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_hash text := encode(extensions.digest(p_token, 'sha256'), 'hex');
BEGIN
  RETURN QUERY
  UPDATE public.invitations i
  SET accepted_at = now()
  WHERE i.token_hash = v_hash
    AND i.expires_at > now()
    AND i.accepted_at IS NULL
    AND lower(i.email) = lower(p_user_email)
  RETURNING i.id, i.company_id, i.role;
END;
$$;

REVOKE ALL ON FUNCTION accept_invitation(text, text) FROM public;
GRANT EXECUTE ON FUNCTION accept_invitation(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Signup trigger: never trust client-supplied role/company_id
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_role user_role;
  v_invite_token text;
  v_invite_row record;
BEGIN
  v_invite_token := NULLIF(NEW.raw_user_meta_data->>'invitation_token', '');

  IF v_invite_token IS NOT NULL THEN
    -- Consume the invitation atomically. The helper verifies the token hash,
    -- expiry, acceptance state, AND that the email matches.
    SELECT * INTO v_invite_row
    FROM public.accept_invitation(v_invite_token, NEW.email);

    IF v_invite_row.id IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;

    v_company_id := v_invite_row.company_id;
    v_role := v_invite_row.role;
  ELSE
    -- No invite: this signup creates a brand new company; user becomes admin.
    v_company_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
      'Mon Entreprise'
    );
    INSERT INTO public.companies (name, plan)
    VALUES (v_company_name, 'free')
    RETURNING id INTO v_company_id;
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, company_id, email, name, role)
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

-- ---------------------------------------------------------------------
-- 4. Lock sensitive columns from client-side UPDATE
-- ---------------------------------------------------------------------
-- profiles: role / company_id cannot be changed via UPDATE by the row owner.
-- Only the handle_new_user trigger (SECURITY DEFINER) writes these.
CREATE OR REPLACE FUNCTION enforce_profile_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'profiles.company_id is immutable';
  END IF;
  -- Role may only be changed by an admin of the same company (not by self).
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'Users cannot change their own role';
    END IF;
    IF current_user_role() <> 'admin'
       OR current_company_id() IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'Only company admins can change a role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_immutable ON profiles;
CREATE TRIGGER enforce_profile_immutable
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_profile_immutable_columns();

-- companies: plan/limits/stripe* are server-only. Admins can only update
-- display fields (name). Everything billing-related flows through the
-- service role (Stripe webhook).
CREATE OR REPLACE FUNCTION enforce_company_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_user_limit IS DISTINCT FROM OLD.plan_user_limit
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end THEN
    -- These columns may only be changed by the service role (RLS bypass).
    -- auth.uid() is NULL when using the service role key.
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Billing columns are managed by the server only';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_company_immutable ON companies;
CREATE TRIGGER enforce_company_immutable
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION enforce_company_immutable_columns();

-- Uniqueness on Stripe identifiers (defense in depth against webhook
-- confusion / replay of a stale stripe_customer_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_stripe_customer
  ON companies(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_stripe_subscription
  ON companies(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 5. Policies: add missing WITH CHECK clauses
-- ---------------------------------------------------------------------
-- companies UPDATE: tenant + admin, both on the old row (USING) and any
-- candidate row (WITH CHECK) so the admin cannot flip `id`.
DROP POLICY IF EXISTS company_update_admin ON companies;
CREATE POLICY company_update_admin ON companies
  FOR UPDATE
  USING (id = current_company_id() AND current_user_role() = 'admin')
  WITH CHECK (id = current_company_id() AND current_user_role() = 'admin');

-- profiles UPDATE: keep self-or-admin-of-same-company, but enforce on both
-- sides so a row cannot be rehomed to another tenant.
DROP POLICY IF EXISTS profiles_update_self_or_admin ON profiles;
CREATE POLICY profiles_update_self_or_admin ON profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (company_id = current_company_id() AND current_user_role() = 'admin')
  )
  WITH CHECK (
    (id = auth.uid() AND company_id = current_company_id())
    OR (company_id = current_company_id() AND current_user_role() = 'admin')
  );

-- raw_visit_reports UPDATE: add WITH CHECK so company_id can't be rewritten.
DROP POLICY IF EXISTS raw_reports_update ON raw_visit_reports;
CREATE POLICY raw_reports_update ON raw_visit_reports
  FOR UPDATE
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- ---------------------------------------------------------------------
-- 6. Revoke direct INSERT on profiles from clients: only the trigger
--    writes profiles.
-- ---------------------------------------------------------------------
REVOKE INSERT ON profiles FROM authenticated, anon;

-- ---------------------------------------------------------------------
-- 7. Stripe webhook idempotency table
-- ---------------------------------------------------------------------
-- Every event id the webhook has ever acknowledged. The unique constraint
-- is what guarantees idempotency: a second delivery of the same event_id
-- fails with code 23505 and the handler short-circuits.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (which bypasses RLS) may
-- read or write this table.

-- (pgcrypto extension already created in section 0)
