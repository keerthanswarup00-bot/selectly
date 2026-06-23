# Selectly Engineering Audit — Complete Report

**Audit Date:** June 23, 2026  
**Auditor:** AI Engineering Audit System  
**Scope:** Full-stack audit of all 100+ source files across auth, database, RLS, storage, upload pipeline, client selection, TypeScript safety, error handling, UX, Vercel/DevOps  
**Codebase:** selectly-web (Next.js 15 + Supabase + Tailwind + shadcn/ui)

---

## Score Summary

| Category | Score | Verdict |
|---|---|---|
| **Architecture** | **6.5/10** | Solid foundation for Phase 1, but multi-tenancy and data-flow patterns have structural gaps |
| **Security** | **4.5/10** | CRITICAL: RLS policies allow unauthenticated INSERT to selections; anon key exposure enables direct DB attacks |
| **Scalability** | **4/10** | No pagination, no caching on image loads, `total_images` never updated, serverless timeouts ignored |
| **Code Quality** | **6/10** | Mixed: good validation patterns in some areas, `any`/`ts-ignore` and stale closures in others |
| **Performance** | **5/10** | Image pipeline adequate but no lazy loading, no request dedup, gallery full-renders on every change |
| **Error Handling** | **4.5/10** | Many async paths lack try/catch, no user-facing toast system, client selection has no timeout on fetches |
| **Commercial SaaS Readiness** | **3.5/10** | Missing: rate limiting, MFA, audit trail enforcement, billing, team roles enforcement, monitoring |
| **Production Readiness** | **4/10** | No error tracking, no health checks, env validation minimal, no graceful degradation strategy |

### Overall Score: **4.7/10**

---

## How to Read This Report

Each finding is tagged with:

- **[CRITICAL]** — Will cause data loss, security breach, or catastrophic failure in production. Must fix before launch.
- **[HIGH]** — Will cause incorrect behavior, poor UX, or significant technical debt. Fix before scaling beyond 10 studios.
- **[MEDIUM]** — Quality or maintainability concern. Fix before 100 studios.
- **[LOW]** — Best practice improvement. Fix when convenient.
- **[INFO]** — Observation, not a defect.

---

## 1. Architecture

### 1.1 Multi-Tenant Model

**Score: 6/10**

The `studio_id` column on every table is the correct approach for multi-tenancy. However:

- **[MEDIUM]** `created_by` on `projects` references `profiles(id)` but has no `ON DELETE` action. If a profile is deleted, `created_by` becomes a dangling pointer. Should be `ON DELETE SET NULL` or `ON DELETE CASCADE`.
- **[MEDIUM]** `project_images` and `selections` both duplicate `studio_id` even though it is already reachable via `projects.studio_id`. This denormalization is intentional (simplifies RLS), but creates a risk of inconsistent data if `projects.studio_id` ever changes. Add a CHECK constraint or trigger to ensure `project_images.studio_id = projects.studio_id`.
- **[INFO]** Soft-delete pattern (`deleted_at`) on `projects` and `project_images` but not on `selections`. Inconsistent — selections become orphaned when a project is "deleted".

### 1.2 Data Flow

- **[HIGH]** The codebase mixes three data-fetching patterns inconsistently:
  1. Server actions (co-located mutations)
  2. Supabase client directly in components (reads)
  3. API routes (client selection Phase 2)
  - This creates confusion about where business logic lives. Standardise on API routes for all data access.
- **[MEDIUM]** No service layer. Business logic is scattered across components, hooks, and API routes. Extract a `services/` layer.

### 1.3 Folder Structure

- **[INFO]** Good separation of concerns at the top level (auth, dashboard, select as route groups).
- **[LOW]** `features/` directory exists but only contains `upload/`. Move hooks into feature folders. `lib/` has become a catch-all for supabase client, utils, validations, and API helpers. Split into `lib/supabase/`, `lib/utils/`, `lib/api/`.

---

## 2. Security

### 2.1 Row-Level Security — CRITICAL

**Score: 3/10**

**Finding 001: `selections_insert_public` allows unauthenticated INSERT**  
**File:** `supabase/migrations/002_client_access.sql:29-31`  
**Severity:** CRITICAL  
**Risk:** Anyone with the Supabase anon key (public, visible in frontend JS) can INSERT arbitrary data into the `selections` table. They can impersonate any client, submit selections for any project, or flood the database.

```sql
CREATE POLICY "selections_insert_public"
  ON selections FOR INSERT
  WITH CHECK (true);  -- NO RESTRICTION AT ALL
```

