# Architecture

## System Overview

Selectly is a multi-tenant SaaS application that enables photography studios to send image galleries to clients for selection. Each studio (tenant) operates in complete isolation — owning its own projects, images, and client data.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients (Browser)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Studio Admin │  │ Client View │  │ Share Links (public) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
└─────────┼──────────────────┼─────────────────────┼────────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel Edge / Serverless                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 App Router                        │  │
│  │  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌──────────┐  │  │
│  │  │  Pages   │  │ API Routes│  │Actions │  │Middleware│  │  │
│  │  └──────────┘  └───────────┘  └────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Supabase DB │  │ Supabase     │  │ Supabase Auth    │
│  (Postgres)  │  │ Storage      │  │ (GoTrue)         │
│  + RLS       │  │ (S3-backed)  │  │ + Row Level      │
│              │  │              │  │   Security       │
└──────────────┘  └──────────────┘  └──────────────────┘
```

### Key Principles

- **Multi-tenant isolation** via `studio_id` on every table and RLS policies
- **Server actions** over REST for data mutations (co-located with components)
- **Storage-first** for images with database only for metadata
- **Audit trail** via `activity_logs` table for every significant action

---

## Folder Structure

```
selectly-web/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENT_SETUP.md
│   ├── ROADMAP.md
│   ├── SECURITY.md
│   └── STORAGE_ARCHITECTURE.md
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── projects/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── upload/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── s/
│   │   │   └── [token]/
│   │   │       └── page.tsx          # Client selection view
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                       # Primitives (Button, Card, etc.)
│   │   ├── forms/                    # Form components
│   │   ├── projects/                 # Project-specific components
│   │   └── selection/                # Client selection UI components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Auth middleware client
│   │   ├── actions/                  # Server actions
│   │   │   ├── projects.ts
│   │   │   ├── images.ts
│   │   │   └── selections.ts
│   │   ├── schemas/                  # Zod validation schemas
│   │   │   ├── projects.ts
│   │   │   ├── images.ts
│   │   │   └── auth.ts
│   │   └── utils.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 001_create_tables.sql
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Data Flow

### Project Creation Flow

```
User fills form → Server action (zod validate) → Insert project row
  → Return project ID → Navigate to project detail → Upload images
```

### Image Upload Flow

```
User drops files → Client-side validation (type/size)
  → Server action receives files → Validate again
  → Upload to Supabase Storage (studio_id/project_id/filename)
  → Insert project_images row (metadata)
  → Increment project.total_images
  → Log activity
```

### Client Selection Flow

```
Client opens share link → Load selections via link_token (no auth)
  → Browse images → Tap to select/highlight/reject
  → Save to selections table via anon key RLS
  → Submit → Sets submitted_at → Studio sees status change
```

### Real-time Updates (Future)

```
Supabase Realtime subscription on selections table
  → Studio dashboard updates live as client makes selections
```

---

## Multi-tenant Isolation Strategy

| Layer | Mechanism |
|-------|-----------|
| **Database** | Every table has a `studio_id` column. RLS policies filter by `auth.get_studio_id()`. |
| **Storage** | Files stored under `studio_id/project_id/` prefix. RLS checks folder name matches the user's studio. |
| **Auth** | Profiles link `auth.users` to `studios`. A user can belong to exactly one studio. |
| **Client links** | `link_token` on projects is a random UUID. The selection view uses a separate service role or anon key with row-level access to specific `selections` rows. |
| **API** | Server actions implicitly scope to `auth.get_studio_id()`. |

---

## Decision Records

### Why Next.js 15

- App Router provides server components, streaming, and nested layouts out of the box
- Server Actions eliminate the need for a separate API layer for mutations
- Edge runtime for middleware and (future) real-time features
- Vercel deployment is zero-config and optimised for Next.js
- Large ecosystem and community

### Why Supabase

- Postgres with built-in Row Level Security provides tenant isolation at the DB level
- Auth (GoTrue) with built-in session management — no need for a separate auth provider
- Storage backed by S3 with RLS-compatible policies
- Realtime subscriptions for live updates (future phases)
- Generous free tier for early-stage development

### Why Feature-based Architecture

- Each major domain (projects, images, selections) is self-contained
- Server actions and schemas sit next to the features they serve
- Easier to extract into separate packages if needed later
- Clear boundaries for team scaling

### Why Zod for Validation

- Type-safe schemas that generate TypeScript types automatically
- Runs identically on client and server — validate once, trust everywhere
- Tight integration with server actions for error feedback
- Lightweight and tree-shakeable
