-- ============================================================================
-- Selixo Database Migration 007
-- Phase 2: Folders, selection rules, project simplification
-- ============================================================================

-- ─── Folders (primary unit for uploads, sharing, and selection) ─────────────

CREATE TABLE folders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  studio_id     UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  selection_type TEXT NOT NULL DEFAULT 'no_limit'
                  CHECK (selection_type IN ('no_limit', 'minimum', 'range')),
  min_count     INT DEFAULT 0 CHECK (min_count >= 0),
  max_count     INT DEFAULT 0 CHECK (max_count >= 0),
  total_images  INT DEFAULT 0,
  link_token    UUID UNIQUE DEFAULT gen_random_uuid(),
  link_expires_at TIMESTAMPTZ,
  link_password  TEXT,
  link_disabled  BOOLEAN DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN (
                    'draft', 'uploading', 'ready', 'shared',
                    'viewing', 'in_progress', 'submitted',
                    'approved', 'archived'
                  )),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Simplify projects table ────────────────────────────────────────────────

ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE projects ALTER COLUMN event_date DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN target_count DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN min_count DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN max_count DROP NOT NULL;

ALTER TABLE projects ALTER COLUMN target_count SET DEFAULT 0;
ALTER TABLE projects ALTER COLUMN min_count SET DEFAULT 0;
ALTER TABLE projects ALTER COLUMN max_count SET DEFAULT 0;

-- ─── Link existing images to folders ─────────────────────────────────────────

ALTER TABLE project_images ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- ─── Per-folder selections ───────────────────────────────────────────────────

ALTER TABLE selections ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;
ALTER TABLE selections ADD COLUMN IF NOT EXISTS client_name TEXT;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_folders_project_id ON folders(project_id, sort_order);
CREATE INDEX idx_folders_studio_id ON folders(studio_id);
CREATE INDEX idx_folders_link_token ON folders(link_token);
CREATE INDEX idx_project_images_folder_id ON project_images(folder_id);

-- ─── RLS for folders ─────────────────────────────────────────────────────────

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_select_studio"
  ON folders FOR SELECT
  USING (studio_id = public.get_studio_id());

CREATE POLICY "folders_insert_studio"
  ON folders FOR INSERT
  WITH CHECK (studio_id = public.get_studio_id());

CREATE POLICY "folders_update_studio"
  ON folders FOR UPDATE
  USING (studio_id = public.get_studio_id());

CREATE POLICY "folders_delete_studio"
  ON folders FOR DELETE
  USING (studio_id = public.get_studio_id());

-- Public access for shared folders (client gallery)
CREATE POLICY "folders_select_public"
  ON folders FOR SELECT
  USING (link_disabled = false);

-- ─── Update project_images RLS for folder-based access ───────────────────────

DROP POLICY IF EXISTS "project_images_select_public" ON project_images;

CREATE POLICY "project_images_select_public"
  ON project_images FOR SELECT
  USING (
    (
      -- Access via folder link
      folder_id IS NOT NULL
      AND folder_id IN (SELECT id FROM folders WHERE link_disabled = false)
    )
    OR
    (
      -- Access via project link (legacy)
      folder_id IS NULL
      AND project_id IN (SELECT id FROM projects WHERE status IN ('selecting', 'submitted') AND deleted_at IS NULL)
    )
    AND deleted_at IS NULL
  );

-- ─── Updated-at trigger for folders ───────────────────────────────────────────

CREATE TRIGGER trigger_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
