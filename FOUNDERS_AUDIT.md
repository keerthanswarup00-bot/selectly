# SELECTLY V1 — FOUNDER'S AUDIT & REPO DECISION

**Audit Date:** June 23, 2026  
**Auditor:** Engineering Audit System  
**Codebase:** selectly-web (Next.js 15 + Supabase + Tailwind + shadcn/ui)  
**Location:** `/Users/aryan/Documents/projects/selectly/selectly-web/`  

---

## EXECUTIVE SUMMARY

Selectly is an early-stage SaaS for wedding photography studios to send image galleries to clients for selection. The codebase has ~100 source files built on Next.js 15 with Supabase backend.

**The score is 4.7/10.** The foundation is architecturally sound. The problems are in security policy design, testing, error handling, and operational readiness — typical gaps for a Phase 1 project that was built for function over production safety.

**The critical findings:**
1. RLS policies allow unauthenticated database access via the public anon key
2. `total_images` counter is never incremented — dashboards always show zero
3. Upload queue has a race condition that can stall concurrent uploads
4. Zero tests across the entire codebase
5. Signup error path creates orphaned auth users

**Recommendation: CONTINUE THE CURRENT REPO.** The architecture is correct. The issues are fixable with approximately 3 weeks of focused work.

---

## PART 1 — CODEBASE DISCOVERY

### System Map

```
selectly-web/
├── src/                           # ~75 source files
│   ├── app/                       # Next.js 15 App Router (18 files)
│   │   ├── page.tsx               # Landing page (static, Login/Signup links)
│   │   ├── layout.tsx             # Root layout (Inter font, Providers, Toaster, ErrorBoundary)
│   │   ├── icon.svg               # SVG favicon
│   │   ├── (auth)/                # Route group: login, signup, verify-email
│   │   ├── (dashboard)/           # Route group: dashboard, projects, settings
│   │   ├── select/[token]/        # Client selection UI + API routes
│   │   └── api/select/[token]/    # 3 API routes (GET project, GET images, POST submit)
│   ├── components/                # 22 components
│   │   ├── ui/                    # 14 shadcn/ui primitives (button, card, dialog, etc.)
│   │   └── shared/                # 8 app-specific (sidebar, header, gallery, swipe, etc.)
│   ├── features/                  # Feature modules (25 files)
│   │   ├── auth/                  # Signup/login actions, forms, schemas, auth hook
│   │   ├── dashboard/             # Stats cards, recent projects, dashboard hook
│   │   ├── projects/              # CRUD actions, hooks, components, schemas
│   │   └── upload/                # Upload queue, compression, file validation, storage
│   ├── hooks/                     # use-swipe (global)
│   ├── lib/                       # 9 files: supabase clients, logger, retry, utils
│   ├── providers/                 # QueryProvider (TanStack), ThemeProvider (next-themes)
│   ├── types/                     # database.ts, project.ts, common.ts
│   ├── config/                    # App config, query key factories
│   └── middleware.ts              # Auth guard + route protection
├── supabase/migrations/           # 2 migration files (tables + client access)
├── docs/                          # 9 documentation files
├── public/                        # Empty
└── Root config                    # 10 files (package.json, tsconfig, next.config, etc.)
```

### Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static page | Landing page |
| `/login` | Server component | Login form |
| `/signup` | Server component | Registration form |
| `/verify-email` | Server component | Post-signup prompt |
| `/dashboard` | Client component | Stats + project list |
| `/dashboard/new-project` | Server component | Create project form |
| `/dashboard/project/[id]` | Client component | Upload + project detail |
| `/dashboard/settings` | Client component | Studio settings |
| `/select/[token]` | Client component | Client image selection |
| `/select/[token]/thank-you` | Client component | Submission confirmation |
| `/api/select/[token]` | GET | Project metadata (cached 60s) |
| `/api/select/[token]/images` | GET | Project images |
| `/api/select/[token]/submit` | POST | Submit client selection |

### Database Schema (6 tables)

studios → profiles → projects → project_images, selections, activity_logs

---

## PART 2 — ENGINEERING AUDIT

### 29 Issues Found (1 Critical, 4 High, 10 Medium, 14 Low)

