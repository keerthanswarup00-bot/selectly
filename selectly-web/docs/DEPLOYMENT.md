# Deployment

## Vercel Deployment

### Prerequisites

- A Vercel account (Pro plan recommended for production)
- A Supabase project (see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md))
- GitHub repository connected to Vercel

### Step-by-Step

1. **Push code to GitHub**

2. **Import project on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework preset: Next.js (auto-detected)

3. **Configure environment variables**

   | Variable | Source | Notes |
   |----------|--------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | The public anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | **Keep secret** |
   | `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API → JWT Settings | For verifying auth tokens |
   | `NEXT_PUBLIC_SITE_URL` | Your production URL | e.g. `https://selectly.app` |

4. **Deploy**
   - Vercel automatically builds and deploys on push to `main`
   - Preview deployments are created for PR branches

5. **Custom domain** (optional)
   - Go to Vercel Dashboard → Project → Domains
   - Add your domain (e.g. `selectly.app`)
   - Configure DNS records as instructed

---

## Environment Variables Per Environment

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Local Supabase or dev project | Preview Supabase project | Production Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev anon key | Preview anon key | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev service key | Preview service key | Production service key |
| `SUPABASE_JWT_SECRET` | Dev JWT secret | Preview JWT secret | Production JWT secret |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Vercel preview URL | Production domain |

**Recommendation:** Use separate Supabase projects for development, staging/preview, and production to avoid data contamination.

---

## Supabase Production Checklist

- [ ] **Enable email confirmation** in Auth → Settings → Security
- [ ] **Set session duration** (e.g. 7 days for refresh token)
- [ ] **Enable RLS** on all tables (confirmed in migration)
- [ ] **Set storage bucket size limit** (e.g. 5 GB per bucket)
- [ ] **Configure CORS** for your production domain
- [ ] **Set up database backups** (Supabase Pro includes daily backups)
- [ ] **Enable SSL enforcement** (always on for Supabase)
- [ ] **Review Auth hooks and triggers** (if any)
- [ ] **Disable anon key operations** on sensitive tables (RLS already does this)
- [ ] **Set up branch switching** (if using Supabase branching)

---

## Custom Domain Setup

### Vercel (App)

1. Add domain in Vercel project settings
2. Add CNAME record pointing `cname.vercel-dns.com` (or as instructed)
3. Wait for SSL provisioning (~5 minutes)
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables

### Supabase Auth

1. Go to Supabase Dashboard → Authentication → Settings
2. Add your production URL under **Site URL**
3. Add redirect URLs: `https://yourdomain.com/**`
4. Update email templates to use the production URL

---

## Monitoring

### Sentry (Error Tracking)

1. Create a Sentry project for Selectly
2. Add `SENTRY_DSN` to Vercel environment variables
3. Sentry is configured in `src/lib/sentry.ts` (or via Next.js Sentry SDK)
4. Source maps are uploaded automatically on Vercel builds

**What to monitor:**
- Server action errors
- Auth failures
- Upload failures
- RLS policy violations
- Client-side rendering errors

### PostHog (Analytics)

1. Create a PostHog project
2. Add `POSTHOG_KEY` to Vercel environment variables
3. PostHog is initialized in the app layout for client-side events

**What to track:**
- Page views
- Project creation
- Image uploads (count, size)
- Client selection submissions
- User sign-ups and logins

---

## CI/CD with GitHub Actions

### Branch Strategy

```
main          → Production (auto-deploy to Vercel)
develop       → Staging (auto-deploy to preview)
feature/*     → PR preview deployments
```

### Workflow: Lint, Typecheck, Test

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

### Workflow: Deploy to Vercel

Vercel's GitHub integration handles deployments automatically. For custom workflows, use the Vercel CLI:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

> **Note:** The Vercel GitHub app integration is simpler and recommended for most cases. The manual action approach is only needed if you need custom post-deploy steps.

---

## Database Migrations in CI

Migrations should be applied **manually** before deployment, not automatically in CI. Process:

1. Developer creates migration in `supabase/migrations/`
2. Migration is reviewed in PR
3. Before deploying to production, run: `supabase db push --linked`
4. Then deploy the application code

For preview/staging environments, migrations can run automatically using the Supabase CLI in CI:

```yaml
- name: Apply migrations
  run: |
    npx supabase db push --linked
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```
