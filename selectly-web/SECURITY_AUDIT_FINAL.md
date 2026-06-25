# Security Audit Report: Selectly

**Date:** 2026-06-24
**Scope:** Full-stack audit of selectly-web (Next.js + Supabase)
**Reviewer:** Automated code review

---

## 1. Executive Summary

Selectly is a client photo selection platform with studio-based multi-tenancy. The overall security posture is **moderate**. Strong patterns exist—service-role administration for privileged operations, RLS on all tables, and proper session handling—but several significant issues remain. The most critical finding is that the **signup flow cannot complete** because RLS INSERT policies are missing for the `studios` and `profiles` tables. Additionally, file upload lacks authorization checks and path-traversal sanitization. Three of the four findings from the initial migration (vulnerable public policies) have been addressed in migration 003, but the signup INSERT policy gap has not.

**Risk summary:** 1 critical, 2 high, 2 medium, 1 low.

---

## 2. Audit Scope

The following surface areas were reviewed:

| Area | Files |
|------|-------|
| **Supabase RLS policies** | `001_create_tables.sql`, `002_client_access.sql`, `003_fix_rls_and_triggers.sql` |
| **API routes** | `api/upload/route.ts`, `api/select/[token]/route.ts`, `api/select/[token]/images/route.ts`, `api/select/[token]/submit/route.ts` |
| **Auth flows** | `features/auth/actions/signup.ts`, `middleware.ts` |
| **Storage access** | `lib/supabase/admin.ts`, `lib/utils/storage-paths.ts` |
| **File validation** | `features/upload/utils/file-validator.ts`, `api/upload/route.ts` |
| **Configuration** | `config/index.ts` |

Not in scope: client-side components, third-party dependencies, deployment infrastructure.

---

## 3. Findings Summary

| # | Finding | Severity | Status | Mitigation |
|---|---------|----------|--------|------------|
| F-01 | Signup flow will fail: no RLS INSERT policies for `studios` or `profiles` tables | **Critical** | Open | Add `studios_insert` and `profiles_insert` policies, or use admin client |
| F-02 | Upload route does not verify user belongs to target studio or project | **High** | Open | Verify `studio_id` and `project_id` ownership server-side |
| F-03 | No filename/path sanitization in upload route — path-traversal risk | **High** | Open | Strip or reject `../`, `..\\`, null bytes, and other dangerous patterns from filenames |
| F-04 | Race condition in selection submit endpoint (TOCTOU) | **Medium** | Open | Use atomic conditional update or row-level locking |
| F-05 | No rate limiting on public endpoints (upload, submit) | **Medium** | Open | Implement rate limits via middleware or edge function |
| F-06 | `selections_insert_public` was removed but project/images GET still rely on token obscurity for the read path | **Low** | Mitigated | Token is a UUID — attacker must brute-force 128-bit space. Acceptable risk. |
| F-07 | `cleanupAuthUser` silently swallows errors (migration 003 context) | **Low** | Mitigated | Best-effort by design; documented in code comment |

---

## 4. Supabase Policies Review

### 4.1 Table: `studios`

| Operation | Policies | Review |
|-----------|----------|--------|
| SELECT | `studios_select_members` (via `is_studio_member(id)`) | ✅ Correct — only authenticated studio members can view their studio |
| INSERT | **None** | ❌ CRITICAL — no INSERT policy exists. RLS denies all inserts by default, so signup flow (`server.from("studios").insert(...)`) will fail at runtime |
| UPDATE | `studios_update_owners` (role IN ('owner', 'admin')) | ✅ Correct — only owners/admins can update |
| DELETE | **None** | ✅ Acceptable — studio deletion is handled server-side via admin client |

### 4.2 Table: `profiles`

| Operation | Policies | Review |
|-----------|----------|--------|
| SELECT | `profiles_select_studio` (via `get_studio_id()`) | ✅ Correct |
| INSERT | **None** | ❌ CRITICAL — no INSERT policy. Signup flow's `server.from("profiles").insert(...)` will fail |
| UPDATE | `profiles_update_own` (id = auth.uid()) | ✅ Correct — users can only update their own profile |
| DELETE | **None** | ✅ Acceptable — deletion is admin-only |

