# Environment Setup

> This guide covers local development, staging, and production setup for the Selectly web application.

---

## 1. PREREQUISITES

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ^20.0.0 | JavaScript runtime |
| npm | ^10.0.0 | Package manager |
| Supabase account | — | Database, auth, storage |
| Vercel account | — | Hosting (staging & production) |
| Supabase CLI (optional) | ^1.200.0 | Local DB management |
| Docker (optional) | Latest | Local Supabase |

---

## 2. LOCAL SETUP

### 2.1 Clone the Repository

```bash
git clone https://github.com/your-org/selectly-web.git
cd selectly-web
```

### 2.2 Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (e.g. `https://abc123.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Service role key — **never exposed to client** |
| `NEXT_PUBLIC_SITE_URL` | No | Defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | No | Defaults to `Selectly` |
| `NEXT_PUBLIC_MAX_FILE_SIZE_MB` | No | Max file size for uploads (default: `20`) |
| `NEXT_PUBLIC_UPLOAD_CONCURRENCY` | No | Max concurrent uploads (default: `5`) |
| `NEXT_PUBLIC_PREVIEW_WIDTH` | No | Preview target width in px (default: `1200`) |
| `NEXT_PUBLIC_PREVIEW_QUALITY` | No | JPEG quality 0–1 (default: `0.8`) |

### 2.3 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name:** `selectly-dev`
   - **Database password:** Generate a strong one and save it
   - **Region:** Closest to you (e.g. `us-east-1`)
   - **Pricing plan:** Free tier
4. Wait for provisioning (~2 minutes)
5. Go to **Project Settings → API** and copy the **Project URL**, **anon public key**, and **service_role key** into `.env.local`

### 2.4 Install Dependencies

```bash
npm install
```

### 2.5 Run Database Migrations

**Option A — Supabase Dashboard SQL Editor:**

1. Go to **SQL Editor** in your Supabase dashboard
2. Open and run each migration file **in order** (copy + paste + Run):
   - `supabase/migrations/001_create_tables.sql`
   - `supabase/migrations/002_client_access.sql`
   - `supabase/migrations/003_fix_rls_and_triggers.sql`

**Option B — psql (requires `DATABASE_URL` env var):**

```bash
npm run db:migrate
```

This runs `psql "$DATABASE_URL" -f supabase/migrations/001_create_tables.sql`. To run all three:

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_create_tables.sql
psql "$DATABASE_URL" -f supabase/migrations/002_client_access.sql
psql "$DATABASE_URL" -f supabase/migrations/003_fix_rls_and_triggers.sql
```

### 2.6 Create the `previews` Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Configure:
   - **Name:** `previews`
   - **Public bucket:** OFF (access via RLS only)
   - **File size limit:** 50 MB
4. Click **Create bucket**

### 2.7 Apply Storage RLS Policies

Run migration `003_fix_rls_and_triggers.sql` which contains the storage RLS policies. If you haven't run it yet, copy and run the storage policies from the SQL Editor:

```sql
CREATE POLICY "previews_select_studio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_studio_id()::text
  );

CREATE POLICY "previews_insert_studio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_studio_id()::text
  );

CREATE POLICY "previews_update_studio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_studio_id()::text
  );
```

### 2.8 Start Development Server

```bash
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

### 2.9 Create Your First User

1. Visit `http://localhost:3000/register`
2. Create an account
3. A studio and profile are created automatically by the registration server action

---

## 3. STAGING SETUP

### 3.1 Vercel Project Configuration

1. Push code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Framework preset: Next.js (auto-detected from `vercel.json`)
5. Vercel will read `vercel.json` automatically:

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install"
}
```

### 3.2 Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables** for the **Preview** environment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your staging Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | Auto-set by Vercel preview URL |
| `NEXT_PUBLIC_APP_NAME` | `Selectly (Staging)` |

> **Recommendation:** Use a separate Supabase project for staging to avoid data contamination.

### 3.3 Deployment Steps

1. Push to a branch (e.g. `develop`) or open a PR
2. Vercel automatically creates a preview deployment
3. The preview URL is posted as a comment on the PR
4. Run migrations on the staging Supabase project (manually via SQL Editor)

---

## 4. PRODUCTION SETUP

### 4.1 Vercel Production Configuration

Follow the same steps as staging (3.1), but for the **Production** environment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_NAME` | `Selectly` |

### 4.2 Custom Domain Configuration

**Vercel:**
1. Go to **Vercel Dashboard → Project → Domains**
2. Add your domain (e.g. `selectly.app`)
3. Add CNAME record pointing to `cname.vercel-dns.com`
4. Wait for SSL provisioning (~5 minutes)
5. Update `NEXT_PUBLIC_SITE_URL` to your production domain

**Supabase Auth:**
1. Go to **Supabase Dashboard → Authentication → Settings**
2. Add production URL under **Site URL**
3. Add redirect URLs: `https://yourdomain.com/**`
4. Update email templates to use production URL

### 4.3 Supabase Production Considerations

- [ ] **Use a dedicated production Supabase project** (separate from dev/staging)
- [ ] **Enable email confirmation** in Auth → Settings → Security
- [ ] **Set session duration** (e.g. 7-day refresh token)
- [ ] **Enable RLS on all tables** (confirmed by migrations)
- [ ] **Set storage bucket size limit** (e.g. 5 GB)
- [ ] **Configure CORS** for your production domain in Supabase Storage settings
- [ ] **Upgrade to Supabase Pro** for daily backups, branching, and higher limits
- [ ] **Review Auth hooks and triggers** if any are configured
- [ ] **Run all migrations** against the production database **before** deploying code