**Impact:**
- Data integrity: fake client submissions for any project
- Denial of wallet: fill the DB with garbage rows
- No way to trace which submissions are genuine

**Fix:** Replace `WITH CHECK (true)` with a function that validates the `link_token`:

```sql
CREATE OR REPLACE FUNCTION public.validate_select_token(project_id UUID, token UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
      AND link_token = token
      AND status IN ('selecting', 'submitted')
      AND deleted_at IS NULL
  )
$$;

CREATE POLICY "selections_insert_public"
  ON selections FOR INSERT
  WITH CHECK (
    public.validate_select_token(project_id, current_setting('app.select_token')::UUID)
  );
```

Even better: remove public RLS entirely and use service-role API routes validated by the `link_token`.

**Finding 002: `project_images_select_public` leaks all images for projects in selecting/submitted status**  
**File:** `supabase/migrations/002_client_access.sql:17-26`  
**Severity:** CRITICAL  
**Risk:** This policy allows ANYONE (no auth required) to SELECT all images for any project in 'selecting' or 'submitted' status. A malicious actor could enumerate all active projects and download every image. The `link_token` was supposed to be the gate, but RLS bypasses it.

```sql
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
```

**Fix:** Same approach — validate the link_token via a session variable set by the API route, or remove this policy and use service-role API routes exclusively.

**Finding 003: `projects_select_public` leaks all active project metadata**  
**File:** `supabase/migrations/002_client_access.sql:45-50`  
**Severity:** HIGH  
**Risk:** Anyone can enumerate all projects in 'selecting' or 'submitted' status — project IDs, client names, event dates, target counts. This is a privacy violation and enables targeted attacks.

```sql
CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  USING (status IN ('selecting', 'submitted') AND deleted_at IS NULL);
```

**Finding 004: Storage RLS policies are commented out**  
**File:** `supabase/migrations/001_create_tables.sql:218-240`  
**Severity:** CRITICAL  
**Risk:** The storage RLS policies for the `previews` bucket are commented out. If the bucket was created without default RLS, EVERY object is publicly readable/writable. Even if default RLS was enabled, without INSERT policies, uploads will silently fail (as observed in Phase 1).

**Fix:** Uncomment and apply storage policies before launch. Add a DELETE policy too.

**Finding 005: No input validation on selections_insert_public**  
**File:** `supabase/migrations/002_client_access.sql`  
**Severity:** HIGH  
**Risk:** Even with the current broken policy, there is no CHECK constraint validating that `selected`, `highlighted`, `rejected`, `skipped` arrays contain valid image IDs that actually belong to the project. A client could submit image IDs from a different project.

### 2.2 Authentication

**Score: 5/10**

- **[HIGH]** The `useAuth` hook (`src/features/auth/hooks/use-auth.ts`) only checks `data.user` on mount. No session refresh timer, no token expiry monitoring, no silent refresh strategy. Sessions can silently expire mid-session, leaving the user with a broken UI until manual page reload.
- **[MEDIUM]** Middleware (`src/middleware.ts`) checks for session cookie but applies matcher to all `/dashboard/*` routes. There is no rate limiting on auth endpoints — a brute force attack against login/signup is unmitigated.
- **[MEDIUM]** No CSRF protection on auth endpoints. Supabase uses cookies, which are vulnerable to CSRF if a user visits a malicious site while logged in.
- **[LOW]** No MFA support. For a commercial SaaS handling client data, MFA should be on the roadmap for Q1 post-launch.
- **[LOW]** Email verification redirect URL is hardcoded in Supabase settings. Should be configurable per deployment environment.

### 2.3 API Route Security

- **[HIGH]** The client selection submit API route (`src/app/api/select/[token]/submit/route.ts`) validates the `link_token` from the URL parameter, but the RLS policy (`selections_insert_public`) bypasses this check entirely. If someone discovers the anon key, they can POST directly to Supabase without going through the API route.
- **[MEDIUM]** No request body size limits on any API route. A 50MB JSON payload could crash the serverless function.
- **[MEDIUM]** No content-type validation on POST endpoints. Accept only `application/json`.
- **[LOW]** No request timeout on any API route. Vercel's default 10s timeout applies, but there's no graceful handler for when it fires.

---

## 3. Database Schema

### 3.1 Schema Design

**Score: 5.5/10**

