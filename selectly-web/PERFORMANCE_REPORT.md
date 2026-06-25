# Performance Report — Selectly Web

## 1. Executive Summary

Selectly Web is a Next.js 15 application with client-side image upload, selection workflows, and Supabase-backed storage. Overall, the codebase demonstrates solid performance awareness but has several gaps in bundle optimization, render efficiency, and data fetching patterns. The application would benefit from server component migration, code splitting, query pagination, and better state management granularity.

**Overall Score: 6.5 / 10**

---

## 2. Bundle Size Analysis

### Dependencies

`package.json` includes several large packages:

- **`@supabase/supabase-js`** (~30KB gzip) — pulled into all client bundles via `createClient()` in multiple hooks.
- **`lucide-react`** — tree-shakable, but unused icon imports are a risk. The `SelectPage` component imports `Eye`, `Grid3X3`, `ArrowLeft`, `Loader2`, `AlertCircle`; many pages import individual icons.
- **`@tanstack/react-query`** (~12KB gzip) — used in all data-fetching hooks.
- **`react-hook-form` + `zod`** — bundled into any page that renders a form.
- **`date-fns`** — included but no tree-shaking config beyond default Next.js.
- **`next-themes`** — small but loaded in the root layout.
- **7 `@radix-ui/*` packages** — individually small, but collectively add weight.

### Client vs Server Components

- The root `layout.tsx` is a **server component** — good.
- However, `layout.tsx` wraps children in `<QueryProvider>` which is `"use client"`, forcing the entire tree below it into client-side JS.
- `select/[token]/page.tsx` is entirely `"use client"` — a missed opportunity to fetch initial data on the server and pass it as props.
- `dashboard-shell.tsx` is `"use client"` for a simple sidebar toggle.
- No `loading.tsx` or `<Suspense>` boundaries exist at the route group level.

### Code Splitting

- **No `next/dynamic` usage** found. Large components like `SwipeView` are always loaded, even when only gallery mode is active. In `select/[token]/page.tsx:277-310`, both views are imported statically and only toggled via conditional rendering; the unused view's JS is still bundled.
- The `lucide-react` imports add icon SVG definitions to every page that imports them. Some pages import icons they may not use based on view/state.

**Recommendations:**
- Use `next/dynamic` with `ssr: false` for `SwipeView` to defer its ~2KB JS until the user switches to swipe mode.
- Convert `select/[token]/page.tsx` to a server component that fetches project + image data and passes it to a client "shell" component.
- Add `@next/bundle-analyzer` to identify large modules.
- Consider using `lucide-react` dynamic imports per icon or switch to `@icons-pack/react-simple-icons` if bundle size is critical.

---

## 3. Image Optimization

### Client-Side Compression (`src/features/upload/utils/compression.ts`)

Client-side compression before upload is excellent:

- Uses `createImageBitmap` + `OffscreenCanvas` to resize to `config.upload.previewWidth` (1200px) and re-encode as JPEG at quality 0.8.
- Falls back gracefully if `OffscreenCanvas` is unavailable.
- Saves significant bandwidth by avoiding full-resolution uploads.

### Next/Image Usage

- **`GalleryView`** (`src/components/shared/gallery-view.tsx:54-60`): Uses `<Image>` with `fill`, `object-cover`, and proper `sizes="(max-width: 768px) 50vw, 25vw"`. However, **no `loading="lazy"` attribute** — images load eagerly.
- **`ImageGrid`** (`src/components/shared/image-grid.tsx:71-84`): Uses `<Image>` with `fill`, `loading="lazy"`, `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"`, and an `onLoad` callback to animate opacity. This is the better implementation.
- **`SwipeView`** (`src/components/shared/swipe-view.tsx:61-68`): Uses `<Image>` with `fill`, `object-contain`, `sizes="100vw"`, and **`priority`** (correct for a fullscreen viewer).

### Missing Optimizations

- **No blur placeholder**: No `placeholder="blur"` or `blurDataURL` on any image. Users see a white gap or layout shift before images load. `ImageGrid` mitigates this with an `animate-pulse` skeleton on `loaded` state, but `GalleryView` and `SwipeView` do not.
- **Supabase signed URLs**: `preview_url` is a signed URL from Supabase Storage with 30-day expiry. These are not cacheable by CDN or browser beyond the expiry.
- **preview_expires_at**: Stored but never checked or refreshed by the client; images may 401 in long sessions.

