-- ============================================================================
-- Selixo Database Migration 005
-- Fix signup RLS by allowing studio creation + profile creation
-- ============================================================================

-- Allow authenticated users to insert studios (needed during signup before
-- a profile exists). The signup server action also uses the admin client
-- (service_role key) as the primary path, but this policy provides a
-- fallback if the admin client is unavailable.
CREATE POLICY "studios_insert_authenticated"
  ON studios FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