### 4.3 Table: `projects`

| Operation | Policies | Review |
|-----------|----------|--------|
| SELECT | `projects_select_studio` (soft-delete filter) | ✅ Correct — respects `deleted_at IS NULL` |
| INSERT | `projects_insert_studio` (WITH CHECK) | ✅ Correct |
| UPDATE | `projects_update_studio` | ✅ Correct — studio-scoped |
| DELETE | `projects_delete_owners` (role IN ('owner', 'admin')) | ✅ Correct — only owners/admins can hard-delete |

### 4.4 Table: `project_images`

| Operation | Policies | Review |
|-----------|----------|--------|
| SELECT | `project_images_select_studio` (studio-scoped, soft-delete filter)<br>`project_images_select_public` (status IN ('selecting', 'submitted')) | ✅ Acceptable — public policy exposes images only for active selection links |
| INSERT | `project_images_insert_studio` | ✅ Correct |
| UPDATE | `project_images_update_studio` | ✅ Correct |
| DELETE | **None** | ✅ Acceptable — deletion uses soft-delete or admin client |

### 4.5 Table: `selections`

| Operation | Policies | Review |
|-----------|----------|--------|
| SELECT | `selections_select_studio`<br>`selections_select_public` (only for `submitted` status) | ✅ Acceptable — public read only after submission |
| INSERT | `selections_insert_studio`<br>~~`selections_insert_public`~~ **(DROPPED in 003)** | ✅ Fixed — migration 003 dropped the vulnerable public insert policy. Inserts now go through service-role admin client, bypassing RLS entirely |
| UPDATE | `selections_update_studio` | ✅ Correct |

### 4.6 Table: `activity_logs`

| Operation | Policies | Review |
|-----------|----------|--------|
| SELECT | `activity_logs_select_studio` | ✅ Correct |
| INSERT | `activity_logs_insert_studio` | ✅ Correct |
| UPDATE/DELETE | **None** | ✅ Acceptable — audit logs should be append-only |

### 4.7 Public Access Review (Migration 002 → 003)

Three public policies were introduced in migration 002:

1. **`project_images_select_public`** — Allows unauthenticated SELECT on images for projects in `selecting`/`submitted` status. Retained. The attack surface is minimal: the attacker must know a valid project ID (UUID) to exploit this. Since IDs are not enumerable, this is acceptable.

2. **~~`selections_insert_public`~~** — Allowed **anyone** to insert arbitrary data into the `selections` table with `WITH CHECK (true)`. This was a critical vulnerability. **Fixed in migration 003** by dropping the policy and moving selection creation to the service-role admin client.

3. **`selections_select_public`** — Allows reading selections for `submitted` projects. Acceptable — required for the thank-you/confirmation page.

4. **`projects_select_public`** — Allows reading project metadata for `selecting`/`submitted` projects. Acceptable — exposes only non-sensitive fields via the API.

### 4.8 Storage Policies Review

Storage RLS was **commented out** in migration 001 (lines 218–241) and **activated** in migration 003 (lines 23–48).

| Bucket | Operation | Policy | Review |
|--------|-----------|--------|--------|
| `previews` | SELECT | `previews_select_studio` — authenticated users in their own studio folder | ✅ Correct |
| `previews` | INSERT | `previews_insert_studio` — authenticated users in their own studio folder | ✅ Correct |
| `previews` | UPDATE | `previews_update_studio` — authenticated users in their own studio folder | ✅ Correct |
| `previews` | DELETE | **None** | ✅ Acceptable — deletes are handled server-side |

**Important:** The upload route (`api/upload/route.ts`) uses the admin client (service_role key) for storage operations, which **bypasses storage RLS entirely**. Authorization is delegated to the application layer (see Finding F-02).

---

## 5. API Routes Review

### 5.1 `POST /api/upload` — Upload Route

```
File: src/app/api/upload/route.ts
Auth:  Required (via createServerClient → getUser)
Client: Admin (service_role) for storage + DB operations
```

**Authentication ✅**
- Calls `server.auth.getUser()` to verify session
- Returns 401 if no user

