-- ============================================================================
-- Selectly Database Migration 002
-- Adds preview_url/preview_expires_at to project_images
-- Adds public RLS policies for client selection access
-- ============================================================================

-- Add preview URL support to project_images
ALTER TABLE project_images
  ADD COLUMN preview_url TEXT,
  ADD COLUMN preview_expires_at TIMESTAMPTZ;

-- Public select policies for client selection access via link_token
-- These allow unauthenticated users to read project_images for projects
-- that are in 'selecting' or 'submitted' status.
-- Security: link_token verification happens at the API route level.

CREATE POLICY "project_images_select_public"
  ON project_images FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE status IN ('selecting', 'submitted')
      AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- Allow clients to insert selections (validated at API route level)
CREATE POLICY "selections_insert_public"
  ON selections FOR INSERT
  WITH CHECK (true);

-- Allow clients to read their own submission (for thank-you page)
CREATE POLICY "selections_select_public"
  ON selections FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE status IN ('submitted')
      AND deleted_at IS NULL
    )
  );

-- Allow public access to project metadata via link_token
CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  USING (
    status IN ('selecting', 'submitted')
    AND deleted_at IS NULL
  );
