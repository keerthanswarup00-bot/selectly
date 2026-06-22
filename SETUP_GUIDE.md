# SELECTLY — LOCAL DEVELOPMENT SETUP GUIDE

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git
- A Supabase account (free tier is fine)

---

## STEP 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Project name: `selectly`
5. Create a strong database password
6. Wait for the project to initialize (2–3 minutes)

### 1.2 Get API Keys

1. Go to **Settings > API**
2. Copy `Project URL` → save as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.3 Create Database Tables

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL below:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  studio_name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR NOT NULL,
  event_date DATE NOT NULL,
  target_count INT NOT NULL,
  min_count INT NOT NULL,
  max_count INT NOT NULL,
  status VARCHAR DEFAULT 'draft',
  link_token VARCHAR UNIQUE NOT NULL,
  total_images INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename VARCHAR NOT NULL,
  storage_path VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Selections table
CREATE TABLE selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  selected JSONB DEFAULT '[]'::jsonb,
  highlighted JSONB DEFAULT '[]'::jsonb,
  rejected JSONB DEFAULT '[]'::jsonb,
  skipped JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_link_token ON projects(link_token);
CREATE INDEX idx_images_project_id ON images(project_id);
CREATE INDEX idx_selections_project_id ON selections(project_id);
```

4. Click **Run**
5. Wait for confirmation (should see "Success")

### 1.4 Create Storage Bucket

1. Go to **Storage**
2. Click **Create a new bucket**
3. Name: `previews`
4. Set to **Private** (not public)
5. Click **Create bucket**

### 1.5 Set Row Level Security (RLS)

**For users table:**

1. Go to **Authentication > Policies**
2. Select `users` table
3. Click **New policy**
4. Policy name: `Users can only view their own data`
5. Template: `SELECT`
6. Expression: `auth.uid() = user_id`
7. Create policy

**For projects table:**

1. Click **New policy**
2. Policy name: `Users can view their own projects`
3. Template: `SELECT`
4. Expression: `auth.uid() = user_id`
5. Create policy

Repeat for `INSERT`, `UPDATE`, `DELETE` templates with same expression.

---

## STEP 2: Local Setup

### 2.1 Clone/Create Project

```bash
# Create project directory
mkdir selectly-app
cd selectly-app

# Copy all files from the spec into this directory
# (All the files we created above)
```

### 2.2 Install Dependencies

```bash
npm install
```

This will install all packages from package.json

### 2.3 Environment Variables

```bash
# Copy the example
cp .env.local.example .env.local

# Edit .env.local with your Supabase keys
nano .env.local
```

**Fill in:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2.4 Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## STEP 3: Test the App

### 3.1 Sign Up

1. Go to `/auth/signup`
2. Create account:
   - Email: `test@example.com`
   - Password: `Test1234`
   - Studio Name: `Aurora Studio`
3. You'll see the verify email page (Supabase email not configured for dev, so just go back to login)

### 3.2 Login

1. Go to `/auth/login`
2. Login with the credentials you just created
3. You should see the Dashboard

### 3.3 Create Project

1. Click **New Project**
2. Fill in:
   - Client Name: `Akash & Priya`
   - Event Date: `2026-06-15`
   - Target: `150`
3. Click **Create Project**
4. You're now on the project page (status: Draft)

### 3.4 Upload Images (for testing)

For full testing, you need images. Create a test folder:

```bash
mkdir test-images

# Add some test images (or copy from existing photos)
# Name them: IMG_001.jpg, IMG_002.jpg, etc.
```

Then on the project page:
1. Click upload area
2. Select the test-images folder
3. System will auto-filter out non-images and upload

---

## DIRECTORY STRUCTURE

```
selectly-web/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles
│   ├── providers.tsx       # Theme provider
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify-email/page.tsx
│   └── dashboard/
│       ├── layout.tsx      # Main dashboard layout
│       ├── page.tsx        # Project list
│       ├── new-project/page.tsx
│       └── project/[id]/page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── theme-toggle.tsx
│   ├── dashboard-header.tsx
│   └── dashboard-sidebar.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── utils.ts            # Helper functions
│   └── validations.ts      # Zod schemas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── .env.local
```

---

## KEY FILES EXPLAINED

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Initializes Supabase client for all API calls |
| `lib/validations.ts` | Zod schemas for form validation (signup, login, create project) |
| `app/providers.tsx` | Sets up theme provider (dark/light mode) |
| `components/theme-toggle.tsx` | Dark/light mode toggle button |
| `app/dashboard/layout.tsx` | Dashboard wrapper with auth check |
| `app/dashboard/page.tsx` | Main dashboard (project list) |

---

## COMMON ISSUES & FIXES

### "NEXT_PUBLIC_SUPABASE_URL is not set"
- Check `.env.local` exists
- Restart dev server: `npm run dev`

### "Cannot fetch projects"
- Check RLS policies are created (Authentication > Policies)
- Make sure you're logged in

### Images not uploading
- Check storage bucket `previews` exists
- Check bucket is set to **Private**, not public
- Restart dev server

### Theme not switching
- Make sure you're in a layout component that has `Providers` wrapper
- Check `next-themes` is installed

---

## WHAT'S NEXT (NEXT PHASE)

After you confirm the Admin UI is working:

1. **Client Selection UI** (Phase 2)
   - Gallery view
   - Swipe UI
   - Selection states management
   - Submit button logic

2. **Desktop App** (Phase 4)
   - Python app for folder creation
   - File matching algorithm
   - selection.txt parsing

---

## QUICK START CHECKLIST

- [ ] Supabase project created
- [ ] API keys copied to .env.local
- [ ] Database tables created (SQL)
- [ ] Storage bucket `previews` created
- [ ] RLS policies configured
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] Can sign up on `/auth/signup`
- [ ] Can login on `/auth/login`
- [ ] Can create project on dashboard
- [ ] Theme toggle works

---

**Once all checked, the Admin UI is ready.**

Next: Build Phase 2 (Client Selection UI)