**Authorization ❌ Finding F-02**
- **No verification** that the authenticated user belongs to `studioId` provided in the form
- **No verification** that `projectId` belongs to `studioId`
- An authenticated user from Studio A can upload files to Studio B's project by manipulating form fields
- The admin client bypasses RLS, so no database-layer protection applies

**Input Validation ⚠️**
- Validates file extension and MIME type server-side ✅
- Validates file size ✅
- Width/height are parsed but not validated (could be NaN) ⚠️
- **No filename sanitization** (Finding F-03) — the raw `file.name` is used in `buildPreviewPath(studioId, projectId, file.name)`. A filename like `../../etc/passwd` could escape the intended path prefix. While Supabase storage normalizes paths to some degree, this should not be relied upon.

**Error Handling ✅**
- Storage failure → returns 500
- DB insert failure → cleans up uploaded file from storage (lines 113–116)
- Catches all exceptions → returns generic 500

**Cleanup on failure ✅**
- If the `project_images` DB insert fails, the storage file is removed (lines 113–115)

### 5.2 `GET /api/select/[token]` — Project Info

```
File: src/app/api/select/[token]/route.ts
Auth:  None (public — uses anon key)
Client: Anon (createServerClient → RLS-enforced)
```

**Authentication ❌ (by design)**
- No auth required — this is a public share link endpoint
- Relies on the link_token UUID being unguessable

**Authorization ✅**
- Checks project exists via link_token (returns 404 if not found)
- Checks project status is `selecting` or `submitted` (returns 403 otherwise)
- Only returns non-sensitive fields: `client_name`, `event_date`, `target_count`, `min_count`, `max_count`, `status`, `studio_name`

**Caching ✅**
- Uses `unstable_cache` with 60s revalidation and tag-based invalidation
- Retry wrapper applied

**Input Validation ✅**
- Token is a path parameter — no injection vector

### 5.3 `GET /api/select/[token]/images` — Project Images

```
File: src/app/api/select/[token]/images/route.ts
Auth:  None (public)
Client: Anon (createServerClient → RLS-enforced)
```

**Authentication ❌ (by design)**
- Public endpoint, same as above

**Authorization ✅**
- Looks up project by link_token, checks status (`selecting` or `submitted`)
- Relies on `project_images_select_public` RLS policy which restricts to projects in the right status with `deleted_at IS NULL`

**Data Exposure ✅**
- Returns only: `id`, `filename`, `preview_url` (signed URL, time-limited), `preview_expires_at`
- No storage paths, no internal IDs beyond image ID

**Caching ⚠️**
- No caching on the images endpoint, unlike the project endpoint

### 5.4 `POST /api/select/[token]/submit` — Selection Submission

```
File: src/app/api/select/[token]/submit/route.ts
Auth:  None (public — uses admin client)
Client: Admin (service_role) — bypasses RLS
```

**Authentication ❌ (by design)**
- No auth required — this is the client-facing submission endpoint
- Anyone with the link_token UUID can submit a selection

**Authorization ✅**
- Validates project exists via link_token
- Validates project status is `selecting` (returns 403 if closed)
- Validates `selected` is an array
- Validates selection count is within `[min_count, max_count]`
- Validates highlighted items are subset of selected items
- After submission, updates project status to `submitted`, preventing re-submission

**Race Condition ❌ Finding F-04**
- There is a TOCTOU (Time-of-Check Time-of-Use) vulnerability:
  1. Read project status (line 26–33)
  2. Insert selection (line 74–87)
  3. Update project status to `submitted` (line 93–96)
- If two concurrent requests pass step 1 while the project is still in `selecting` status, both will insert selections. The second status update will succeed but the first selection will be orphaned (though still in the DB).
- **Impact:** Duplicate submissions for the same project. The `submitted_at` timestamps would differ.
- **Fix:** Use `UPDATE ... SET status = 'submitted' WHERE status = 'selecting'` as an atomic check, or use a database advisory lock.

**Input Validation ⚠️**
- Validates `selected` is an array ✅
- Does **not** validate that the filenames in `selected`/`highlighted` correspond to actual project images ❌
  - Any string values are accepted, even if they don't match any image in the project
  - An attacker could submit garbage data
- JSON body parsed but not schema-validated (e.g., no Zod schema) ❌