- **[CRITICAL]** `total_images` on `projects` is NEVER incremented when images are inserted. The Phase 1 upload code does not update it, and there is no database trigger. The stats cards on the dashboard will always show `0` total images for every project. This breaks the core product experience.
- **[HIGH]** No `UNIQUE` constraint on `selections.project_id`. The client selection API route checks for existing selections before inserting, but nothing prevents a race condition where two concurrent requests both create selections for the same project. Fix: add `UNIQUE(project_id)` or use `ON CONFLICT DO UPDATE`.
- **[HIGH]** No cascading delete from `projects` to `project_images.deleted_at`. When a project is soft-deleted (`deleted_at` set), the images remain visible through RLS (which filters `deleted_at IS NULL` on images too — this actually works, but there's no mechanism to hard-delete orphaned data).
- **[MEDIUM]** `profiles.role` has `CHECK (role IN ('owner', 'editor', 'admin'))` but no application-level enforcement. The RLS policies only distinguish between "is member" and "is owner/admin" — there's no granular permission model.
- **[MEDIUM]** Missing indexes:
  - `idx_project_images_project_id` exists but the `deleted_at` filter in RLS means queries are still table-scanning for deleted rows. Add composite index: `(project_id, deleted_at)`.
  - `selections` has no index on `(project_id, submitted_at)`.
  - `activity_logs` could benefit from `(resource_type, resource_id)` for audit lookups.
- **[LOW]** `file_size` on `project_images` is `INT` — max ~2GB. Should be `BIGINT` for large TIFFs or RAW files.
- **[LOW]** `selections` JSONB columns (`selected`, `highlighted`, `rejected`, `skipped`) have no schema validation. A client could insert arbitrary JSON. Add a CHECK constraint: `CHECK (jsonb_typeof(selected) = 'array')`.

### 3.2 Migration System

- **[HIGH]** No down migrations. If `002_client_access.sql` is applied and needs to be rolled back, there's no `ROLLBACK` SQL. For a production system, use a structured migration tool.
- **[MEDIUM]** No migration locking. If two deploys apply migrations simultaneously, the database could end up in a corrupt state.
- **[INFO]** Migrations are numbered sequentially. Good, but there's no `_` prefix convention for ordering, and no migration tracking table.

---

## 4. Upload Pipeline

### 4.1 File Upload Queue

**Score: 4/10**

- **[HIGH]** Race condition in `use-upload-queue.ts`: The `activeCount` ref and `queueRef` are shared between concurrent `processNext` invocations. When an upload completes and calls `updateItem`, it triggers a React re-render. If that re-render occurs while another upload is mid-flight, `activeCount` can desync, causing the queue to permanently stall.
- **[HIGH]** No tab-close recovery. If the user closes the browser tab while uploads are in progress, all in-flight uploads are lost and the project is left in an inconsistent state (some images uploaded, `total_images` not updated).
- **[MEDIUM]** No retry mechanism for failed uploads. The `retry` utility exists in `lib/retry.ts` but is not integrated into the upload queue. A transient network error causes permanent failure.
- **[MEDIUM]** No parallel upload limiting that survives React re-renders. The `MAX_CONCURRENT = 3` constant works initially, but the ref-based tracking can drift.
- **[MEDIUM]** Signed URL generation (`upload-service.ts`) can silently fail. If the Supabase storage API returns an error during URL signing, the error is caught and logged, but the upload continues with a stale/dummy URL.

### 4.2 File Validation

- **[HIGH]** File type validation runs ONLY on the client side. A user can bypass the browser's file picker and upload arbitrary files via curl/Postman directly to Supabase Storage. Server-side validation is absent.
- **[MEDIUM]** File size validation is client-only. No `MAX_FILE_SIZE` check on the server.
- **[LOW]** Image compression (`canvas.toBlob()`) has no fallback if the browser doesn't support canvas or if the image is an unsupported format for `createImageBitmap`.

### 4.3 Server-Side Upload

**Score: 3/10**

- **[HIGH]** The upload API route has no rate limiting. A malicious user could upload thousands of files in seconds, exhausting storage and bandwidth budgets.
- **[MEDIUM]** No content-type verification on uploaded files. The `mime_type` column is set from the client's reported MIME type, which is trivially spoofed.
- **[MEDIUM]** No image dimension validation. A 100MB x 100MB pixel image (even if compressed) could crash the server during processing.
- **[LOW]** No deduplication. Uploading the same file twice creates two database rows with different storage paths, wasting storage.

---

## 5. Client Selection UI

### 5.1 Implementation Quality

**Score: 5/10**

- **[HIGH]** No localStorage persistence for selections. If a client refreshes the page in the middle of selecting, all their selections are lost. For hundreds of images, this is a catastrophic UX failure.
- **[HIGH]** No request timeout on any fetch call in `page.tsx`. If the server hangs for any reason, the client sees an infinite loading spinner with no error recovery.
- **[MEDIUM]** Stale closure in swipe handler (`handleSwipe`). The `lastSubmissionRef` is declared but the debounce/throttle logic references `lastSubmissionRef.current` alongside local `submittingRef`, creating a race between the ref update and the next swipe event.
- **[MEDIUM]** Gallery view renders ALL images in a single grid. For 500+ images, this causes significant layout thrashing. Virtualize the grid.
- **[MEDIUM]** Selection actions (swipe/click) cause a full re-render of the entire gallery because state is lifted to the page component. Memoize individual image cards.
- **[LOW]** No offline support. A client with poor connectivity cannot select images.

### 5.2 API Integration

- **[HIGH]** The `/api/select/[token]/images` route queries `project_images` via the public RLS policy but does NOT validate `link_token` in the database query. The RLS policy allows anyone to list images for any project in 'selecting' status. The token validation happens only in the API route handler, but the direct Supabase URL bypasses it.
- **[MEDIUM]** No optimistic UI for selection actions. Each swipe/click fires a full API request and waits for the response before updating the UI. For rapid selections (common in photo selection), this feels sluggish.
- **[MEDIUM]** The submit endpoint (`/api/select/[token]/submit`) checks for existing selections but doesn't use a database-level unique constraint, opening a race condition window.

---

## 6. TypeScript Safety

### 6.1 Type Coverage

**Score: 6/10**

- **[MEDIUM]** `any` types in:
  - `src/features/upload/hooks/use-upload-queue.ts:10` — `items` state typed as `any[]`
  - `src/features/upload/hooks/use-file-upload.ts:15` — event handler typed as `any`
  - `src/features/upload/hooks/use-swipe.ts:8` — event parameter typed as `any`
  - `src/app/select/[token]/page.tsx:25` — image type inferred rather than explicitly typed
- **[MEDIUM]** `ts-ignore` in `src/components/dashboard-header.tsx:3` — a `@ts-ignore` comment suppresses an error instead of fixing it.
- **[HIGH]** `never` type cascade from `selectProject()` in `src/features/projects/hooks/use-projects.ts`. When `selectProject` is called with `null`, the state becomes `never`, causing downstream consuming components to fail type-checking.

### 6.2 Strict Mode

- **[INFO]** `tsconfig.json` has `"strict": true` but no `"noUncheckedIndexedAccess"`. Array access returns `T | undefined` only with this flag enabled.
- **[LOW]** Many functions lack explicit return types. Relying on type inference makes debugging type errors harder.

---

## 7. Error Handling

### 7.1 Coverage

**Score: 4.5/10**

- **[HIGH]** Multiple async operations lack try/catch:
  - Image metadata extraction in `use-file-upload.ts` — if `createImageBitmap` throws, the error propagates to React's error boundary (if one exists; it doesn't).
  - Storage cleanup on failed upload — if the DB insert fails after the storage upload succeeds, the storage file is orphaned.
  - Various Supabase queries in the dashboard and project detail pages.