---

## 5. ENVIRONMENT VARIABLES REFERENCE

| Variable | Required | Default | Server/Client | Description |
|----------|----------|---------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Client + Server | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Server only | Admin key, bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | No | `http://localhost:3000` | Client + Server | Canonical site URL for auth redirects |
| `NEXT_PUBLIC_APP_NAME` | No | `Selectly` | Client + Server | Application display name |
| `NEXT_PUBLIC_MAX_FILE_SIZE_MB` | No | `20` | Client | Maximum upload file size in MB |
| `NEXT_PUBLIC_UPLOAD_CONCURRENCY` | No | `5` | Client | Maximum concurrent uploads |
| `NEXT_PUBLIC_PREVIEW_WIDTH` | No | `1200` | Client | Preview image width in pixels |
| `NEXT_PUBLIC_PREVIEW_QUALITY` | No | `0.8` | Client | Preview JPEG quality (0–1) |
| `DATABASE_URL` | Only for db:migrate | — | Local | PostgreSQL connection string for running migrations via psql |

### Config Defaults (from `src/config/index.ts`)

These values are hardcoded and cannot be overridden via environment variables:

| Config | Value | Description |
|--------|-------|-------------|
| `upload.maxRetries` | `3` | Upload retry attempts |
| `upload.allowedMimeTypes` | `image/jpeg, image/png, image/webp, image/heic, image/bmp, image/gif, image/tiff` | Accepted MIME types |
| `upload.allowedExtensions` | `.jpg, .jpeg, .png, .webp, .heic, .bmp, .gif, .tiff, .tif` | Accepted file extensions |
| `storage.buckets.previews` | `previews` | Storage bucket name |
| `pagination.defaultPageSize` | `20` | Default items per page |
| `pagination.maxPageSize` | `100` | Maximum items per page |

---

## 6. DATABASE MIGRATIONS

### 6.1 Migration Order

Migrations must be run **sequentially** in this order:

| # | File | Purpose |
|---|------|---------|
| 001 | `supabase/migrations/001_create_tables.sql` | Creates all tables (`studios`, `profiles`, `projects`, `project_images`, `selections`, `activity_logs`), indexes, RLS policies, helper functions, and `updated_at` triggers |
| 002 | `supabase/migrations/002_client_access.sql` | Adds `preview_url`/`preview_expires_at` columns, public RLS policies for client selection access |
| 003 | `supabase/migrations/003_fix_rls_and_triggers.sql` | Drops `selections_insert_public` policy, adds storage RLS policies for `previews` bucket, adds `total_images` trigger |

### 6.2 How to Run Migrations

**Via psql (requires `DATABASE_URL`):**

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_create_tables.sql
psql "$DATABASE_URL" -f supabase/migrations/002_client_access.sql
psql "$DATABASE_URL" -f supabase/migrations/003_fix_rls_and_triggers.sql
```

**Via npm script** (uses the same `db:migrate` script for migration 001):

```bash
DATABASE_URL=postgresql://... npm run db:migrate
```

> The `db:migrate` script only runs `001_create_tables.sql`. Migrations 002 and 003 must be run individually via psql or the Supabase SQL Editor.

**Via Supabase Dashboard SQL Editor (recommended for safety):**

1. Go to Supabase dashboard → SQL Editor
2. Open each file, copy contents, paste, and click **Run**
3. Verify each step before proceeding to the next

**Via Supabase CLI:**

```bash
supabase db push
```

---

## 7. VERIFICATION STEPS

### 7.1 App Health

| Check | How | Expected Result |
|-------|-----|----------------|
| Dev server starts | `npm run dev` | Server starts on port 3000 without errors |
| Build succeeds | `npm run build` | Build completes with exit code 0 |
| Lint passes | `npm run lint` | No lint errors |
| Type check passes | `npm run typecheck` | No TypeScript errors |

### 7.2 User Registration & Login

1. Visit `/register` and create an account
2. Verify the redirect to the dashboard
3. Log out, then log in with the created credentials
4. Verify redirect to dashboard

### 7.3 Project Lifecycle

1. From the dashboard, click **Create Project**
2. Fill in client name, event date, target count, min/max count
3. Verify the project appears in the project list
4. Click into the project and upload images
5. Verify images appear in the preview grid
6. Check Supabase Storage: images stored under `previews/{studio_id}/{project_id}/`

### 7.4 Share & Client Selection

1. Copy the project's share link (uses `link_token`)
2. Open the link in an incognito/private browser window
3. Verify images load in the client selection view
4. Select, highlight, and reject images
5. Submit the selection
6. Verify the project status changes to `submitted`
7. Verify the dashboard reflects the submission

### 7.5 Security Verification

1. Create a second account (different email)
2. Verify you cannot see the first account's projects
3. Verify the share link doesn't expose data from other studios
4. Verify protected routes redirect to login when unauthenticated

### 7.6 Database Verification

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
-- Expected: studios, profiles, projects, project_images, selections, activity_logs
```

### 7.7 Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `401 Unauthorized` on data fetch | RLS policy blocking | Verify `public.get_studio_id()` returns the correct value |
| Images upload but don't appear | Storage RLS policies missing | Run migration 003 or apply storage policies manually |
| Login redirect loop | Session cookie not set | Verify `@supabase/ssr` middleware configuration |
| `relation "public.studios" does not exist` | Migration not run | Apply migration 001 |
| CORS errors on upload | Storage CORS not configured | Configure in Supabase Storage settings |
| Build fails with type errors | TypeScript config issue | Run `npm run typecheck` to identify errors |
