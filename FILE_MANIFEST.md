# SELECTLY PHASE 1 — COMPLETE FILE MANIFEST

**Total Files Created:** 29 (27 code files + 2 config docs)

Copy all files below to your `selectly-web` directory to have a complete, working Next.js project.

---

## DIRECTORY STRUCTURE

```
selectly-web/
├── app/
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── verify-email/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── new-project/
│   │   │   └── page.tsx
│   │   └── project/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── providers.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── theme-toggle.tsx
│   ├── dashboard-header.tsx
│   └── dashboard-sidebar.tsx
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── validations.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.local.example
├── .gitignore
├── SETUP_GUIDE.md
└── README.md
```

---

## FILE CHECKLIST

### Configuration Files
- [x] `package.json` — Dependencies
- [x] `tsconfig.json` — TypeScript config
- [x] `tailwind.config.ts` — Tailwind CSS config
- [x] `postcss.config.js` — PostCSS config
- [x] `next.config.js` — Next.js config
- [x] `.env.local.example` — Environment template
- [x] `.gitignore` — Git ignore rules

### Core App Files
- [x] `app/layout.tsx` — Root layout
- [x] `app/globals.css` — Global styles
- [x] `app/providers.tsx` — Theme provider

### Authentication
- [x] `app/auth/layout.tsx` — Auth layout
- [x] `app/auth/signup/page.tsx` — Sign up page
- [x] `app/auth/login/page.tsx` — Login page
- [x] `app/auth/verify-email/page.tsx` — Email verification

### Dashboard
- [x] `app/dashboard/layout.tsx` — Dashboard layout
- [x] `app/dashboard/page.tsx` — Project list
- [x] `app/dashboard/new-project/page.tsx` — Create project
- [x] `app/dashboard/project/[id]/page.tsx` — Project detail

### Components
- [x] `components/ui/button.tsx` — Button component
- [x] `components/ui/input.tsx` — Input component
- [x] `components/ui/label.tsx` — Label component
- [x] `components/theme-toggle.tsx` — Theme toggle
- [x] `components/dashboard-header.tsx` — Header
- [x] `components/dashboard-sidebar.tsx` — Sidebar

### Libraries
- [x] `lib/supabase.ts` — Supabase client
- [x] `lib/utils.ts` — Utility functions
- [x] `lib/validations.ts` — Zod validation schemas

### Documentation
- [x] `SETUP_GUIDE.md` — Setup instructions
- [x] `README.md` — Project overview

---

## HOW TO USE THESE FILES

### Option 1: Copy Manually
```bash
mkdir selectly-web
cd selectly-web

# Create directories
mkdir -p app/auth/signup app/auth/login app/auth/verify-email
mkdir -p app/dashboard/new-project app/dashboard/project/\[id\]
mkdir -p components/ui lib

# Copy each file from the code above into the correct location
```

### Option 2: Clone from GitHub (Coming Soon)
```bash
git clone https://github.com/yourusername/selectly.git
cd selectly-web
npm install
```

---

## QUICK SETUP (After Files Are Copied)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.local.example .env.local

# 3. Add your Supabase keys to .env.local
nano .env.local
# Paste:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 4. Follow SETUP_GUIDE.md for Supabase setup

# 5. Start dev server
npm run dev

# 6. Visit http://localhost:3000/auth/signup
```

---

## FILES BY PURPOSE

### Authentication System
- `app/auth/signup/page.tsx` — Sign up form
- `app/auth/login/page.tsx` — Login form
- `app/auth/verify-email/page.tsx` — Email verification page
- `lib/validations.ts` — Form validation schemas

### Dashboard & Projects
- `app/dashboard/layout.tsx` — Protected dashboard layout
- `app/dashboard/page.tsx` — Project list
- `app/dashboard/new-project/page.tsx` — Create project form
- `app/dashboard/project/[id]/page.tsx` — Project detail + upload

### UI Components
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/theme-toggle.tsx`
- `components/dashboard-header.tsx`
- `components/dashboard-sidebar.tsx`

### Backend Integration
- `lib/supabase.ts` — Supabase client
- `lib/utils.ts` — Helper functions
- `lib/validations.ts` — Zod schemas

### Styling
- `app/globals.css` — Global styles + dark mode variables
- `tailwind.config.ts` — Tailwind configuration

### Configuration
- `package.json` — Dependencies
- `tsconfig.json` — TypeScript settings
- `next.config.js` — Next.js settings
- `postcss.config.js` — PostCSS settings

---

