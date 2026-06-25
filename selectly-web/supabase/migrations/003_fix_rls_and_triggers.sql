-- ============================================================================
-- Selectly Database Migration 003
-- Drops vulnerable public policies, adds proper storage RLS,
-- adds total_images trigger, and improves data integrity
-- ============================================================================

-- ─── Remove Vulnerable Public Policies ─────────────────────────────────────

-- DROP: selections_insert_public allows ANYONE to insert arbitrary data
DROP POLICY IF EXISTS "selections_insert_public" ON selections;

-- The remaining public policies (project_images_select_public,
-- selections_select_public, projects_select_public) are intentionally kept.
-- They expose only minimal data and require a valid link_token to discover.
-- The selection INSERT path now uses the service_role admin client in API routes,
-- which bypasses RLS entirely and validates the token server-side.

-- ─── Storage RLS (previews bucket) ────────────────────────────────────────

-- NOTE: Run these AFTER the 'previews' bucket exists in Supabase.
-- Requires: storage.objects table (managed by Supabase, not created here).

-- Allow authenticated studio members to select previews in their studio folder
CREATE POLICY "previews_select_studio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_studio_id()::text
  );

-- Allow authenticated studio members to insert previews in their studio folder
CREATE POLICY "previews_insert_studio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_studio_id()::text
  );

-- Allow authenticated studio members to update previews in their studio folder
CREATE POLICY "previews_update_studio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_studio_id()::text
  );

-- ─── total_images Trigger ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_project_image_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects
    SET total_images = total_images + 1
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET total_images = total_images - 1
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_project_images_count ON project_images;

CREATE TRIGGER trigger_project_images_count
  AFTER INSERT OR DELETE ON project_images
  FOR EACH ROW
  EXECUTE FUNCTION update_project_image_count();