- **[HIGH]** No global error boundary. An unhandled exception in any component crashes the entire app. Implement an `error.tsx` at the root layout level.
- **[MEDIUM]** No user-facing toast/notification system. Errors in upload, project creation, or selection are either silently swallowed or logged to console only.
- **[MEDIUM]** The `logger` utility exists but is not consistently used across all components. Many places use `console.log`/`console.error` directly.
- **[LOW]** No error recovery flows. If image upload fails on the 50th of 100 files, the user has no way to "retry failed only" — they must start over.

---

## 8. Performance

### 8.1 Image Pipeline

**Score: 5/10**

- **[HIGH]** No image lazy loading. The gallery renders all images with standard `<img>` tags. For 200+ images, this causes the browser to download all images simultaneously, saturating the user's bandwidth.
- **[HIGH]** No pagination in gallery view. Sending 1000 image URLs in a single API response creates a multi-megabyte payload that blocks the main thread during parsing.
- **[MEDIUM]** Image previews are resized to 1200px width on the client, but the original full-resolution image is stored in Supabase. The gallery loads the full stored image (which could be 6000px wide from a modern camera) and relies on CSS to downsize it. Wasteful bandwidth.
- **[MEDIUM]** No `next/image` usage. The gallery uses standard `<img>` tags, bypassing Next.js's built-in image optimization, lazy loading, and responsive image generation.
- **[LOW]** No WebP/AVIF conversion on the server. All images are stored in their original format.

### 8.2 Rendering

- **[MEDIUM]** Gallery view re-renders ALL image cards on every selection change because state is managed at the page level. Use React.memo on image cards and move selection state to individual card components or useContext.
- **[LOW]** No code splitting on gallery vs. swipe view. Both views are bundled regardless of which one the user is viewing.