**Error Handling ⚠️**
- If the status update fails (line 98–103), the error is logged but **not returned to the client** — the response still says "submitted successfully"
- This means the selection is persisted but the project remains in `selecting` status — the client sees success but the workflow is broken

---

## 6. Auth Flow Review

### 6.1 Signup (`features/auth/actions/signup.ts`)

**Input validation ✅**
- Uses Zod schema (`signupSchema`) to validate email, password, studioName
- Returns validation error to caller

**Auth user creation ✅**
- Uses `server.auth.signUp()` which creates the Supabase Auth user
- Handles the case where the user ID is missing

**Studio creation ❌ Finding F-01**
- Uses `server.from("studios").insert(...)` **with the anon-key client**
- **No RLS INSERT policy exists for the `studios` table** — this operation will always fail with a 403/PGRLS policy violation
- The 5-retry slug-generation loop will exhaust all attempts and return an error
- The auth user will be cleaned up, but the signup will never succeed

**Profile creation ❌ Finding F-01**
- Uses `server.from("profiles").insert(...)` **with the anon-key client**
- **No RLS INSERT policy exists for the `profiles` table** — same issue as studio creation
- Even if studio creation were fixed (e.g., by using admin client), profile creation would still fail

**Cleanup on failure ✅ (partial)**
- If studio creation fails: calls `cleanupAuthUser(userId)` (auth user deleted via admin client) ✅
- If profile creation fails: deletes the studio AND calls `cleanupAuthUser(userId)` ✅
- `cleanupAuthUser` is best-effort — if `SUPABASE_SERVICE_ROLE_KEY` is unset or the API call fails, the orphaned auth user remains. This is documented in the code.

**Root cause:** The signup function uses the anon-key client (`createServerClient()`) for operations that require either RLS INSERT policies or the service-role key. The fix is either:
  - Add `studios_insert` and `profiles_insert` RLS policies (complex due to auth-uid dependencies at signup time)
  - Use the admin client (`createAdminClient()`) for studio and profile creation (service_role bypasses RLS)

### 6.2 Session Management (`middleware.ts`)

**Public routes ✅**
- `/select/*` paths are allowed without authentication
- Static assets are excluded via matcher

**Protected routes ✅**
- `/dashboard/*` redirects to `/login` if no user session
- `/login` and `/signup` redirect to `/dashboard` if user is already authenticated

**Edge cases ✅**
- Gracefully handles missing Supabase environment variables (try/catch around auth call)
- No flash of unauthenticated content due to redirect at middleware level

**Missing ❌**
- No CSRF token validation for mutation endpoints
- No session refresh or expiry checks (delegated to Supabase SSR)
- No IP-based or rate-limit checks

### 6.3 Admin Client (`lib/supabase/admin.ts`)

**Design ✅**
- Singleton pattern (reuses the same client across requests)
- Uses `service_role` key with `autoRefreshToken: false` and `persistSession: false`
- Throws if env vars are missing

**Security ⚠️**
- The admin client is a singleton stored in a module-level variable. In development with hot reloading this is fine, but in production it means the service_role client is long-lived. This is acceptable behavior for Supabase JS v2.

---

## 7. Storage Review

### 7.1 Bucket Configuration

| Property | Value |
|----------|-------|
| Bucket name | `previews` |
| Upload client | Admin (service_role) — bypasses all storage RLS |
| Read path (public) | Anon key — relies on RLS `previews_select_studio` (not applicable since public users are unauthenticated) |
| Read path (client share) | Signed URLs stored in `project_images.preview_url` |

### 7.2 Path Structure

```
previews/{studioId}/{projectId}/{filename}
```

- `studioId` and `projectId` are UUIDs — deterministic, non-enumerable
- `filename` is user-controlled (from upload form) — **no sanitization applied** (Finding F-03)

### 7.3 Signed URLs

- Created with 30-day expiry (`SIGNED_URL_EXPIRY = 60 * 60 * 24 * 30`)
- Stored in the `project_images` table as `preview_url`
- Exposed to clients via the `/api/select/[token]/images` endpoint
- A signed URL can be shared beyond the intended recipient for up to 30 days

### 7.4 Path Traversal Risk (Finding F-03)

