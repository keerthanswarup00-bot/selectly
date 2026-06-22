# Selectly — Wedding Photo Selection Platform

Fast, simple photo selection for wedding photographers.

**Status:** Phase 1 Admin UI — Complete & Ready for Development

---

## What's Built (Phase 1)

### ✅ Authentication System
- Sign up (email, password, studio name)
- Login with session persistence
- Email verification (via Supabase)
- Secure logout

### ✅ Dashboard
- Project list with stats (drafts, uploading, selecting, completed)
- Real-time project counts
- Quick actions (view, download, delete)

### ✅ Project Management
- Create new project form
- Auto-calculated min/max photo counts (80%–120% of target)
- Project status tracking (draft → uploaded → selecting → completed)

### ✅ Image Upload
- Folder upload support (bulk)
- Automatic file filtering (accepts images only, rejects videos/documents)
- Upload progress tracking
- File validation feedback (shows accepted vs rejected)
- Auto-resize previews to 1200px width
- Supabase storage integration

### ✅ Design
- Clean, minimal UI (Apple Photos inspired)
- Dark/Light mode toggle (persistent)
- Tailwind CSS + shadcn/ui components
- Responsive (mobile, tablet, desktop)
- Fully typed (TypeScript)

### ✅ Backend
- Supabase authentication
- PostgreSQL database
- File storage (Supabase Storage)
- Row-level security (RLS) policies
- Form validation (Zod)

---

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth
- **File Storage:** Supabase Storage
- **Form Validation:** React Hook Form + Zod
- **Theme:** next-themes (dark/light mode)
- **Language:** TypeScript

---

## Project Structure

```
selectly-web/
├── app/                          # Next.js app directory
│   ├── auth/
│   │   ├── login/page.tsx       # Login page
│   │   ├── signup/page.tsx      # Sign up page
│   │   └── verify-email/page.tsx # Email verification
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard wrapper (auth protected)
│   │   ├── page.tsx             # Project list
│   │   ├── new-project/page.tsx # Create project
│   │   └── project/[id]/page.tsx # Project detail & upload
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── providers.tsx            # Theme provider
├── components/
│   ├── ui/                      # shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── theme-toggle.tsx         # Dark/light toggle
│   ├── dashboard-header.tsx     # Header with user menu
│   └── dashboard-sidebar.tsx    # Navigation sidebar
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── utils.ts                 # Helper functions
│   └── validations.ts           # Zod schemas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env.local.example           # Environment template
├── SETUP_GUIDE.md               # Detailed setup instructions
└── README.md                    # This file
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)

### 1. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `SETUP_GUIDE.md`
3. Create storage bucket: `previews`
4. Configure RLS policies

### 2. Local Setup

```bash
# Install dependencies
npm install

# Create .env.local (copy from .env.local.example)
cp .env.local.example .env.local

# Add your Supabase keys to .env.local

# Start dev server
npm run dev
```

Visit [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)

---

## Features Breakdown

### Admin Dashboard
- **Project List:** Overview of all projects with status
- **Stats:** Count of drafts, uploading, selecting, completed
- **Create Project:** Simple form to add new projects
- **Project Detail:** View project status, upload images, share client link

### Image Upload
- Drag-and-drop folder upload
- Automatic filtering (images only)
- Shows accepted vs rejected files
- Auto-resize previews (1200px width, ~300KB)
- Stores original filenames for matching

### Navigation
- Sticky header with studio name and logout
- Sidebar with project nav (mobile-friendly)
- Dark/light mode toggle
- Clean, minimal design

---

## Database Schema

### Users Table
```
id, email, studio_name, created_at, updated_at
```

### Projects Table
```
id, user_id, client_name, event_date, target_count,
min_count, max_count, status, link_token, total_images,
created_at, submitted_at, updated_at
```

### Images Table
```
id, project_id, filename, storage_path, created_at
```

### Selections Table (for Phase 2)
```
id, project_id, selected[], highlighted[], rejected[],
skipped[], submitted_at, created_at, updated_at
```

---

## What's NOT Built Yet (Phase 2+)

- ❌ Client selection interface (gallery + swipe UI)
- ❌ Photo selection states management
- ❌ selection.txt generation
- ❌ Desktop app (folder creation)
- ❌ Payment system
- ❌ Team permissions
- ❌ Comments/collaboration
- ❌ Analytics

---

## Key Decisions

### Why Supabase?
- Free tier is generous (500MB storage, unlimited API calls)
- Built-in auth (email verification, JWT)
- PostgreSQL database (powerful, scalable)
- Storage for images
- RLS for security

### Why shadcn/ui?
- Built on Tailwind (no new CSS framework)
- Fully customizable components
- Dark mode support out of the box
- Minimal, clean aesthetics match design goals

### Why Next.js?
- Full-stack (frontend + API routes)
- File-based routing (simple)
- Built-in optimization (images, fonts)
- Great TypeScript support
- Easy deployment to Vercel

---

## Deployment (Future)

### Frontend (Vercel)
```bash
git push  # Automatically deploys to Vercel
```

### Backend (Supabase)
Already hosted. No deployment needed.

### Desktop App (GitHub Releases)
- Build with Python or Electron
- Distribute via GitHub releases
- Users download installers

---

## Development Flow

### Phase 1 ✅ Complete
- Auth system
- Dashboard
- Project management
- Image upload

### Phase 2 (Next)
- Client selection interface (gallery + swipe)
- Selection state management
- Submit logic
- selection.txt generation

### Phase 3 (Then)
- Backend API refinement
- Performance optimization
- Error handling

### Phase 4 (Final)
- Desktop app (folder creation)
- File matching algorithm
- Installer creation

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Troubleshooting

See `SETUP_GUIDE.md` for detailed troubleshooting guide.

**Quick fixes:**
- `NEXT_PUBLIC_SUPABASE_URL` not set? → Check `.env.local` and restart dev server
- Cannot fetch projects? → Check RLS policies in Supabase
- Images not uploading? → Check storage bucket exists and is private

---

## Support

For detailed setup instructions, see `SETUP_GUIDE.md`

---

## License

MIT

---

**Status:** Ready for Phase 2 (Client Selection UI)

**Next Step:** Implement gallery + swipe selection interface for clients