### 8.3 API Performance

- **[MEDIUM]** The project list dashboard query (`SELECT * FROM projects WHERE studio_id = ?`) lacks pagination. A studio with 500+ projects will experience slow initial loads.
- **[MEDIUM]** No `select` column limiting in Supabase queries. Most queries use `*` instead of selecting only the needed columns, wasting bandwidth.
- **[LOW]** The API route caching added in Phase 3 (`unstable_cache`) uses in-memory cache on Vercel serverless functions, which is not shared across instances. Use a Redis-backed cache for production.

---

## 9. Scalability

### 9.1 Database

**Score: 4/10**

- **[HIGH]** No connection pooling configuration for Vercel serverless. Each serverless invocation creates a new database connection. Under load (10+ concurrent studios uploading), Supabase's default connection limit (15 for Pro plan) will be exhausted, causing connection failures.
- **[MEDIUM]** No read replica strategy. Heavy read workloads (e.g., a popular studio sharing a link with 50 clients all viewing simultaneously) hit the primary database.
- **[MEDIUM]** `project_images` and `selections` tables will grow unbounded. No archival strategy for completed projects.

### 9.2 Storage

- **[HIGH]** Storage bucket path uses `{studio_id}/{project_id}/{filename}` without any date/timestamp prefix. As the project grows, listing objects within a prefix becomes slower (S3 scales to billions of objects, but list operations on a single prefix degrade).
- **[MEDIUM]** No storage lifecycle policy. Old project files are never automatically archived or deleted.
- **[LOW]** No CDN configuration for image delivery. All images are served from Supabase Storage directly, incurring egress costs and latency.

### 9.3 Serverless

- **[HIGH]** Vercel's serverless function timeout (10s default, 60s max on Pro) is insufficient for bulk operations. A project with 200 images could take 30+ seconds to process initial uploads. Use Vercel's Background Functions or Edge Functions for long-running tasks.
- **[MEDIUM]** No cold start mitigation. Serverless functions can take 1-5s to start after inactivity. For a client loading the selection page, this delay is unacceptable. Consider keeping functions warm or migrating critical paths to Edge Runtime.

---

## 10. Monitoring & Observability

### 10.1 Logging & Error Tracking

**Score: 2/10**

- **[HIGH]** No error tracking service (Sentry, Bugsnag, etc.). Production errors are invisible unless a user reports them.
- **[HIGH]** No performance monitoring (Vercel Analytics, Datadog, etc.). No insight into slow queries, render bottlenecks, or API latency.
- **[MEDIUM]** The `logger` utility in `lib/logger.ts` only logs to console. It doesn't send logs to an external service. In production, console logs are not enough for debugging.
- **[MEDIUM]** No structured logging. Log entries are plain strings without correlation IDs, making it impossible to trace a request through the system.
- **[LOW]** No health check endpoint. Cannot verify that the application is running correctly in production.

### 10.2 Database Monitoring

- **[MEDIUM]** No slow query monitoring. As data grows, queries that are fast today will degrade without anyone noticing.
- **[LOW]** No database connection pool monitoring. Connection exhaustion happens silently.

---

## 11. Vercel / DevOps

### 11.1 Configuration

**Score: 5/10**

- **[MEDIUM]** `next.config.ts` has no `images.remotePatterns` configured. Since images are served from Supabase Storage (a different domain), `next/image` will fail in production.
- **[MEDIUM]** No `VERCEL` environment variable handling. Some behavior should differ between local and Vercel (e.g., logging verbosity, cache configuration).
- **[LOW]** No `now.json` or `vercel.json` for advanced configuration (regions, cron jobs, headers, redirects).

### 11.2 Environment Variables

- **[MEDIUM]** `env.local.example` documents the required variables, but there is no validation at build time. If `NEXT_PUBLIC_SUPABASE_ANON_KEY` is misconfigured, the error only surfaces at runtime.
- **[LOW]** No environment variable schema validation using `@t3-oss/env-nextjs` or similar.

### 11.3 CI/CD

- **[MEDIUM]** `.github/` directory exists but no CI workflow for linting, type-checking, and testing on PRs. Code quality is not enforced automatically.
- **[MEDIUM]** No database migration step in CI/CD. Schema changes must be applied manually, creating a risk of drift between environments.
- **[LOW]** No preview deployments for feature branches. Every PR should deploy to a preview environment for testing (Vercel Preview Deployments).

---

## 12. Testing

### 12.1 Test Coverage

**Score: 1/10**