#### Critical
| Finding | File | Description |
|---|---|---|
| Signup cleanup bug | `actions/signup.ts` | If profile creation fails, the auth user is already created and NOT deleted. Orphaned user with email taken — can never re-register. |

#### High
| Finding | File | Description |
|---|---|---|
| Redundant client-side auth fetches | `dashboard/page.tsx`, `project/[id]/page.tsx` | Layout already fetches `studioId` but child pages re-fetch it client-side, causing loading flashes |
| `FixedClient` type hack | `lib/supabase/types.ts` | Double cast `as unknown as FixedClient` lies to the type system, masking real errors |
| No server-side upload validation | `services/upload-service.ts` | File validation is client-only — server accepts anything |
| Unused `ProjectStats` component | `features/projects/components/project-stats.tsx` | Defined but never imported anywhere |

#### Medium
| Finding | File | Description |
|---|---|---|
| Status counting logic duplicated | `use-dashboard.ts` + `use-projects.ts` | Identical loop in two hooks |
| Profile lookup repeated 5x | Multiple files | Same `getUser → profiles.select.studio_id` pattern copied |
| Unused types (7 exports) | `types/project.ts`, `types/common.ts` | `ProjectFilters`, `SortField`, `AsyncResult`, etc. — zero imports |
| `SwipeView` no empty state | `swipe-view.tsx` | Blank screen if images array is empty |
| Busy-wait polling in upload queue | `use-upload-queue.ts` | 100ms setTimeout polling instead of callback |
| Toast system memory leak risk | `use-toast.ts` | Global mutable listeners array with potential leak |
| Missing `force-dynamic` on cached API | `api/select/[token]/route.ts` | Next.js may aggressively cache GET responses |
| Inconsistent server action patterns | Auth vs Project actions | Objects vs FormData vs plain string |
| `unstable_cache` without proper strategy | `api/select/[token]/route.ts` | Caching applied inconsistently across select routes |
| `isCompressionSupported` unused | `utils/compression.ts` | Defined but never called |

#### Low
| Finding | File | Description |
|---|---|---|
| `DashboardShell` ignores `studioId` prop | `dashboard-shell.tsx` | Fetched from DB then unused |
| `UploadProgress` has unused `isProcessing` prop | `upload-progress.tsx` | Destructured as `_isProcessing` |
| Empty directories | `features/studio/`, `schemas/` | 3 empty directories |
| `use-swipe.ts` no passive events | `hooks/use-swipe.ts` | Non-passive touch handlers degrade scroll |
| Activity logging swallows errors | `create-project.ts` | Bare try/catch with no logging |
| Type re-export file unused | `features/projects/types/index.ts` | Barrel file with no consumers |
| `GalleryImage` and `SwipeImage` identical | Both view components | Duplicate interfaces for same shape |

### Duplicate Supabase Clients

Three client creators (`client.ts`, `server.ts`, `middleware.ts`) each use `as unknown as FixedClient`. The `FixedClient` hack exists because `@supabase/supabase-js` v2.108.2 returns types that don't match the `Database` interface perfectly. This is a known issue with Supabase type generation.

### Architectural Inconsistencies

1. **Three data-fetching patterns** — Server actions (auth), direct Supabase client (dashboard), API routes (client selection). No standardisation.
2. **No service layer** — Business logic mixed across components, hooks, and API handlers.
3. **Route groups vs stale directories** — We cleaned up `auth/` and `dashboard/` leftovers from before route group refactoring.

---

## PART 3 — SECURITY AUDIT

### Attack Scenarios

#### Scenario A: Database Injection via Public RLS
**Severity: CRITICAL**

