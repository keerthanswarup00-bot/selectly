# Selectly Engineering Audit — Narration Script

**Duration:** ~14 minutes  
**Format:** Audio presentation script  
**Tone:** Technical but accessible for product/leadership audience

---

## INTRODUCTION (1:30)

Welcome to the Selectly engineering audit findings. This is a comprehensive review of the entire codebase — every file, every migration, every API route, every component. The audit was conducted on June 23rd, 2026, and covers authentication, database schema, security policies, the upload pipeline, client selection interface, TypeScript safety, error handling, performance, scalability, and deployment configuration.

The headline: Selectly has a solid architectural foundation. The choice of Next.js 15 with Supabase on the backend is correct for this use case. The multi-tenant data model with studio-level isolation is well-designed. The UI is clean. But — and this is a significant "but" — the codebase has critical security vulnerabilities, race conditions in core flows, zero test coverage, and several design anti-patterns that will cause real problems as soon as real customers start using the product.

The overall score is 4.7 out of 10. Let me walk you through why, and more importantly, what to do about it.

---

## SECTION 1: SECURITY — THE RED FLAG (3:00)

Let's start with the most critical issue, because this genuinely needs to be fixed before any customer touches the product.

The problem is in migration 002, which adds Row-Level Security policies for client selection access. The intent was correct: allow unauthenticated users — the photography client — to view images and submit their selections using a secret link token. The implementation, however, has a catastrophic flaw.

Policy number one: `selections_insert_public`. This policy allows anyone to insert data into the selections table, with absolutely no checks. The full policy reads: WITH CHECK true. That is a backdoor into your database. The Supabase anon key is public by nature — it's embedded in the frontend JavaScript. Anyone who opens the browser console can find it, connect directly to Supabase, and insert arbitrary selection data for any project. They can impersonate any client, flood the database with garbage, or corrupt client submissions.

Policy number two: `project_images_select_public`. This allows anyone to list all images for any project in selecting or submitted status — no authentication required. And policy number three: `projects_select_public` leaks all active project metadata, including client names and event dates.

The design assumed that the API route would gate access via the link token, but RLS operates at the database level, below the API route. The anon key bypasses your API entirely.

The fix is to either replace those policies with token-validating functions, or — and this is the safer approach — remove public RLS policies entirely and route all client access through service-role API routes that validate the link token server-side.

There's also the matter of the storage bucket policies. They're commented out in migration 001. If the bucket was created without default RLS enabled, every image is publicly readable.

---

## SECTION 2: DATABASE INTEGRITY (2:00)

Moving to database integrity. This is less dramatic but equally important for the product experience.

The `total_images` column on the projects table — the one that powers your dashboard stats cards — is never incremented. The upload service inserts rows into `project_images` but never updates the project counter. So every dashboard will show zero images for every project, forever. This is the kind of bug that looks like a working feature in development but immediately stands out as broken in production.

The selections table has no unique constraint on project_id. A client can submit selections twice, creating two rows for the same project. The API route checks for existing submissions, but there's a race condition window between the check and the insert that can create duplicates under concurrent requests.

Several foreign key relationships lack proper ON DELETE actions. The `created_by` column on projects references profiles but has no delete rule at all, so deleting a profile would leave dangling references. And the `deleted_at` soft-delete pattern is applied inconsistently — projects and project_images support it, but selections do not.

There are also missing composite indexes that will cause query degradation as data grows. The RLS policies filter on `deleted_at IS NULL`, but the indexes don't include that column, so every query does a full table scan on deleted rows.

---

## SECTION 3: UPLOAD PIPELINE (2:00)

The upload pipeline has fundamental reliability issues that will cause data loss under real usage.

The queue system in `use-upload-queue` has a race condition. Active upload count is tracked with a ref, and when an upload completes, it triggers a React re-render that can desynchronize the counter. If you upload fifty files and several complete around the same time, the queue can permanently stall with some uploads never starting.

There is no tab-close recovery. If a photographer starts uploading two hundred files after a wedding, and closes their laptop, every upload in flight is lost. The images that did make it to storage are orphaned — the database doesn't have records for them, and the project hangs in an inconsistent state.

There's no retry logic for failed uploads. A transient network error — which happens frequently with large files — causes permanent failure. The retry utility exists elsewhere in the codebase but was never wired into the upload queue.

And file validation runs only on the client side. Anyone who knows the Supabase URL can upload anything they want — malware, videos, a terabyte of garbage — directly to storage, bypassing your file type and size checks entirely.

---

## SECTION 4: CLIENT SELECTION UI (1:30)

The client selection page has three problems that will directly impact your customers.

First: no localStorage persistence. If a client is going through five hundred images, selecting their favorites, and accidentally refreshes the page — every single selection is gone. There is no user-facing warning, no auto-save, no draft. They start from zero. For a paying customer's client, this is a furious phone call to the photographer.