## DEPENDENCIES (From package.json)

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "next": "^14.1.0",
  "@supabase/supabase-js": "^2.38.0",
  "@supabase/auth-helpers-nextjs": "^0.8.7",
  "@supabase/auth-helpers-react": "^0.4.6",
  "tailwindcss": "^3.4.1",
  "postcss": "^8.4.31",
  "autoprefixer": "^10.4.16",
  "@radix-ui/react-dialog": "^1.1.1",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-slot": "^2.0.2",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0",
  "lucide-react": "^0.294.0",
  "next-themes": "^0.2.1",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.4",
  "@hookform/resolvers": "^3.3.4",
  "axios": "^1.6.5",
  "date-fns": "^2.30.0"
}
```

All installed via `npm install` from package.json

---

## WHAT EACH FILE DOES

### app/layout.tsx
- Root layout component
- Sets up metadata
- Wraps app with Providers (theme)

### app/providers.tsx
- Theme provider setup
- Enables dark/light mode toggling

### app/globals.css
- Tailwind directives (@tailwind)
- CSS variables for light/dark mode
- Custom scrollbar styling

### app/auth/layout.tsx
- Wrapper for auth pages
- Centered card layout
- Used by signup, login, verify-email pages

### app/auth/signup/page.tsx
- Sign up form (email, password, studio name)
- Password validation (8 chars, 1 uppercase, 1 number)
- Creates user in Supabase Auth
- Creates user profile in database
- Redirects to email verification

### app/auth/login/page.tsx
- Login form (email, password)
- Error handling
- Redirects to dashboard on success
- Session persistence via Supabase

### app/auth/verify-email/page.tsx
- Simple page telling user to check email
- No active functionality in Phase 1

### app/dashboard/layout.tsx
- Protected dashboard wrapper
- Checks if user is authenticated
- Redirects to login if not
- Renders header + sidebar
- Fetches studio name for display

### app/dashboard/page.tsx
- Project list view
- Stats cards (draft, uploading, selecting, completed)
- Project table with status, actions
- Delete project functionality
- Create project button

### app/dashboard/new-project/page.tsx
- Create project form
- Fields: client name, event date, target count
- Auto-calculates min/max (80%–120% of target)
- Form validation with Zod
- Creates project in database with DRAFT status
- Redirects to project detail page

### app/dashboard/project/[id]/page.tsx
- Project detail page
- Status display
- Stats (uploaded count, target, range)
- Image upload component (drag-drop)
- File filtering (images only)
- File validation feedback
- Client link display + copy button

### components/ui/button.tsx
- Reusable button component (shadcn/ui)
- Variants: default, outline, ghost, link, secondary, destructive
- Sizes: default, sm, lg, icon

### components/ui/input.tsx
- Reusable input component (shadcn/ui)
- Supports all HTML input types
- Styling with Tailwind

### components/ui/label.tsx
- Reusable label component (shadcn/ui)
- Accessible HTML labels

### components/theme-toggle.tsx
- Sun/Moon icon button
- Toggles between light/dark mode
- Uses next-themes
- Persistent (localStorage)

### components/dashboard-header.tsx
- Sticky header
- Studio name + Selectly logo
- Theme toggle button
- Logout button
- Mobile menu toggle

### components/dashboard-sidebar.tsx
- Navigation sidebar
- Links: Dashboard, New Project
- Mobile responsive (collapses on small screens)
- Active link highlighting

### lib/supabase.ts
- Initializes Supabase client
- Imports from environment variables
- Used by all pages for database access

### lib/utils.ts
- Helper function: `cn()` for className merging
- Uses clsx + tailwind-merge

### lib/validations.ts
- Zod validation schemas
- signupSchema (email, password, studioName)
- loginSchema (email, password)
- createProjectSchema (clientName, eventDate, targetCount)
- TypeScript types exported for form inputs

### tailwind.config.ts
- Extends theme with CSS variables
- Dark mode support
- Custom colors mapped to Tailwind
- Rounded corners, borders

### postcss.config.js
- Tailwind as PostCSS plugin
- Autoprefixer for browser compatibility

### next.config.js
- Image optimization
- Remote image sources (Supabase)

### tsconfig.json
- Strict mode enabled
- Path aliases (@/*)
- ES2020 target
- Module resolution: bundler

### package.json
- All dependencies listed
- Scripts: dev, build, start, lint

### .env.local.example
- Template for environment variables
- Instructions to fill in

### .gitignore
- Node modules
- Build files
- Environment files
- IDE settings
- OS files

### SETUP_GUIDE.md
- Complete setup instructions
- Supabase setup (step by step)
- Local setup (install, env, run)
- Testing checklist
- Troubleshooting
- SQL migration script

### README.md
- Project overview
- Features list
- Tech stack
- Project structure
- Quick start guide
- Troubleshooting

---

## NEXT: WHAT TO DO

1. **Copy all these files** to your `selectly-web` directory
2. **Follow SETUP_GUIDE.md** to set up Supabase
3. **Run `npm install`** to install dependencies
4. **Set up `.env.local`** with your Supabase keys
5. **Run `npm run dev`** to start the dev server
6. **Test the app** by signing up, creating a project, and uploading images
7. **Once working, start Phase 2** (client selection UI)

---

## THAT'S IT

You now have a complete, working admin UI for Selectly.

**Total lines of code:** ~1200 (clean, readable, fully typed)  
**Setup time:** 20 minutes  
**Ready for:** Client selection UI (Phase 2)

---

**Copy these 29 files and you're good to go.**
