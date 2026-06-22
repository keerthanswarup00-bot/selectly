# Database

## Entity Relationship

```
studios (1) ────── (N) profiles
studios (1) ────── (N) projects
studios (1) ────── (N) project_images
studios (1) ────── (N) selections
studios (1) ────── (N) activity_logs
projects (1) ───── (N) project_images
projects (1) ───── (1) selections
profiles (1) ───── (N) projects (as created_by)
```

---

## Tables

### `studios`

The top-level tenant. Every piece of data belongs to a studio.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `name` | TEXT | NOT NULL | Studio display name |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated by trigger |

### `profiles`

Links Supabase Auth users to studios. A user must have a profile to access anything.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE | Same as auth.users id |
| `studio_id` | UUID | NOT NULL, FK → `studios(id)` ON DELETE CASCADE | |
| `email` | TEXT | NOT NULL, UNIQUE(studio_id, email) | |
| `full_name` | TEXT | nullable | |
| `role` | TEXT | NOT NULL, DEFAULT 'owner', CHECK('owner','editor','admin') | `owner` has full access |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated by trigger |

### `projects`

A photography project belonging to a studio. Contains configuration for client selection.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `studio_id` | UUID | NOT NULL, FK → `studios(id)` ON DELETE CASCADE | |
| `created_by` | UUID | NOT NULL, FK → `profiles(id)` | |
| `client_name` | TEXT | NOT NULL | |
| `event_date` | DATE | nullable | When the event took place |
| `target_count` | INT | NOT NULL, CHECK > 0 | Ideal number of final selections |
| `min_count` | INT | NOT NULL, CHECK > 0 | Minimum selections required |
| `max_count` | INT | NOT NULL, CHECK >= min_count | Maximum selections allowed |
| `status` | TEXT | NOT NULL, DEFAULT 'draft' | See statuses below |
| `link_token` | UUID | UNIQUE, default `gen_random_uuid()` | Used for client share links |
| `total_images` | INT | DEFAULT 0 | Denormalized count |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated by trigger |
| `deleted_at` | TIMESTAMPTZ | nullable | Soft delete |

**Statuses:** `draft` → `uploading` → `uploaded` → `selecting` → `submitted` → `completed`

### `project_images`

Metadata for images uploaded to a project. The actual file lives in Supabase Storage.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `project_id` | UUID | NOT NULL, FK → `projects(id)` ON DELETE CASCADE | |
| `studio_id` | UUID | NOT NULL, FK → `studios(id)` | Denormalized for RLS |
| `filename` | TEXT | NOT NULL | Original filename |
| `storage_path` | TEXT | NOT NULL | Full storage path |
| `file_size` | INT | nullable | Bytes |
| `mime_type` | TEXT | nullable | e.g. image/jpeg |
| `width` | INT | nullable | Pixel width |
| `height` | INT | nullable | Pixel height |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | nullable | |

### `selections`

Stores the client's choices for a project. One row per project.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `project_id` | UUID | NOT NULL, UNIQUE, FK → `projects(id)` ON DELETE CASCADE | One-to-one |
| `studio_id` | UUID | NOT NULL, FK → `studios(id)` | Denormalized for RLS |
| `selected` | JSONB | DEFAULT '[]' | Array of image IDs |
| `highlighted` | JSONB | DEFAULT '[]' | Array of image IDs |
| `rejected` | JSONB | DEFAULT '[]' | Array of image IDs |
| `skipped` | JSONB | DEFAULT '[]' | Array of image IDs |
| `submitted_at` | TIMESTAMPTZ | nullable | Set when client submits |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `activity_logs`

Audit trail for all significant actions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `studio_id` | UUID | NOT NULL, FK → `studios(id)` | |
| `profile_id` | UUID | NOT NULL, FK → `profiles(id)` | Who performed the action |
| `action` | TEXT | NOT NULL | e.g. 'project.created', 'image.uploaded' |
| `resource_type` | TEXT | nullable | e.g. 'project', 'image' |
| `resource_id` | UUID | nullable | The affected resource |
| `metadata` | JSONB | DEFAULT '{}' | Arbitrary extra data |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Index Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `profiles` | `idx_profiles_studio_id` | B-tree | Fast studio user listing |
| `projects` | `idx_projects_studio_id` | B-tree | Studio project listing |
| `projects` | `idx_projects_status` | Composite B-tree | Filter projects by status per studio |
| `projects` | `idx_projects_link_token` | B-tree | Client share link lookup |
| `project_images` | `idx_project_images_project_id` | B-tree | Images for a project |
| `project_images` | `idx_project_images_studio_id` | B-tree | Studio-scoped queries |
| `selections` | `idx_selections_project_id` | B-tree | Lookup by project |
| `activity_logs` | `idx_activity_logs_studio_id` | B-tree | Studio audit log listing |
| `activity_logs` | `idx_activity_logs_created_at` | Composite DESC | Chronological ordering |

---

## RLS Policy Summary

| Table | Policy | Operation | Scope |
|-------|--------|-----------|-------|
| `studios` | `studios_select_members` | SELECT | Studio members can view their studio |
| `studios` | `studios_update_owners` | UPDATE | Owners/admins only |
| `profiles` | `profiles_select_studio` | SELECT | Users in same studio |
| `profiles` | `profiles_update_own` | UPDATE | Own profile only |
| `projects` | `projects_select_studio` | SELECT | Studio members, excludes soft-deleted |
| `projects` | `projects_insert_studio` | INSERT | Studio members |
| `projects` | `projects_update_studio` | UPDATE | Studio members |
| `projects` | `projects_delete_owners` | DELETE | Owners/admins only |
| `project_images` | `project_images_select_studio` | SELECT | Studio members, excludes soft-deleted |
| `project_images` | `project_images_insert_studio` | INSERT | Studio members |
| `project_images` | `project_images_update_studio` | UPDATE | Studio members |
| `selections` | `selections_select_studio` | SELECT | Studio members |
| `selections` | `selections_insert_studio` | INSERT | Studio members |
| `selections` | `selections_update_studio` | UPDATE | Studio members |
| `activity_logs` | `activity_logs_select_studio` | SELECT | Studio members |
| `activity_logs` | `activity_logs_insert_studio` | INSERT | Studio members |

> **Note:** Client selection view (`/s/[token]`) uses a separate access pattern — either an anon key RLS policy that checks `link_token`, or a service role API route. This is not yet implemented in the migration.

---

## Migration Guide

### Creating a New Migration

1. Create a new file in `supabase/migrations/` with the format `NNN_description.sql`
2. Write idempotent SQL (use `IF NOT EXISTS` / `CREATE OR REPLACE`)
3. Test locally: `supabase db diff --local`
4. Apply locally: `supabase db push`
5. Commit the migration file

### Applying Migrations

```bash
# Local (if using Supabase CLI)
supabase db push

# Production
supabase db push --linked

# Or via the Supabase Dashboard SQL Editor
```

### Rolling Back

Supabase does not support automatic rollbacks. To revert:
- Write a new migration that reverses the changes
- Or restore from a database backup

---

## Helper Functions

### `auth.get_studio_id()`

Returns the `studio_id` for the currently authenticated user. Used by RLS policies on every table.

```sql
SELECT auth.get_studio_id();
```

### `auth.is_studio_member(check_studio_id UUID)`

Returns `true` if the current user belongs to the given studio. Used by the `studios` table policies.

```sql
SELECT auth.is_studio_member('some-studio-uuid');
```

### `update_updated_at_column()`

Trigger function that automatically sets `updated_at = NOW()` on row update. Applied to `studios`, `profiles`, and `projects` tables.