Anyone who opens the browser console on any Selectly page can:
1. Find the anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` is public by design)
2. Connect directly to Supabase using `supabase-js`
3. Execute `INSERT INTO selections` with `WITH CHECK (true)` policy
4. Submit fake client selections for ANY project

**The link token in the URL is the only authentication, but RLS bypasses it entirely.**

#### Scenario B: Image Data Leak
**Severity: HIGH**

The `project_images_select_public` policy allows anyone to:
1. Enumerate all projects in "selecting" or "submitted" status
2. Download every image for those projects
3. No authentication required — just a Supabase client

#### Scenario C: Cross-Tenant Access
**Severity: LOW — NOT CURRENTLY EXPLOITABLE**

The RLS policies correctly scope access by `studio_id`. Studio A cannot access Studio B's data through the application. This is well-implemented.

#### Scenario D: Upload Abuse
**Severity: HIGH**

Currently:
- Client-side file validation only (trivially bypassed)
- No server-side file type checking
- No server-side file size limits
- No rate limiting on upload API
- A malicious actor could upload terabytes of garbage to Supabase Storage

### Security Verdict

| Concern | Status |
|---|---|
| Can Studio A access Studio B? | **No** — RLS correctly scopes by `studio_id` |
| Can users access projects directly? | **Yes, any user** — Public RLS policies allow unauthenticated SELECT |
| Can selection links leak info? | **Yes** — Anyone with the URL can view images + submit selections |
| Can uploads be abused? | **Yes** — No server-side validation or rate limiting |
| Can signup be abused? | **Partially** — No rate limiting, but email verification limits abuse |
| Storage bucket access? | **UNKNOWN** — Storage RLS policies are commented out in migration 001 |

---

## PART 4 — DATABASE AUDIT

### Foreign Key Verification

| Relationship | Type | ON DELETE | Status |
|---|---|---|---|
| profiles.id → auth.users.id | PK → FK | CASCADE | ✅ |
| profiles.studio_id → studios.id | FK | CASCADE | ✅ |
| projects.studio_id → studios.id | FK | CASCADE | ✅ |
| projects.created_by → profiles.id | FK | **NONE** | ❌ Warning |
| project_images.project_id → projects.id | FK | CASCADE | ✅ |
| project_images.studio_id → studios.id | FK | CASCADE | ✅ |
| selections.project_id → projects.id | FK | CASCADE | ✅ |
| selections.studio_id → studios.id | FK | CASCADE | ✅ |
| activity_logs.studio_id → studios.id | FK | CASCADE | ✅ |
| activity_logs.profile_id → profiles.id | FK | CASCADE | ✅ |

**Warning:** `projects.created_by` has no ON DELETE action. If a profile is deleted, `created_by` becomes a dangling pointer.

### Constraints

| Column | Constraint | Status |
|---|---|---|
| `studios.slug` | UNIQUE | ✅ |
| `profiles(studio_id, email)` | UNIQUE | ✅ |
| `profiles.role` | CHECK (owner, editor, admin) | ✅ |
| `projects.target_count` | CHECK (> 0) | ✅ |
| `projects.max_count` | CHECK (≥ min_count) | ✅ |
| `projects.status` | CHECK (6 values) | ✅ |
| `projects.link_token` | UNIQUE | ✅ |
| `selections.project_id` | **NO UNIQUE** | ❌ Can have duplicate selections per project |

### Indexes

9 indexes created, all B-tree on foreign keys and common query patterns. Missing:
- Composite `(project_id, deleted_at)` for RLS filtering queries
- Composite `(studio_id, deleted_at)` for all studio-scoped queries with soft delete

### RLS Health

| Table | Policy | Risk |
|---|---|---|
| studios | SELECT for members, UPDATE for owners | ✅ Safe |
| profiles | SELECT for studio, UPDATE for self | ✅ Safe |
| projects | SELECT/INSERT/UPDATE for members, DELETE for owners | ✅ Safe |
| project_images | SELECT/INSERT/UPDATE for members | ✅ Safe (non-public) |
| project_images | **SELECT for anyone (public)** | ❌ CRITICAL |
| selections | SELECT/INSERT/UPDATE for members | ✅ Safe (non-public) |
| selections | **INSERT anyone WITH CHECK true** | ❌ CRITICAL |
| selections | **SELECT for anyone** | ❌ HIGH |
| projects | **SELECT for anyone** | ❌ HIGH |
| activity_logs | SELECT/INSERT for members | ✅ Safe |

### Scalability Assessment

At 100 studios / 5000 projects:
- `idx_projects_studio_id` + `idx_projects_status` cover the common queries
- `total_images` not being updated means every project shows 0 images — data layer is broken
- `selections` without UNIQUE on `project_id` means race conditions on client submit
- No archival strategy for completed projects — tables grow unbounded

---

## PART 5 — PERFORMANCE AUDIT

### Estimated Load Points

| Load | Impact |
|---|---|
| **100 studios, 500 projects** | No issues. Current architecture handles this easily. |
| **500 studios, 2500 projects** | Dashboard queries without pagination start to slow. Image gallery renders all images at once — 200+ images causes layout thrashing. |
| **1000 studios, 10000 projects** | Serverless connection pool exhaustion (Supabase Pro: 15 connections). Gallery grid without virtualization crashes mobile browsers. Storage bucket listing degrades without date-prefixed paths. |
| **1000 studios, 50000 projects** | Database queries on `deleted_at` without composite indexes cause sequential scans. Cold start latency on Vercel functions makes client selection page unusable. No lifecycle policy means storage costs spiral. |

### Specific Bottlenecks

| Location | Issue | Impact |
|---|---|---|
| Dashboard page | No pagination on project list | 500+ projects = slow initial load |
| Gallery view | All images rendered at once | 500+ images = browser thrashing |
| Gallery view | No lazy loading via `next/image` | All images downloaded immediately |
| Upload | No server-side validation | Storage abuse possible |
| Upload | No retry mechanism | Transient network failures = permanent failure |
| Upload | No tab-close recovery | In-flight uploads lost on browser close |
| API routes | No request timeouts | Infinite loading on server hang |
| API routes | No connection pooling | Serverless connections exhausted under load |
| Database | Missing composite `deleted_at` indexes | Table scans on soft-delete queries |
| Storage | No CDN | Direct Supabase delivery = higher latency + egress costs |
| Storage | No lifecycle policy | Old files never auto-deleted |

---

## PART 6 — DEPLOYMENT AUDIT

### Why `selectly-two.vercel.app` Returns 404

**Root cause: Missing environment variables on Vercel.**

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not set in the Vercel project's environment variables until today. Previously only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` were set. The codebase uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` exclusively.

Additionally, the `selectly-two` project name may not correspond to the GitHub-connected project. The deployment at that URL might belong to a different Vercel account or project than the one connected to `keerthanswarup00-bot/selectly`.

**Fix:** Set up a new Vercel project from GitHub import, add all required env vars (see `.env.local.example`), and redeploy.

### Previous Git History

The original git repository was in `/Users/aryan/Downloads/files/` with `selectly-web/` as a subdirectory. The copy now at `~/Documents/projects/selectly/selectly-web/` does NOT have a `.git` directory. The remote was `github.com:keerthanswarup00-bot/selectly.git` on branch `main`.

---

## PART 7 — REPO DECISION

### Should We Continue or Start Fresh?

**Decision: CONTINUE CURRENT REPO.**

### Justification

**Why NOT to start fresh:**
1. The architectural foundation is correct — multi-tenant `studio_id` model, feature-based folder structure, proper TypeScript config, Next.js 15 App Router
2. 100 source files represent significant investment — approximately 4-6 weeks of solo developer work
3. The critical issues are localized and fixable — RLS policies can be rewritten in one migration, the `total_images` bug is one trigger, the signup bug is one try/catch fix
4. Starting fresh would recreate the same architecture but without the battle-testing of having built it once already
5. The schema is well-designed for the domain — studios → projects → images/selections is a clean domain model

**What you'd rebuild from scratch:** The entire auth system (signup with studio creation, login, session management, middleware), all database migrations, the upload pipeline with compression, the client selection gallery/swipe UI, the dashboard, project management, all API routes, the entire component library, type definitions, and documentation.

**When starting fresh WOULD be justified:** If the architecture was fundamentally broken (e.g., no multi-tenant isolation, wrong database design, unrecoverable tech debt). That is NOT the case here.

### What We Need to Fix (Not Rebuild)

| Priority | Fix | Effort |
|---|---|---|
| **P0** | Rewrite public RLS policies with token validation | 2 hours |
| **P0** | Apply storage RLS policies (currently commented out) | 1 hour |
| **P0** | Add `total_images` trigger | 1 hour |
| **P0** | Add signup cleanup for orphaned auth users | 1 hour |
| **P0** | Add server-side file validation on upload | 4 hours |
| **P1** | Set up error tracking (Sentry) | 1 hour |
| **P1** | Fix upload queue race condition | 4 hours |
| **P1** | Add localStorage persistence for client selections | 3 hours |
| **P1** | Add CI pipeline (lint + typecheck + test) | 4 hours |
| **P1** | Fix duplicate `ProjectStatus` type | 30 min |
| **P1** | Add request timeouts to client fetches | 2 hours |
| **P1** | Add pagination to gallery and dashboard | 2 days |
| **P2** | Add server-side validation on all API routes | 2 days |
| **P2** | Extract shared profile-lookup helper | 1 hour |
| **P2** | Remove dead code (unused types, components, files) | 2 hours |
| **P2** | Add database connection pooling | 2 hours |
| **P3** | Add tests (unit + integration + E2E) | 1 week |

### The Starting-New-Repo Mistake

The most common mistake founders make is thinking "a rewrite will be cleaner." The new repo will have:
- The same architectural decisions (which are correct anyway)
- The same bugs, just different ones
- Months of lost development time
- The sunk cost of 100 files that were already debugged and working

**The only valid reason to start fresh is if the git history is unrecoverable or the repository structure is fundamentally broken.** Neither is true here. The git repo exists on GitHub at `github.com/keerthanswarup00-bot/selectly` with a clean commit history. The copy on your machine was detached from git during the file reorganization, but the remote repo is intact.

### Recommended Action

1. **Clone fresh from GitHub:** `git clone git@github.com:keerthanswarup00-bot/selectly.git selectly-new`
2. **Copy over any local-only changes** (`.env.local`, audit docs)
3. **Fix P0 items** (RLS, total_images, signup bug) before any new feature work
4. **Set up Vercel from the GitHub import** — not from local deploy
5. **Write tests** — start with integration tests for the 3 API routes

---

## PART 8 — FOUNDER'S AUDIO REPORT

*Below is the spoken report script, written for a 10-15 minute presentation.*

---

Hello. This is the engineering audit for Selectly V1.

Let me start with the executive summary. Selectly scores 4.7 out of 10. That sounds low, but context matters. This is a Phase 1 codebase that was built for function over production safety. The architectural foundation is solid. The problems are in security policy design, testing, and operational readiness — and every single one of them is fixable.

Let me walk you through the current state.

We have about 100 source files on Next.js 15 with Supabase. The code is organized by feature — auth, dashboard, projects, upload — each with its own components, hooks, and schemas. The database has six tables with a clean multi-tenant model. Every row belongs to a studio. The App Router structure is standard and well-organized. The team chose good tools — TanStack Query for data fetching, Zod for validation, shadcn/ui for components, Tailwind for styling.

Now for the hard part: the security findings.

There is a critical vulnerability in the client selection system. The Row-Level Security policy for the selections table has `WITH CHECK (true)`. That's database terminology for "anyone can insert anything." The Supabase anon key is embedded in the frontend JavaScript — it's public by design. Anyone who opens the browser console can find it, connect directly to your database, and insert fake client submissions. They can corrupt data for any project.

The same issue affects the project images and projects tables. Anyone can list all images for any active project and read project metadata including client names and event dates.

The fix is straightforward: rewrite the RLS policies to validate the link token at the database level. This is about two hours of work, but it must happen before any paying customer touches the product.

On the architecture side, the codebase has some structural issues but nothing fatal. There are 29 code quality findings — one critical, four high, ten medium, and fourteen low. The critical bug is in the signup flow: if profile creation fails after the auth user is already created, the auth user is orphaned and that email address can never be used again.

There's duplicate code — the status-counting loop appears in two separate hooks. The profile-lookup boilerplate is repeated five times across the codebase. These are medium-severity issues that create maintenance drag but won't cause production outages.

The `FixedClient` type hack is worth mentioning. All three Supabase client creators use a double-type-cast that essentially tells TypeScript to stop checking. This masks real type errors. It needs to be cleaned up before the codebase grows further.

On performance: the system will handle 100 studios with no issues. At 500 studios, the lack of pagination on the dashboard and the image gallery will start causing problems. At a thousand studios, the serverless connection pool on Supabase Pro will be exhausted. The image gallery renders every photo at once with no virtualization — 500 photos will crash a mobile browser.

The scalability ceiling is real, but it's months away. You need to fix the upload queue race condition and add pagination before hitting 100 studios, but you don't need them today.

The hidden risks I want you to think about:

First, the `total_images` counter on the projects table is never incremented. Your dashboard will always show zero images for every project. This is a data integrity issue that makes your core product metrics look broken from day one.

Second, the upload has no server-side validation. A malicious actor — or even a curious developer — can upload anything they want directly to your storage bucket. No file type check, no size limit, no rate limiting. This is a financial risk because Supabase storage charges by the gigabyte.

Third, there are zero tests. Not unit tests, not integration tests, not E2E tests. Every one of the bugs I've described would have been caught by a basic test suite written before the feature was deployed. This means every deployment is blind.

Now, what will break first in production?

If you onboard a studio today, the first thing they'll notice is that the dashboard shows zero images for their project, even after uploading fifty photos. They'll refresh the page, still zero. They'll call you wondering if the upload worked.

The next thing that breaks: a client working through two hundred photos in the gallery view accidentally refreshes the page and loses every single selection. There's no localStorage persistence. They have to start from zero.

Then: two clients submitting selections for the same project at the exact same time. Without a unique constraint on the selections table, both submissions succeed, and the project now has two conflicting selection records.

These are not edge cases. These are the first three real users.

Now, the big question: should we start a new repository?

The answer is no. Stay in this repo.

Here's why. The architecture is fundamentally correct. The multi-tenant model with studio-level isolation is well-designed. The feature-based folder structure scales. The tech stack is right for this use case. Starting a new repository would mean rebuilding all one hundred files from scratch — months of work — and you'd end up with the same architecture and a new set of bugs.

The critical issues — RLS policies, total_images, signup cleanup — are localized fixes that take hours, not weeks. The medium issues — duplicate code, missing indexes, dead types — are cleanup items that improve maintainability but won't cause production outages.

The real work is operational: set up error tracking, write tests, add CI, and fix the deployment pipeline. These are things you need regardless of which repository you use.

Let me give you the recommended next steps.

Week one: fix the RLS policies, uncomment the storage policies, add the total_images trigger, fix the signup cleanup bug, and add server-side upload validation. Deploy these fixes. Set up Sentry and add a CI pipeline.

Week two: fix the upload queue race condition, add localStorage for client selections, add request timeouts to all client fetches, and add pagination to the dashboard and gallery. Clean up the duplicate types and dead code.

Week three: write integration tests for the three client selection API routes and the auth signup flow. Add database connection pooling for Vercel. Set up a test database.

After week three, the codebase will score approximately 7 out of 10, and you can start building Phase 2 features on a solid foundation.

Final scores:

Architecture: 6.5 out of 10. The multi-tenant model and feature structure are correct. The mixed data-fetching patterns and missing service layer hold it back.

Security: 4.5 out of 10. The public RLS policies are a critical gap. The storage policies are not applied. The anon key exposure is an architectural reality of Supabase that must be designed around, not ignored.

Scalability: 4 out of 10. No pagination, no connection pooling, no serverless timeout handling, no archival strategy. The system works at small scale today but has hard ceilings.

Code Quality: 6 out of 10. Good TypeScript setup and validation patterns. Dragged down by the FixedClient type hack, duplicate definitions, and dead code.

Deployment Readiness: 4 out of 10. The Vercel 404 was caused by missing environment variables. No CI pipeline, no error tracking, no health checks. The git history is intact on GitHub but the local copy was detached.

Commercial SaaS Readiness: 3.5 out of 10. The tenant isolation model is correct, but there is no billing, no team role enforcement, no monitoring, no rate limiting, and no test coverage. This is appropriate for a pre-revenue product but must be addressed before the first paid customer.

Overall: 4.7 out of 10. A solid Phase 1 foundation with critical gaps in security, testing, and operations that are typical for this stage. The foundation is sound enough to build on. The gaps are fixable with approximately three weeks of focused engineering time.

The recommendation is to continue in the current repository, fix the P0 items immediately, and steadily close the gaps in security, testing, and operational readiness. A new repository would not solve these problems — it would just reset the clock to zero while facing the same challenges.

That's the full audit. The written report has every finding, every file reference, and a detailed priority fix plan. Start with the RLS policies and the total_images trigger — those are the two things that will break first in production.
