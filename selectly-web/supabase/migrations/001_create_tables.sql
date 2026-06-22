-- ============================================================================
-- Selectly Database Migration 001
-- Creates all tables, indexes, RLS policies, and helper functions
-- ============================================================================

-- ─── Helper Functions ───────────────────────────────────────────────────────

-- Get the current user's studio_id for RLS policies
CREATE OR REPLACE FUNCTION public.get_studio_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT studio_id FROM profiles WHERE id = auth.uid()
$$;

-- Check if the current user is a member of a given studio
CREATE OR REPLACE FUNCTION public.is_studio_member(check_studio_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND studio_id = check_studio_id
  )
$$;

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- Studios (tenants)
CREATE TABLE studios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles within studios
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id  UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(studio_id, email)
);

CREATE INDEX idx_profiles_studio_id ON profiles(studio_id);

-- Projects
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES profiles(id),
  client_name   TEXT NOT NULL,
  event_date    DATE,
  target_count  INT NOT NULL CHECK (target_count > 0),
  min_count     INT NOT NULL CHECK (min_count > 0),
  max_count     INT NOT NULL CHECK (max_count >= min_count),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'uploading', 'uploaded', 'selecting', 'submitted', 'completed')),
  link_token    UUID UNIQUE DEFAULT gen_random_uuid(),
  total_images  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_projects_studio_id ON projects(studio_id);
CREATE INDEX idx_projects_status ON projects(studio_id, status);
CREATE INDEX idx_projects_link_token ON projects(link_token);

-- Project images (previews)
CREATE TABLE project_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  studio_id     UUID NOT NULL REFERENCES studios(id),
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  file_size     INT,
  mime_type     TEXT,
  width         INT,
  height        INT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_project_images_project_id ON project_images(project_id);
CREATE INDEX idx_project_images_studio_id ON project_images(studio_id);

-- Client selections
CREATE TABLE selections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  studio_id     UUID NOT NULL REFERENCES studios(id),
  selected      JSONB DEFAULT '[]'::jsonb,
  highlighted   JSONB DEFAULT '[]'::jsonb,
  rejected      JSONB DEFAULT '[]'::jsonb,
  skipped       JSONB DEFAULT '[]'::jsonb,
  submitted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_selections_project_id ON selections(project_id);

-- Activity audit log
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID NOT NULL REFERENCES studios(id),
  profile_id    UUID NOT NULL REFERENCES profiles(id),
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_studio_id ON activity_logs(studio_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(studio_id, created_at DESC);

-- ─── Row Level Security ─────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Studios: members can view, owners can update
CREATE POLICY "studios_select_members"
  ON studios FOR SELECT
  USING (public.is_studio_member(id));

CREATE POLICY "studios_update_owners"
  ON studios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND studio_id = id AND role IN ('owner', 'admin')
    )
  );

-- Profiles: members can view studio profiles, users can update own
CREATE POLICY "profiles_select_studio"
  ON profiles FOR SELECT
  USING (studio_id = public.get_studio_id());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Projects: studio members can CRUD
CREATE POLICY "projects_select_studio"
  ON projects FOR SELECT
  USING (studio_id = public.get_studio_id() AND deleted_at IS NULL);

CREATE POLICY "projects_insert_studio"
  ON projects FOR INSERT
  WITH CHECK (studio_id = public.get_studio_id());

CREATE POLICY "projects_update_studio"
  ON projects FOR UPDATE
  USING (studio_id = public.get_studio_id());

CREATE POLICY "projects_delete_owners"
  ON projects FOR DELETE
  USING (
    studio_id = public.get_studio_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Project images: studio members can CRUD
CREATE POLICY "project_images_select_studio"
  ON project_images FOR SELECT
  USING (studio_id = public.get_studio_id() AND deleted_at IS NULL);

CREATE POLICY "project_images_insert_studio"
  ON project_images FOR INSERT
  WITH CHECK (studio_id = public.get_studio_id());

CREATE POLICY "project_images_update_studio"
  ON project_images FOR UPDATE
  USING (studio_id = public.get_studio_id());

-- Selections: studio members can CRUD, client links use a separate policy
CREATE POLICY "selections_select_studio"
  ON selections FOR SELECT
  USING (studio_id = public.get_studio_id());

CREATE POLICY "selections_insert_studio"
  ON selections FOR INSERT
  WITH CHECK (studio_id = public.get_studio_id());

CREATE POLICY "selections_update_studio"
  ON selections FOR UPDATE
  USING (studio_id = public.get_studio_id());

-- Activity logs: studio members can view
CREATE POLICY "activity_logs_select_studio"
  ON activity_logs FOR SELECT
  USING (studio_id = public.get_studio_id());

CREATE POLICY "activity_logs_insert_studio"
  ON activity_logs FOR INSERT
  WITH CHECK (studio_id = public.get_studio_id());

-- ─── Storage RLS ────────────────────────────────────────────────────────────

-- Note: Run in Supabase SQL Editor after creating the 'previews' bucket
-- These policies assume the bucket 'previews' exists

-- CREATE POLICY "previews_select_studio"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'previews'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = public.get_studio_id()::text
--   );
--
-- CREATE POLICY "previews_insert_studio"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'previews'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = public.get_studio_id()::text
--   );
--
-- CREATE POLICY "previews_update_studio"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'previews'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = public.get_studio_id()::text
--   );

-- ─── Updated At Trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_studios_updated_at
  BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