The `buildPreviewPath` function (`src/lib/utils/storage-paths.ts:6`) interpolates user-supplied filename directly:

```ts
return `${studioId}/${projectId}/${filename}`
```

If `filename` is `../../malicious-file.jpg`, the resulting path becomes:
```
{studioId}/{projectId}/../../malicious-file.jpg
```

Supabase Storage (backed by S3) normalizes paths and rejects relative-path components in many configurations, but this should not be relied upon. The filename should be sanitized to:
- Strip or reject any path separators (`/`, `\`)
- Strip or reject `..`
- Strip or reject null bytes
- Optionally generate a random filename while preserving the extension

---

## 8. Residual Risks

| Risk | Severity | Description | Recommendation |
|------|----------|-------------|----------------|
| RR-01 | **Medium** | Signed URLs have a 30-day TTL. If a preview URL leaks, it's usable for up to 30 days regardless of project status changes (e.g., even after a project is deleted). | Reduce signed URL TTL to a shorter window (e.g., 7 days) and implement a revocation mechanism. |
| RR-02 | **Low** | The `submit` endpoint accepts any filenames in the `selected` array — it does not verify they correspond to actual images in the project. | Validate that all entries in `selected` match `filename` values from `project_images` for the given project. |
| RR-03 | **Low** | The submit endpoint's status-update failure is silently ignored (logged but not returned). A submission could succeed (selection saved) but the project remains in `selecting` state. The client sees success but studio staff see no change. | Return 500 if the status update fails, and consider a compensating transaction. |
| RR-04 | **Low** | No CSRF protection on mutation endpoints (`upload`, `submit`). While this is mitigated by SameSite cookies and the absence of CORS credentials for programmatic requests, it's defense-in-depth. | Add CSRF tokens or check Origin/Referer headers for sensitive mutations. |
| RR-05 | **Info** | The `unstable_cache` used in the project info endpoint is an experimental Next.js API and may change behavior between versions. | Monitor Next.js changelog and migrate to a stable caching solution when available. |
| RR-06 | **Info** | Singletons (admin client) persist across requests in production. If the service role key is rotated, the in-memory client would hold the old key until the server restarts. | Acceptable for most deployments; document this behavior. |

---

## 9. Recommendations (Priority Order)

1. **CRITICAL — Fix signup RLS policies or use admin client:**
   - Either add `studios_insert` and `profiles_insert` RLS policies that allow authenticated users to insert, OR
   - Use the admin client (`createAdminClient()`) for studio and profile creation in the signup flow (bypasses RLS entirely). This is the simpler fix.

2. **HIGH — Add upload authorization checks:**
   - In `POST /api/upload`, verify that the authenticated user's profile belongs to the specified `studioId`.
   - Verify that `projectId` belongs to the specified `studioId`.
   - Query the profiles table to confirm the user is a member of the studio.

3. **HIGH — Sanitize filenames in upload:**
   - Strip all path separators (`/`, `\`), `..`, and null bytes from `file.name` before building the storage path.
   - Consider using a UUID-based filename while preserving the extension (e.g., `${uuid()}.${ext}`).

4. **MEDIUM — Fix TOCTOU race condition in submit:**
   - Use an atomic conditional update: `UPDATE projects SET status = 'submitted' WHERE id = ... AND status = 'selecting'` and check how many rows were affected.
   - Or use `SELECT ... FOR UPDATE` within a transaction to lock the project row.

5. **MEDIUM — Add rate limiting:**
   - Implement rate limiting on `/api/upload` and `/api/select/*/submit` to prevent abuse.
   - Use Supabase's built-in rate limiting or an edge middleware.

6. **LOW — Validate selected filenames against project images:**
   - In the submit endpoint, verify that all values in `selected` match `filename` values in `project_images` for the project.

7. **LOW — Add Zod schema validation to submit body:**
   - Parse and validate the JSON body against a Zod schema rather than ad-hoc checks.

8. **LOW — Return proper error for status-update failure:**
   - If `UPDATE projects SET status = 'submitted'` fails, return 500 to the client.

---

*End of audit. This report covers only the files listed in §2 and does not assess client-side code, infrastructure, or third-party dependencies.*
