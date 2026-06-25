-- ============================================================================
-- Selixo Database Migration 006
-- Fix recursive RLS: make helper functions SECURITY DEFINER so they bypass RLS
-- when looking up the user's own profile, preventing infinite recursion.
-- ============================================================================

-- ─── Fix helper functions ────────────────────────────────────────────────────
-- These functions query `profiles`, which has RLS enabled. Without SECURITY
-- DEFINER, the inner query is also subject to RLS on profiles, which calls the
-- function again → recursion → PostgreSQL returns NULL → all rows invisible.

CREATE OR REPLACE FUNCTION public.get_studio_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT studio_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_studio_member(check_studio_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND studio_id = check_studio_id
  )
$$;

-- ─── Fix profiles SELECT policy ──────────────────────────────────────────────
-- Allow users to read their own profile directly (id = auth.uid()) in addition
-- to studio-based access. This avoids relying on get_studio_id() when the user
-- is querying their own record (the most common case).

DROP POLICY IF EXISTS "profiles_select_studio" ON profiles;

CREATE POLICY "profiles_select_members"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR studio_id = public.get_studio_id()
  );
