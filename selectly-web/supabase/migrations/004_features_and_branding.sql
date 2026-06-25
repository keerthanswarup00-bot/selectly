-- Migration 004: Phase 2 Features - Studio Branding, Activity Timeline, Status System, Subscriptions

-- ============================================
-- 1. STUDIO BRANDING
-- ============================================
CREATE TABLE IF NOT EXISTS studio_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#f59e0b',
  font_choice TEXT DEFAULT 'inter',
  welcome_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE studio_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_branding_select_own"
  ON studio_branding FOR SELECT
  USING (studio_id = get_studio_id());

CREATE POLICY "studio_branding_insert_own"
  ON studio_branding FOR INSERT
  WITH CHECK (studio_id = get_studio_id());

CREATE POLICY "studio_branding_update_own"
  ON studio_branding FOR UPDATE
  USING (studio_id = get_studio_id())
  WITH CHECK (studio_id = get_studio_id());

CREATE POLICY "studio_branding_select_public"
  ON studio_branding FOR SELECT
  USING (true);

-- ============================================
-- 2. CLIENT LANDING PAGES
-- ============================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_path TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS welcome_message TEXT;

-- ============================================
-- 3. FAVORITE / MAYBE / REJECTED STATUS SYSTEM
-- ============================================
-- Adds per-image status tracking beyond the selection set
CREATE TABLE IF NOT EXISTS image_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES project_images(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('favorite', 'maybe', 'rejected', 'selected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(image_id, project_id)
);

ALTER TABLE image_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "image_statuses_select_studio"
  ON image_statuses FOR SELECT
  USING (studio_id = get_studio_id());

CREATE POLICY "image_statuses_insert_studio"
  ON image_statuses FOR INSERT
  WITH CHECK (studio_id = get_studio_id());

CREATE POLICY "image_statuses_update_studio"
  ON image_statuses FOR UPDATE
  USING (studio_id = get_studio_id())
  WITH CHECK (studio_id = get_studio_id());

CREATE POLICY "image_statuses_delete_studio"
  ON image_statuses FOR DELETE
  USING (studio_id = get_studio_id());

-- ============================================
-- 4. EMAIL TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_select_own"
  ON email_templates FOR SELECT
  USING (studio_id = get_studio_id());

CREATE POLICY "email_templates_insert_own"
  ON email_templates FOR INSERT
  WITH CHECK (studio_id = get_studio_id());

CREATE POLICY "email_templates_update_own"
  ON email_templates FOR UPDATE
  USING (studio_id = get_studio_id())
  WITH CHECK (studio_id = get_studio_id());

CREATE POLICY "email_templates_delete_own"
  ON email_templates FOR DELETE
  USING (studio_id = get_studio_id());

-- ============================================
-- 5. SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL,
  max_projects INTEGER NOT NULL DEFAULT -1,
  max_images_per_project INTEGER NOT NULL DEFAULT -1,
  max_storage_gb INTEGER NOT NULL DEFAULT 5,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_all"
  ON subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "studio_subscriptions_select_own"
  ON studio_subscriptions FOR SELECT
  USING (studio_id = get_studio_id());

-- Insert default plans
INSERT INTO subscription_plans (name, code, description, price_monthly_cents, max_projects, max_images_per_project, max_storage_gb, features) VALUES
  ('Free', 'free', 'For trying out Selectly', 0, 3, 100, 1, '{"branding": false, "analytics": false, "priority_support": false, "custom_domain": false}'),
  ('Pro', 'pro', 'For professional photographers', 2900, 50, 500, 50, '{"branding": true, "analytics": true, "priority_support": false, "custom_domain": false}'),
  ('Studio', 'studio', 'For growing studios', 7900, -1, -1, 200, '{"branding": true, "analytics": true, "priority_support": true, "custom_domain": true}')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 6. ACTIVITY TIMELINE - enhanced
-- ============================================
-- Add more activity types
ALTER TABLE activity_logs ALTER COLUMN action TYPE TEXT;

-- Add indexes for timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_project
  ON activity_logs(resource_id, created_at DESC)
  WHERE resource_type = 'project';

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================
-- Auto-create free subscription for new studios
CREATE OR REPLACE FUNCTION auto_create_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM subscription_plans WHERE code = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO studio_subscriptions (studio_id, plan_id, status, current_period_start, trial_end)
    VALUES (NEW.id, free_plan_id, 'active', now(), now() + interval '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_free_subscription ON studios;
CREATE TRIGGER trg_auto_create_free_subscription
  AFTER INSERT ON studios
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_free_subscription();

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_image_statuses_project
  ON image_statuses(project_id, status);
CREATE INDEX IF NOT EXISTS idx_image_statuses_image
  ON image_statuses(image_id);
CREATE INDEX IF NOT EXISTS idx_studio_branding_studio
  ON studio_branding(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_subscriptions_plan
  ON studio_subscriptions(plan_id);
