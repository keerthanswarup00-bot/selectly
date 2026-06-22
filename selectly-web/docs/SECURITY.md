# Security

## Authentication

Selectly uses **Supabase Auth** (GoTrue) for all authentication.

| Feature | Implementation |
|---------|---------------|
| Email/password auth | Built-in Supabase Auth |
| Session management | HTTP-only cookies via `@supabase/ssr` |
| Email verification | Enabled with Supabase's built-in email templates (redirect back to app) |
| Password reset | Supabase's `auth.resetPasswordForEmail()` |
| Session refresh | Handled automatically by Supabase client library |
| Multi-factor | Not yet implemented (future phase) |

### Session Flow

```
User logs in → Supabase returns access + refresh tokens
  → Tokens stored in HTTP-only cookies (Next.js middleware sets them)
  → Each request: middleware reads cookie, refreshes if needed
  → Server actions use supabase server client (cookie-based auth)
  → Browser client uses supabase browser client (cookie-based auth)
```

### Protecting Routes

Middleware in `src/middleware.ts` checks for a valid session and redirects unauthenticated users to `/login`. Protected routes are defined by a `matcher` config.

---

## Row Level Security

Every table has RLS enabled. The core pattern is:

1. Every row has a `studio_id` column
2. RLS policies call `auth.get_studio_id()` to compare against the row's `studio_id`
3. Users never see data from other studios

### Table Policies

See [DATABASE.md](./DATABASE.md#rls-policy-summary) for a complete policy matrix.

### Storage Policies

Supabase Storage RLS is configured on the `previews` bucket. Policies check that the first folder in the storage path matches the user's `studio_id`:

```sql
(storage.foldername(name))[1] = auth.get_studio_id()::text
```

This ensures:
- Studio A cannot read, write, or delete files in Studio B's folder
- Authenticated users only (no public access)
- Files are organized by studio ID as the top-level folder

### Client Selection Access

The client-facing selection view (`/s/[token]`) must work without authentication. The approach is:

1. The `link_token` on `projects` is a cryptographically random UUID (128 bits of entropy)
2. A dedicated RLS policy on `selections` allows SELECT/UPDATE where the `project_id` matches a project with the given `link_token`
3. The client app passes the token as an anonymous session claim

This is not yet implemented in the migration — it will be added in Phase 2.

---

## Input Validation

All data that enters the system goes through **Zod validation** on the server.

| Layer | What's validated | How |
|-------|-----------------|-----|
| Server actions | All mutation inputs | Zod schemas in `src/lib/schemas/` |
| File uploads | Type, size, dimensions | Client-side + server-side validation |
| URL params | UUIDs, tokens | Zod + regex patterns |
| API routes (future) | Request body | Zod schemas |

### Example Schema Pattern

```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(200),
  eventDate: z.string().date().optional(),
  targetCount: z.number().int().positive(),
  minCount: z.number().int().positive(),
  maxCount: z.number().int().positive(),
}).refine(data => data.maxCount >= data.minCount, {
  message: 'Max count must be >= min count',
});
```

---

## File Upload Validation

| Check | Client-side | Server-side |
|-------|-------------|-------------|
| File type | Accept attribute + JS check | MIME type check against allowlist |
| File size | JS check before upload | Supabase Storage file size limit |
| Dimensions | FileReader + Image() | Sharp (or similar) on server |
| Duplicate filenames | — | Check against existing project_images |

**Allowed types:** `image/jpeg`, `image/png`, `image/webp`, `image/tiff`, `image/heic` (Safari)

**Max file size:** 50 MB per file (configurable via env var)

---

## Environment Variable Management

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Yes |
| `SUPABASE_JWT_SECRET` | JWT verification | Yes |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | Yes |
| `UPLOAD_MAX_SIZE_MB` | Max upload file size | No (default 50) |
| `SENTRY_DSN` | Error tracking | No |
| `POSTHOG_KEY` | Analytics | No |

All secrets are stored in **Vercel Environment Variables** and never committed. `.env.example` contains placeholder values.

---

## CORS and Middleware Protection

### CORS

- Supabase Storage has CORS configured to allow requests from the app's domain
- API routes (if any) are scoped to same-origin by default
- If third-party services are needed, CORS headers are set explicitly per route

### Middleware

Next.js middleware (`src/middleware.ts`) handles:

1. **Session check** — redirects unauthenticated users to `/login`
2. **Studio check** — ensures user has a profile/studio before accessing dashboard
3. **Public routes** — `/s/[token]` and `/login`, `/register` bypass auth check

---

## Audit Logging

Every significant action is recorded in `activity_logs`:

| Action | Triggered By | Metadata |
|--------|-------------|----------|
| `project.created` | Server action | `{ clientName, targetCount }` |
| `project.updated` | Server action | `{ changes: [...] }` |
| `project.deleted` | Server action | `{ projectId }` |
| `image.uploaded` | Server action | `{ filename, fileSize }` |
| `image.deleted` | Server action | `{ filename }` |
| `selection.submitted` | Client action | `{ selected: N, highlighted: N }` |
| `user.invited` | Server action | `{ email, role }` |

Audit logs are append-only (no UPDATE/DELETE policies for application code).