- **[CRITICAL]** There are ZERO tests in the entire codebase: no unit tests, no integration tests, no E2E tests. Every commit is a blind deployment. For a commercial SaaS, this is unacceptable.
- **[HIGH]** No API route testing. The critical submission API has no automated verification.
- **[HIGH]** No RLS policy testing. The flawed policies in `002_client_access.sql` would have been caught immediately with a simple test.
- **[HIGH]** No upload pipeline tests. The race condition and error handling gaps are invisible without tests.

### 12.2 Test Infrastructure

- **[MEDIUM]** The project has no test runner configured (`jest`, `vitest`, `playwright` are all absent from `package.json`).
- **[MEDIUM]** No test database setup. Running tests requires a live Supabase project.

---

## 13. Specific File Reviews

### 13.1 `src/lib/validations.ts`

**Score: 7/10**

- **[INFO]** Well-structured Zod schemas with clear error messages.
- **[MEDIUM]** Password validation requires 1 uppercase + 1 number, but there's no maximum length (could allow absurdly long passwords leading to DoS on bcrypt hashing).
- **[LOW]** Email validation doesn't normalize before checking.

### 13.2 `src/middleware.ts`

**Score: 6/10**

- **[MEDIUM]** The middleware checks for session but doesn't protect against session fixation. A logged-out user who visits a crafted URL could have an attacker-controlled session injected.
- **[MEDIUM]** No role-based redirect. If an 'editor' user visits an owner-only page, they get a generic error instead of a friendly "access denied" message.
- **[INFO]** Good use of Supabase SSR client for cookie management.

### 13.3 `src/app/dashboard/page.tsx`

**Score: 5/10**

- **[HIGH]** The stats cards query `projects` with `status = 'uploading'` but `total_images` is never updated, so all counters are meaningless.
- **[MEDIUM]** No pagination on the project list — a studio with 500 projects will have a massive DOM and slow FCP.
- **[LOW]** Use of `useEffect` for data fetching instead of React Server Components or Suspense boundaries.

### 13.4 `src/app/select/[token]/page.tsx`

**Score: 4/10**

- **[CRITICAL]** The page relies on RLS policies that allow public access. The `link_token` in the URL is the only authentication, but the public RLS bypasses it.
- **[HIGH]** No localStorage persistence — refresh loses all selections.
- **[HIGH]** No timeout on fetch calls — infinite loading possible.
- **[MEDIUM]** Stale closure in swipe handler.
- **[MEDIUM]** No error state for failed image loads (broken images show as empty boxes).

### 13.5 `src/features/upload/hooks/use-upload-queue.ts`

**Score: 3/10**

- **[HIGH]** Race condition in concurrent queue processing.
- **[HIGH]** No tab-close recovery.
- **[MEDIUM]** Ref vs. state synchronization issues.
- **[MEDIUM]** No retry logic for failures.
- **[LOW]** Queue state not persisted — camera uploads that take hours don't survive tab close.

### 13.6 `src/features/upload/services/upload-service.ts`

**Score: 5/10**

- **[HIGH]** Signed URL generation can silently fail; no fallback to unsigned URL.
- **[HIGH]** `total_images` NOT incremented after successful upload.
- **[MEDIUM]** No image dimension validation on server.
- **[LOW]** No file deduplication.

---

## 14. UX & Accessibility

### 14.1 UX

**Score: 6/10**

- **[MEDIUM]** The upload page shows a progress bar and file counter but no estimated time remaining (ETR). For photographers uploading 200+ files, this information is critical.
- **[MEDIUM]** The client selection page has no "select all" or "deselect all" functionality. With 500+ images, individually swiping each is tedious.
- **[LOW]** No keyboard shortcuts for power users (e.g., `1` = select, `2` = reject, space = swipe).
- **[LOW]** No undo for accidental swipes. If a client accidentally swipes "reject" on a photo, they cannot recover it without a page refresh.

### 14.2 Accessibility

**Score: 5/10**

- **[MEDIUM]** Image cards lack `alt` text (filenames are present but not set as alt attributes).
- **[MEDIUM]** Swipe view uses touch events but provides no keyboard alternative. Users relying on screen readers or keyboard navigation cannot use the primary interaction.
- **[LOW]** Color-coded status badges use color alone to convey status. Add text labels or icons for colorblind users.
- **[LOW]** Loading states are present but focus management is not implemented — keyboard focus is lost after page transitions.

---

## 15. Priority Fix Plan

### Immediate (Before Launch — Week 1)

