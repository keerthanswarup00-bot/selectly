# Environment Setup

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ^20.0.0 | JavaScript runtime |
| npm | ^10.0.0 | Package manager |
| Supabase CLI (optional) | ^1.200.0 | Local DB management |
| Docker (optional) | Latest | Local Supabase |

---

## Supabase Project Creation

### Via Dashboard (Recommended)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name:** `selectly` (or your preferred name)
   - **Database password:** Generate a strong one (save in password manager)
   - **Region:** Choose closest to your users (e.g. `us-east-1`)
   - **Pricing plan:** Free tier is fine for development
4. Wait for the database to provision (~2 minutes)
5. Go to **Project Settings → API** and note:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### Via CLI (Alternative)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Create project
supabase projects create selectly --org-id your-org-id --db-password your-password

# Link local project
supabase link --project-ref your-project-ref
```

---

## Running Migrations

### Option 1: Supabase Dashboard SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Open `supabase/migrations/001_create_tables.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run**

### Option 2: Supabase CLI

```bash
# From the project root
supabase db push

# Or for a specific migration
supabase db push --db-url postgresql://...
```

### Option 3: psql (Direct)

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_create_tables.sql
```

### Verify

```sql
-- Run in SQL Editor to verify:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Should see: studios, profiles, projects, project_images, selections, activity_logs
```

---

## Storage Bucket Creation

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Configure:
   - **Name:** `previews`
   - **Public bucket:** OFF (access via RLS only)
   - **File size limit:** 50 MB (or your preference)
4. Click **Create bucket**

### Apply Storage RLS Policies

After the bucket is created, uncomment and run the storage RLS policies from `001_create_tables.sql` in the SQL Editor:

```sql
CREATE POLICY "previews_select_studio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.get_studio_id()::text
  );

CREATE POLICY "previews_insert_studio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.get_studio_id()::text
  );

CREATE POLICY "previews_update_studio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'previews'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.get_studio_id()::text
  );
```

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/selectly-web.git
cd selectly-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPLOAD_MAX_SIZE_MB=50
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 5. Create Your First User

1. Visit `http://localhost:3000/register`
2. Create an account
3. The app will create your first studio and profile automatically (handled by a registration server action)

---

## Testing Checklist

After setting up, verify each of these works:

- [ ] User registration creates a studio and profile
- [ ] User login redirects to dashboard
- [ ] Dashboard shows empty project list
- [ ] Creating a project succeeds and appears in the list
- [ ] Uploading images to a project works
- [ ] Images are stored in Supabase Storage under `studio-id/project-id/`
- [ ] Image metadata is saved in `project_images` table
- [ ] Share link (link_token) is accessible and renders the client view
- [ ] Client selection view loads images
- [ ] Selecting/highlighting/rejecting images works
- [ ] Submission sets `submitted_at` and updates project status
- [ ] Studio dashboard reflects selection status
- [ ] RLS prevents seeing another studio's data (test with two accounts)
- [ ] Logging out redirects to login
- [ ] Protected routes redirect unauthenticated users

### Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `401 Unauthorized` on data fetch | RLS policy blocking | Check `auth.get_studio_id()` returns correct value |
| Images upload but don't appear | Storage RLS policy missing | Uncomment and run storage policies |
| Login redirect loop | Session cookie not set | Check middleware and `@supabase/ssr` configuration |
| `relation "public.studios" does not exist` | Migration not run | Apply the migration |
| CORS errors on upload | Storage CORS not configured | Configure in Supabase Storage settings |