Second: no request timeout on any fetch call. If the server hangs — which it will, especially during cold starts on Vercel's serverless functions — the client sees an infinite loading spinner. There is no error state, no retry button, no timeout.

Third: the swipe handler has a stale closure bug. The submission ref is captured in a closure that doesn't update between renders, so rapid swiping can produce race conditions where selections are sent to the server in the wrong order or silently dropped.

The gallery also renders every image in a single flat grid with no virtualization. At five hundred images, this starts to cause layout thrashing. At a thousand, it may crash the browser tab entirely.

---

## SECTION 5: TESTING AND MONITORING (1:30)

This is going to be short because there's almost nothing to report.

There are zero tests in the entire codebase. Not one. No unit tests, no integration tests, no E2E tests. The RLS policy flaw, the race condition in the upload queue, the total_images bug — every single one of these would have been caught by a basic test suite written before the feature was deployed.

There is no error tracking. No Sentry, no Bugsnag. If an error happens in production, you'll only know about it if a customer calls you.

There is no performance monitoring. No insight into which API routes are slow, which database queries are degrading, which components are re-rendering too often.

The logger utility writes to console only. In the serverless environment on Vercel, console logs are visible but they're unstructured, have no correlation IDs, and can't be searched or alerted on.

---

## SECTION 6: SCALABILITY (1:30)

Scalability concerns fall into three categories: database, storage, and serverless functions.

On the database: There's no connection pooling configured for Vercel serverless. Each function invocation opens a new database connection. Supabase's Pro plan allows fifteen simultaneous connections, which sounds like a lot until you have ten photographers uploading at the same time and their serverless functions spawn multiple instances. Connection exhaustion will happen.

On storage: The bucket path uses studio ID and project ID without any timestamp prefix. While S3 handles billions of objects, listing objects within a single folder degrades over time. There's also no lifecycle policy for old project data.

On serverless functions: Vercel's default timeout is ten seconds. Uploading two hundred resized images can easily take thirty seconds or more. The function will time out, and the client will see an error after already waiting ten seconds. You need to either use Vercel's background functions for long-running tasks or chunk the uploads into smaller batches with client-side orchestration.

---

## SECTION 7: CODE QUALITY (1:30)

The TypeScript configuration is good — strict mode is enabled, and Zod validation schemas are well-written. But the execution is inconsistent.

There are multiple `any` types throughout the codebase, particularly in the upload hooks and the swipe handler. A `ts-ignore` comment suppresses a real type error in the dashboard header component. And there's a type cascade bug where calling a setter with null produces a `never` type that propagates through downstream consumers.

Error handling is patchy. Many async operations lack try-catch blocks. If `createImageBitmap` throws during image metadata extraction, the error bubbles up to React with no user-facing handler. There's no global error boundary.

The codebase mixes three data access patterns — server actions, direct Supabase client calls, and API routes — without clear separation of concerns. Business logic lives in components, hooks, and API handlers without a dedicated service layer.

The Phase 3 caching addition uses `unstable_cache` which is in-memory per serverless instance and won't be shared. It's a good start but not production-effective.

---

## SECTION 8: WHAT TO FIX FIRST (1:30)

The priority fix plan in the written report divides work into four tiers. Let me summarize the immediate actions.

Week one, before launch: Fix the RLS policies so that the anon key cannot be used to insert or read data. Add a database trigger or update the upload service to increment total_images. Set up error tracking with Sentry. Add localStorage persistence for client selections.

Week two to three, before scaling past ten studios: Add rate limiting to all API routes. Fix the race condition in the upload queue and add retry logic. Add request timeouts to all fetch calls in the client selection page. Replace standard image tags with next/image for lazy loading. Add a global error boundary and a toast notification system. Fix the TypeScript any types and the never cascade bug. Set up a CI pipeline with linting and type checking.

The medium-priority items — MFA, CSRF protection, database connection pooling, CDN configuration, virtualized image gallery, keyboard shortcuts — should be done before scaling past fifty studios. They're important but not blockers.

---

## CONCLUSION (0:30)

The overall score of 4.7 out of 10 might sound harsh, but it's important to understand what it means. The foundation is solid. The architectural decisions are correct. The UI is clean and well-designed. The problems are concentrated in specific areas — security policy design, testing, error handling, and operational readiness — that are typical gaps in early-stage projects.

The good news is that these are fixable problems. The bad news is that they need to be treated with urgency, because they represent real risk to the business. A security breach, data corruption, or a bad customer experience during launch would be difficult to recover from.

The full written report contains every finding, every code reference, and a detailed priority fix plan organized by effort and impact. Start with tier zero — the RLS policies and total_images bug — and work through the list methodically.

Thank you for your attention. The full written audit report is at `docs/ENGINEERING_AUDIT.md`.