**Recommendations:**
- Add `loading="lazy"` to `GalleryView` images.
- Generate and pass `blurDataURL` (e.g., a 20px-wide placeholder) during upload or via a server action.
- Add a client-side check for signed URL expiry and refresh before it expires.
- Consider Supabase Image Transformation (`?width=...&quality=...`) to serve different sizes per viewport.

---

## 4. Database Query Optimization

### Caching

- **`unstable_cache`** in `src/app/api/select/[token]/route.ts:29-33` caches project data for 60 seconds with tag `"project"`. Good use of Next.js cache API.
- **`retryableRequest`** wraps the cached fetch with exponential backoff.
- The corresponding `/images` route (`src/app/api/select/[token]/images/route.ts`) does **not** use `unstable_cache` — every client init triggers a fresh database query for all project images.

### N+1 Query Risk

- No obvious N+1 patterns. The select API makes one query for the project, then one for the studio name — that's two sequential queries but acceptable.
- `useProjects` (`src/features/projects/hooks/use-projects.ts:13-18`) and `useProjectStats` both make separate queries, but they hit different endpoints and are independent.

### Query Efficiency

- **`useProjects`** does `select("*")` — pulls all columns including `updated_at`, `created_at`, etc. For a list view this is wasteful.
- **`useDashboardStats`** selects specific columns (`id, client_name, status, total_images, created_at`) — good.
- **`useProjectStats`** selects only `status` — efficient.
- Image list queries (`/images` route) return **all images without pagination**. As a project grows to 500+ images, this single response will grow unbounded.

### React Query Configuration

`QueryProvider` (`src/providers/query-provider.tsx`) sets:
- `staleTime: 30_000` — good balance.
- `retry: 1` — prevents excessive retries.
- `refetchOnWindowFocus: false` — sensible.

Config (`src/config/index.ts:36-43`) defines per-domain stale times:
- `imageList: 120_000` — images rarely change during selection.
- `studioSettings: 300_000` — appropriate.

**Recommendations:**
- Add pagination to the images API route (page/offset params) to cap response size.
- Add `unstable_cache` to the `/images` route with a tag like `"project-images"` and revalidate on image upload/submit.
- Replace `select("*")` in `useProjects` with explicit column selection.
- Invalidate query tags on relevant mutations (e.g., after upload completes).

---

## 5. Re-Render Analysis

### Memoization

- **`ImageGrid`** (`src/components/shared/image-grid.tsx:26-163`): `GridImageItem` is wrapped in `memo`. However, the callbacks (`onToggleSelect`, `onToggleHighlight`, etc.) are **recreated every render** in the parent (`select/[token]/page.tsx`), breaking the memoization — `memo` performs a reference equality check, so every parent render will cause every item to re-render.
- **`useCallback` usage**: `useUploadQueue` properly wraps all its functions (`addFiles`, `updateItem`, `processItem`, `processQueue`, etc.) in `useCallback`.
- **`useMemo` usage**: In `SelectPage`, `skipped` and `canSubmit` are wrapped in `useMemo` — correct.

### State Granularity

- `SelectPage` (`src/app/select/[token]/page.tsx`) stores `selected`, `highlighted`, and `rejected` as three separate `useState<Set<string>>` instances. The toggle functions (`toggleSelect`, `toggleReject`, `toggleHighlight`) each iterate through all three sets. They are **not wrapped in `useCallback`**, so they are new function objects every render.
- The `selected` state update correctly uses functional updates (`setSelected(prev => ...)`), avoiding stale closure issues.

### Re-Render Triggers

- Every state change in `SelectPage` re-renders the entire page, including the entire `ImageGrid` (which undergoes reconciliation of all items).
- The `totalProgress` computation in `useUploadQueue` (`use-upload-queue.ts:109-111`) recalculates on every render but is not inside `useMemo`.

**Recommendations:**
- Wrap `toggleSelect`, `toggleReject`, `toggleHighlight` in `useCallback` so child components' `memo` actually works.
- Consider `useReducer` for the three selection sets to reduce to a single state update.
- Alternatively, use React Query mutations for selection state to derive state on the server.
- Move the `totalProgress` computation inside `useMemo`.

---

## 6. Network Request Optimization

### Upload Pipeline

`src/features/upload/hooks/use-upload-queue.ts` has a well-designed concurrent upload queue:

- Concurrency limited to `config.upload.concurrency` (default 5) via a ref-based slot system.
- Each item goes through: compression → upload with retry (max 3 attempts, exponential backoff).
- The `processQueue` loop uses a polling pattern (`await new Promise(r => setTimeout(r, 100))`) to check for available slots — slightly wasteful. A promise-based semaphore would be cleaner.

### API Calls

- `select/[token]/page.tsx` fetches project data and images using raw `fetch` inside `useEffect`, **not** React Query. This means:
  - No cache sharing across renders.
  - No retry on failure (network errors cause a permanent error state).
  - No deduplication if the component remounts.
- The `/api/upload/route.ts` validates files server-side (redundant after client validation) and creates a signed URL for each uploaded image — necessary but adds latency.

### Retry Logic

`src/lib/retry.ts` provides a generic `retryableRequest` with exponential backoff (base 1s, double per attempt, max 3). It's used in select API routes but **not** in client hooks.

**Recommendations:**
- Replace the raw `fetch` + `useEffect` in `SelectPage` with `@tanstack/react-query` `useQuery` calls (the Supabase client hooks pattern used elsewhere in the app) to get retry, caching, and deduplication.
- Replace the polling loop in `processQueue` with a promise-based semaphore or `p-limit` pattern.
- Move server validation in the upload route to be the primary gate and remove the redundant check; compensate with a clearer error contract.

---

## 7. Loading Strategies

### Skeleton Loaders

- `SkeletonCard`, `SkeletonGrid`, `SkeletonTable` exist in `src/components/shared/skeleton-card.tsx` — reusable and well-designed.
- `ImageGrid` has a per-image skeleton: `cn(!loaded && "bg-muted animate-pulse")` — good UX for staggered image loading.

### Loading State

- `SelectPage` shows a full-screen `<Loader2>` spinner during initial data fetch — fine for initial load, but a skeleton matching the final layout would be better.
- No `loading.tsx` file exists for any route group. The dashboard layout has no loading boundary — the entire page content waits.

### Streaming / Suspense

- **No `React.Suspense` boundaries** wrapping any data-fetching component.
- The `ErrorBoundary` at the layout level catches errors but provides no fallback during loading.
- Toggling between gallery and swipe views triggers an instant render (both components pre-loaded); no loading state needed.

### Empty States

- `SelectPage` handles empty images with `<EmptyState>`.
- `useProjects`, `useDashboardStats` return empty arrays — the calling component must handle `data` being undefined vs empty.

**Recommendations:**
- Add `loading.tsx` files for `(dashboard)` and `select/[token]` route groups using `SkeletonGrid` for matching layouts.
- Wrap the `ImageGrid` in `<Suspense fallback={<SkeletonGrid count={12} cols={4} />}>`.
- Replace the full-screen spinner in `SelectPage` with a skeleton layout to reduce perceived latency.

---

## 8. Performance Score & Recommendations

| Category | Score | Key Issues |
|---|---|---|
| Bundle Size | 5/10 | No code splitting, "use client" boundary too high, no dynamic imports |
| Image Optimization | 7/10 | Good client compression, lazy loading missing in one component, no blur placeholders |
| Database Queries | 7/10 | No pagination on images, `select("*")` in projects list, missing cache on images route |
| Re-Render Efficiency | 6/10 | `memo` broken by unstabilized callbacks, no `useReducer` for related state |
| Network Requests | 6/10 | Raw fetch without retry in critical path, polling instead of semaphore |
| Loading Strategies | 6/10 | Good skeleton components, but no Suspense boundaries or loading.tsx |

### Top 5 Recommendations

1. **Code-split SwipeView** — `dynamic(() => import("./swipe-view"))` with `ssr: false` saves ~2KB bundle for all users who never open swipe mode.

2. **Migrate select page to server component + React Query** — Fetch initial data server-side, then use `useQuery` client-side for refetching. This adds retry and caching.

3. **Add pagination to image queries** — Both the `/images` API route and the UI should support cursor/offset pagination to handle 500+ image projects.

4. **Stabilize callbacks in SelectPage** — Wrap `toggleSelect`, `toggleReject`, `toggleHighlight` in `useCallback` so `memo`ed `GridImageItem` components actually skip re-renders.

5. **Add `loading.tsx` + Suspense boundaries** — Use `SkeletonGrid` in route-level loading files and wrap data-fetching sections in `<Suspense>` to reduce perceived latency.
