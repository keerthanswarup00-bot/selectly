# Product Roadmap

## Phase 1: Admin UI (Current)

**Goal:** Studio admins can create projects, upload images, and manage galleries.

### Features
- [x] Supabase database migration (tables, RLS, indexes)
- [x] Authentication (login, register, session management)
- [ ] Project CRUD (create, list, edit, soft-delete)
- [ ] Image upload (drag & drop, progress indicators)
- [ ] Image grid view (thumbnail, lightbox)
- [ ] Project settings (target count, min/max, client name)
- [ ] Share link generation (copy to clipboard)
- [ ] Basic dashboard (project list with statuses)
- [ ] Responsive layout (mobile-friendly admin)

### Tech
- Next.js 15 App Router, Tailwind CSS, shadcn/ui
- Supabase Auth, Storage, Database
- Zod validation, server actions

---

## Phase 2: Client Selection UI

**Goal:** Clients can open a share link, browse images, and make selections.

### Features
- [ ] Client-facing selection view (`/s/[token]`)
- [ ] Image gallery browsing (lazy loading, zoom)
- [ ] Selection actions: mark as selected, highlighted, rejected, skipped
- [ ] Selection summary (counts, progress toward target)
- [ ] Submit button with confirmation
- [ ] Thank-you page after submission
- [ ] Real-time sync (selections saved as they're made)
- [ ] Mobile-optimized touch gestures
- [ ] Accessibility (keyboard navigation, screen reader support)

### Tech
- Supabase Realtime for live updates
- Signed URLs for image access (no auth required)
- Optimistic UI updates

---

## Phase 3: Backend Infrastructure

**Goal:** Production-hardened backend with observability, performance optimization, and tooling.

### Features
- [ ] Activity audit log integration
- [ ] Sentry error tracking
- [ ] PostHog analytics
- [ ] Rate limiting on file uploads
- [ ] Image compression pipeline (Sharp on upload)
- [ ] Automatic thumbnail generation
- [ ] Database connection pooling (PgBouncer)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Automated backup verification
- [ ] Load testing (k6 or similar)

### Tech
- Sentry, PostHog, PgBouncer
- Sharp (image processing)
- k6 (load testing)

---

## Phase 4: Desktop App (Tauri)

**Goal:** A native desktop app for studio users to upload files directly from their file system.

### Features
- [ ] Tauri + React shell
- [ ] Folder watch / drag & drop upload
- [ ] Direct upload to Supabase Storage
- [ ] Offline queue (upload when online)
- [ ] EXIF data extraction for sorting
- [ ] Batch operations (rename, delete, reorder)
- [ ] Native file picker with directory support
- [ ] Auto-update mechanism

### Tech
- Tauri v2, Rust backend
- React frontend (shares components with web app)
- File system access via Tauri APIs

---

## Future (Not Scheduled)

### Multi-studio Teams
- Invite team members (editor, admin roles)
- Team activity log
- Role management UI

### Billing & Subscriptions
- Stripe integration
- Tiered plans (storage limits, team size)
- Usage-based billing

### Advanced Selection Features
- AI-assisted selection (auto-tag by content)
- Client notes/comments per image
- Side-by-side comparison
- Print ordering integration

### Analytics Dashboard
- Per-project engagement metrics
- Client selection patterns
- Studio usage trends
- Revenue tracking

### API & Integrations
- Public REST API
- Webhooks (new submission, upload complete)
- Zapier / Make integration
- Lightroom plugin (export directly to Selectly)

### White-label
- Custom domains per studio
- Custom branding (colors, logo)
- Remove "Powered by Selectly"

---

## Timeline (Tentative)

```
Q3 2026  Phase 1: Admin UI
Q4 2026  Phase 2: Client Selection UI
Q1 2027  Phase 3: Backend Infrastructure
Q2 2027  Phase 4: Desktop App
Q3 2027  Billing, Teams, Analytics
```