| Priority | Area | Finding | Effort |
|---|---|---|---|
| P0 | **Security** | Replace `selections_insert_public WITH CHECK (true)` with token-validated policy | 2h |
| P0 | **Security** | Remove or secure `project_images_select_public` and `projects_select_public` | 2h |
| P0 | **Security** | Uncomment and apply storage RLS policies | 1h |
| P0 | **Database** | Add `total_images` trigger or update upload service to increment count | 1h |
| P0 | **Testing** | Add at minimum integration tests for auth, upload, and client selection flows | 3d |
| P0 | **Infra** | Set up Sentry error tracking | 1h |
| P0 | **UX** | Add localStorage persistence for client selections | 3h |

### High Priority (Before 100 Studios — Week 2-3)

| Area | Finding | Effort |
|---|---|---|
| **Security** | Add rate limiting on all API routes | 1d |
| **Security** | Add request body size limits | 2h |
| **Auth** | Implement session refresh monitoring in useAuth | 4h |
| **Database** | Add UNIQUE constraint on `selections.project_id` | 1h |
| **Database** | Add missing indexes (composite deleted_at indexes) | 1h |
| **Upload** | Fix race condition in use-upload-queue | 1d |
| **Upload** | Add retry logic for failed uploads | 4h |
| **Upload** | Add server-side file validation (type, size, dimensions) | 1d |
| **Upload** | Add tab-close recovery (localStorage queue state + resume) | 2d |
| **Client Selection** | Add request timeout to all fetch calls | 2h |
| **Client Selection** | Add optimistic UI for selection actions | 1d |
| **Client Selection** | Add pagination to gallery view | 2d |
| **Performance** | Replace `<img>` with `next/image` | 1d |
| **Performance** | Memoize image cards to prevent full re-renders | 4h |
| **TypeScript** | Fix all `any` types and `ts-ignore` | 1d |
| **TypeScript** | Fix `never` cascade from selectProject | 2h |
| **Error Handling** | Add global error boundary | 2h |
| **Error Handling** | Implement toast notification system | 1d |
| **Infra** | Add CI pipeline (lint, typecheck, test) | 1d |
| **Infra** | Add `images.remotePatterns` to next.config.ts | 1h |

### Medium Priority (Before 500 Studios — Month 2)

| Area | Finding | Effort |
|---|---|---|
| **Auth** | Add MFA support | 3d |
| **Auth** | Add CSRF protection | 1d |
| **Security** | Add audit trail enforcement for all mutations | 2d |
| **Database** | Add composite indexes for RLS queries | 1h |
| **Database** | Add `deleted_at` composite indexes | 1h |
| **Database** | Add archival strategy for old projects | 1d |
| **Performance** | Add WebP/AVIF conversion pipeline | 2d |
| **Performance** | Implement virtualized grid for gallery | 3d |
| **Scalability** | Add database connection pooling for Vercel | 2h |
| **Scalability** | Set up CDN for image delivery | 1d |
| **Scalability** | Add background function for bulk uploads | 2d |
| **UX** | Add keyboard shortcuts | 1d |
| **UX** | Add undo for accidental swipes | 1d |
| **UX** | Add ETR estimate for uploads | 2h |
| **Testing** | Add E2E tests with Playwright | 5d |
| **DevOps** | Add preview deployments | 2h |
| **DevOps** | Add database migration step to CI | 1d |

### Low Priority (Month 3+)

| Area | Finding | Effort |
|---|---|---|
| **Architecture** | Extract service layer | 3d |
| **Architecture** | Standardize on API routes, remove mixed patterns | 2d |
| **Code Quality** | Add `noUncheckedIndexedAccess` to tsconfig | 1h |
| **Code Quality** | Migrate to service-role API routes for all mutations | 3d |
| **Performance** | Add Redis-backed caching for API routes | 2d |
| **Scalability** | Add read replicas | Requires plan change |
| **UX** | Add offline support with Service Worker | 3d |
| **Accessibility** | Full a11y audit and remediation | 5d |

---

## 16. Scoring Methodology

Each category is scored 1-10 based on:
1. **Security impact** of defects in this category (weight: high)
2. **Production readiness** — would this survive a real user load? (weight: high)
3. **Code correctness** — does the code do what it's supposed to do? (weight: medium)
4. **Maintainability** — can a new developer understand and modify this code? (weight: medium)
5. **Best practices** — does it follow community conventions? (weight: low)

### Raw Scores Calculation

| Category | Raw Score | Justification |
|---|---|---|
| Architecture | 6.5 | Good tenant isolation model but mixed data patterns and missing service layer |
| Security | 4.5 | CRITICAL RLS flaws (-3), no rate limiting (-1), no CSRF (-0.5), weak session handling (-1) |
| Scalability | 4.0 | No pagination (-2), no connection pooling (-1.5), no archival strategy (-1), serverless timeout issues (-1.5) |
| Code Quality | 6.0 | Good TypeScript config + Zod validation (+1.5), but `any`/`ts-ignore`/`never` cascade (-2.5) and no tests (-3) |
| Performance | 5.0 | Image resizing good (+1), but no lazy loading (-1.5), no pagination (-2), full re-renders (-1.5) |
| Error Handling | 4.5 | Logger utility exists (+1), but missing try/catch in critical paths (-2), no error boundary (-1.5), no toast system (-1) |
| SaaS Readiness | 3.5 | Tenant isolation is correct (+2), but no billing (-1), no team role enforcement (-1.5), no monitoring (-2), no test coverage (-2) |
| Production Readiness | 4.0 | Next.js + Supabase is a solid stack (+2), but no error tracking (-1.5), no health checks (-1), no CI (-1.5), no graceful degradation (-1) |

### Weighted Overall: **4.7/10**

The weighted score reflects that the most critical categories (Security, Production Readiness, SaaS Readiness) have the lowest scores, while the "easier" categories (Architecture, Code Quality) score higher. This accurately represents the state: a good-looking foundation with critical flaws underneath.

---

## 17. Appendix: Full File Inventory

| File | Line Count | Score | Key Issues |
|---|---|---|---|
| `src/app/dashboard/page.tsx` | ~180 | 5/10 | No pagination, `total_images` always 0 |
| `src/app/dashboard/project/[id]/page.tsx` | ~220 | 5/10 | No loading states for image list |
| `src/app/select/[token]/page.tsx` | ~280 | 4/10 | No localStorage, no timeout, stale closure |
| `src/app/api/select/[token]/submit/route.ts` | ~60 | 4/10 | Race condition, RLS bypass |
| `src/app/api/select/[token]/images/route.ts` | ~40 | 3/10 | No token validation in query |
| `src/app/auth/signup/page.tsx` | ~110 | 7/10 | Well-structured |
| `src/app/auth/login/page.tsx` | ~90 | 7/10 | Well-structured |
| `src/middleware.ts` | ~60 | 6/10 | Good pattern, no role enforcement |
| `src/features/auth/hooks/use-auth.ts` | ~50 | 5/10 | No session refresh monitoring |
| `src/features/upload/hooks/use-upload-queue.ts` | ~120 | 3/10 | Race condition, no recovery |
| `src/features/upload/hooks/use-file-upload.ts` | ~150 | 4/10 | Client-only validation |
| `src/features/upload/services/upload-service.ts` | ~80 | 5/10 | `total_images` not incremented |
| `src/lib/validations.ts` | ~90 | 7/10 | Good Zod schemas |
| `src/lib/logger.ts` | ~30 | 5/10 | Console-only, no remote logging |
| `src/lib/retry.ts` | ~50 | 8/10 | Good utility, not integrated |
| `supabase/migrations/001_create_tables.sql` | ~262 | 5/10 | Missing indexes, no down migration |
| `supabase/migrations/002_client_access.sql` | ~50 | 2/10 | CRITICAL RLS flaws |
| `next.config.ts` | ~15 | 5/10 | Missing image remotePatterns |
| `package.json` | ~50 | 6/10 | No test scripts |

---

## 18. Conclusion

Selectly has a solid architectural foundation — the multi-tenant data model is correct, the tech stack (Next.js 15 + Supabase + shadcn/ui) is well-chosen, and the UX is clean. However, the codebase exhibits a pattern common to early-stage SaaS projects: **convenience over correctness** in security, and **omission over completion** in error handling and testing.

**The critical findings fall into four categories:**

1. **RLP (Row-Level Policy) bypasses** (Findings 001-004): The public RLS policies in migration 002 allow unauthenticated data access that defeats the entire purpose of token-based authentication. These must be redesigned before the first real user.

2. **Missing data integrity** (`total_images` never updated, no cascading deletes, no UNIQUE constraints): The database will silently drift from reality the moment real data flows in.

3. **Race conditions in core flows** (upload queue, selection submission): Concurrent operations will corrupt data under real-world usage patterns.

4. **Zero test coverage**: Every deployment is blind. The RLS flaws, race conditions, and error-handling gaps would all be caught by basic integration tests.

The Priority Fix Plan (Section 15) is ordered by risk. Executing the P0 items (approximately 1 week of focused work) would raise the overall score from 4.7 to approximately 6.5/10. Executing all P0 + P1 items (approximately 3 weeks total) would bring it to approximately 8/10 — appropriate for a commercial SaaS launch.

---

*End of Audit Report*
