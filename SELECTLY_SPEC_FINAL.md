# SELECTLY — COMPLETE PRODUCT SPECIFICATION V1.1

**Status:** Ready for Development  
**Created:** June 2026  
**Target Release:** Q3 2026

---

## EXECUTIVE SUMMARY

**Selectly** solves the wedding photo selection bottleneck.

**Current studio workflow (60–90 minutes):**
1. Upload originals to GDrive (5 min)
2. Client screenshots/numbers selected images (30 min)
3. Studio manually searches for files by number (15 min)
4. Studio copies each file into folder (30 min)
5. Studio manual errors, sometimes needs 2 people

**Selectly workflow (5 minutes):**
1. Studio uploads previews to Selectly Web (2 min)
2. Client selects online (2 min)
3. Studio downloads selection.txt, runs Desktop app (1 min)
4. Folder created. Done.

**Core Promise:** "Stop manually copying files. Get the folder in 60 seconds."

---

## PROBLEM STATEMENT

Wedding photographers waste 60–90 minutes per wedding on manual photo selection and folder creation.

**Root causes:**
- Client sends screenshots of selected images (blurry, hard to match)
- Client sends image numbers (e.g., "IMG_001, IMG_025, IMG_045")
- Studio manually finds each file by name in 300-image folder
- Studio manually copies each file into a "Selected" folder
- High error rate (missing files, duplicates, wrong files)
- Process sometimes requires 2 people (one reading numbers, one clicking)

**Impact:**
- Delays album delivery by 1–2 days
- Frustrates photographers
- Limits studio capacity

---

## SOLUTION OVERVIEW

Selectly = Two integrated products:

### Product 1: Selectly Web
**What:** Browser-based selection platform  
**Users:** Studio editors, photographers, clients  
**Purpose:** Upload previews → Clients select → Download structured selection file

### Product 2: Selectly Desktop
**What:** Desktop application (Python/Electron)  
**Users:** Studio editors, photographers  
**Purpose:** Read selection file → Match to originals → Auto-create folder

---

## TARGET MARKET

**Primary Users:**
- Wedding photographers
- Photography studio owners
- Album editors/designers

**Studio Size:** 1–10 employees

**Geographic:** Indian wedding photography studios  
**Phase 1 Launch:** Bengaluru  
**Phase 2 Expansion:** All Indian cities

**Why India?**
- High wedding photography volume
- Heavy reliance on manual processes
- Willing to adopt tools that save time
- Desktop + Web combo solves actual pain

---

## PRODUCT SCOPE: V1

### What We Build

✅ User authentication (signup/login)  
✅ Project management (create, list, manage)  
✅ Image upload (folder upload, auto-filter videos)  
✅ Client selection interface (gallery + swipe modes)  
✅ selection.txt export  
✅ Desktop app (folder creation, file matching)  
✅ Dark/Light mode toggle  
✅ Supabase backend (auth, database, storage)  

### What We Don't Build (V2+)

❌ Cloud storage for original images  
❌ Team permissions / multi-user  
❌ Comments or collaboration  
❌ WhatsApp automation  
❌ Payment system  
❌ CRM features  
❌ Analytics / activity tracking  
❌ Album cover selection  
❌ Advanced export formats  

---

## EXACT WORKFLOWS

### WORKFLOW 1: Studio Editor (Web App)

1. **Sign up**
   - Email
   - Password
   - Studio Name
   - Submit

2. **Log in**
   - Email
   - Password
   - Redirect to Dashboard

3. **Dashboard**
   - See all projects
   - See project counts (Drafts, Uploading, Selecting, Completed)
   - See last 10 projects

4. **Create new project**
   - Client Name [required]
   - Event Date [required, date picker]
   - Target Count [required, number]
   - Minimum Count [required, auto-calculated as 80% of target]
   - Maximum Count [required, auto-calculated as 120% of target]
   - Example: Target 150 → Min 120, Max 180
   - Submit → Project created in DRAFT status

5. **Upload preview images**
   - Click "Upload Images" on Draft project
   - Drag-drop a folder with 150–500 images
   - System processes:
     - Accepts: JPG, PNG, WebP, HEIC, BMP, GIF, TIFF
     - Rejects: MP4, MOV, AVI, PDF, DOCX, etc.
     - Auto-resizes to 1200px width (~300KB each)
     - Shows: "✓ 287 images accepted, ✗ 3 videos rejected"
   - User confirms upload
   - Progress bar: "Uploading... 156/287"
   - Once done: Status → "UPLOADED"
   - System stores: Preview image + original filename

6. **Generate client link**
   - System creates unique link: `selectly.com/select/abc123xyz`
   - Editor copies and sends to client
   - Link never expires, reusable

7. **Monitor progress**
   - Dashboard shows: "Waiting for client..."
   - Shows real-time: Selected / Rejected / Skipped counts
   - Shows: Last active time

8. **Download selection**
   - Once client submits, button appears: "Download Selection"
   - File: selection.txt (plain text, human-readable)

---

### WORKFLOW 2: Client (Web App)

1. **Open link**
   - Clicks `selectly.com/select/abc123xyz`
   - No login required
   - Lands on selection interface

2. **See project**
   ```
   [Studio Logo/Name]
   Project: Akash Wedding
   
   Selected: 0 / 150
   Allowed: 120–180
   
   [Start Selecting]
   ```

3. **Gallery view (default)**
   - 4-column grid (desktop), 2-column (mobile)
   - Shows all 287 preview images
   - Click any image → Full-screen swipe view

4. **Swipe view (full-screen)**
   ```
   [Large centered image]
   
   Swipe Left → Reject (No)
   Swipe Right → Select (Yes)
   Swipe Up-Right → Highlight (Must-have)
   
   [Previous] [Next] buttons (top)
   
   Progress: 45 / 287
   Selected: 25 | Rejected: 15 | Skipped: 5
   ```

5. **Selection states**
   - Each image: ONE state only
   - States: Selected (Yes) / Rejected (No) / Skipped (Maybe)
   - Can undo last action

6. **Progress tracking**
   - Always visible at bottom
   - Shows: Selected count, Target, Allowed range
   - Smart feedback:
     - "Only 10 more needed"
     - "Target reached!"
     - "Too many selected (10 over limit)"

7. **Before submission**
   - Review screen shows:
     - Selected: 143
     - Highlighted: 35
     - Rejected: 89
     - Skipped: 20
   - **Submit button DISABLED if Skipped > 0**
   - Must resolve all "Skipped" to Yes/No
   - Confirmation: "You're about to lock this selection. Sure?"

8. **Submit**
   - Click "Submit Selection"
   - Selection locked (cannot edit)
   - Shows: "Thank you! Your selection is submitted."
   - Client redirected to thank-you page

---

### WORKFLOW 3: Studio Editor (Desktop App)

1. **Launch Selectly Desktop**

2. **Load selection.txt**
   - Drag-drop file
   - Or browse: File → Open selection.txt

3. **Point to original images**
   - Drag-drop folder with originals (IMG_001.jpg, IMG_002.jpg, etc.)
   - Or browse: Select Folder

4. **Process**
   - App reads selection.txt
   - Loops through each IMG filename
   - Searches original folder for exact match
   - Copies matched files to output folder

5. **Creates output structure**
   ```
   Akash Wedding - Selected/
   ├── Highlighted/
   │   ├── IMG_001.jpg
   │   ├── IMG_025.jpg
   │   └── ...35 highlighted
   │
   ├── IMG_002.jpg
   ├── IMG_012.jpg
   └── ...143 selected (non-highlighted)
   
   [Plus selection.txt for editor reference]
   ```

6. **Shows result**
   ```
   Processing Complete ✓
   
   Images in selection: 143
   Images found in folder: 143
   Images copied: 143
   Images missing: 0
   
   Output folder: Akash Wedding - Selected
   Location: /Users/studio/Desktop/...
   
   [Open Folder] [Done]
   ```

7. **Done**
   - Folder ready for designer
   - Editor manually adds any missing files if needed

---

## DATA MODELS

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  studio_name VARCHAR NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  client_name VARCHAR NOT NULL,
  event_date DATE,
  target_count INT,
  min_count INT,
  max_count INT,
  status VARCHAR ('draft' | 'uploaded' | 'selecting' | 'submitted' | 'completed'),
  link_token VARCHAR UNIQUE,
  total_images INT,
  created_at TIMESTAMP,
  submitted_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Images Table

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY,
  project_id UUID FOREIGN KEY,
  filename VARCHAR NOT NULL,
  preview_url VARCHAR,
  storage_path VARCHAR,
  created_at TIMESTAMP
);
```

### Selections Table

```sql
CREATE TABLE selections (
  id UUID PRIMARY KEY,
  project_id UUID FOREIGN KEY,
  selected JSONB (array of filenames),
  highlighted JSONB (array of filenames),
  rejected JSONB (array of filenames),
  skipped JSONB (array of filenames),
  submitted_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## IMAGE UPLOAD SPECIFICATION

### Upload Process

1. User selects folder with 150–500 images
2. System validates each file:
   - **Accept:** JPG, JPEG, PNG, WebP, HEIC, BMP, GIF, TIFF
   - **Reject:** MP4, MOV, AVI, MP3, PDF, DOCX, ZIP, etc.
3. Shows breakdown: "✓ 287 images accepted | ✗ 3 videos rejected (list them)"
4. User confirms
5. System auto-resizes to 1200px width (quality 80)
6. Stores in Supabase Storage: `/projects/{project_id}/{filename}`
7. Stores metadata in Images table: filename + preview_url
8. Shows progress bar during upload
9. Once complete: Status → "UPLOADED", Total images: 287

### Storage Costs

- Preview size: ~300KB per image
- 287 images = 86MB per event
- 10 events/month = 860MB = ~$5/month (Supabase Storage)
- Cost-effective. No budget constraints.

---

## CLIENT SELECTION INTERFACE

### Gallery View

- Grid layout: 4 columns (desktop), 2 (mobile)
- Fast scrolling
- Shows preview images
- Click → Opens swipe view

### Swipe View

**Actions:**
- Swipe Left → Reject (No)
- Swipe Right → Select (Yes)
- Swipe Up-Right → Highlight (Star)
- Tap [Previous] / [Next] buttons for accessibility

**Visual feedback:**
- Left swipe: Image fades red, "Rejected"
- Right swipe: Image fades green, "Selected"
- Up-right swipe: Gold star appears, "Highlighted"

**Keyboard shortcuts (optional):**
- L = Left (Reject)
- R = Right (Select)
- H = Highlight
- U = Undo
- Arrow keys = Next/Previous

### Progress Display

**Always visible (bottom of screen):**
```
Selected: 45 | Rejected: 89 | Skipped: 10
Target: 150 | Allowed: 120–180
Progress: 144 / 287 photos reviewed

Status: "Only 10 more photos needed!"
```

### Submit Logic

**Submit button is DISABLED if:**
- Skipped count > 0
- Selected < Minimum
- Selected > Maximum

**Submit button is ENABLED if:**
- Skipped = 0 (all photos decided)
- Selected >= Minimum AND <= Maximum

**User sees warning if disabled:**
```
⚠️ Cannot submit yet

Reason: You have 12 photos marked as "Maybe"
Go back and mark them as Yes or No.

Minimum needed: 120
Maximum allowed: 180
Current selection: 145 (OK!)

[Go Back]
```

---

## selection.txt FORMAT (EXACT)

**Generated after client submits.**

**Format:**
```
PROJECT: Akash Wedding
CLIENT: Akash & Priya
EVENT DATE: 2026-06-15
UPLOADED: 287 images
SELECTED: 143 images
HIGHLIGHTED: 35 images

HIGHLIGHTED PHOTOS:
IMG_001.jpg
IMG_025.jpg
IMG_089.jpg
IMG_102.jpg
[...all highlighted photos, one per line]

SELECTED PHOTOS:
IMG_002.jpg
IMG_012.jpg
IMG_045.jpg
IMG_078.jpg
IMG_120.jpg
[...all selected photos (excluding highlighted), one per line]
```

**Why .txt?**
- Human-readable (editor can verify matches)
- Can open in any text editor
- Lightweight
- Future-proof
- Desktop app can parse easily

---

## AUTHENTICATION

### Sign up

Fields:
- Email [required, unique]
- Password [required, min 8 chars]
- Studio Name [required]
- Checkbox: "I agree to terms"

Validation:
- Email format valid
- Password strength (at least 1 uppercase, 1 number)
- Studio name not empty

On success:
- User created in Supabase
- Auto-login
- Redirect to Dashboard

### Login

Fields:
- Email [required]
- Password [required]

On success:
- Redirect to Dashboard
- Session persists (remember user)

On failure:
- Show error: "Invalid email or password"

### Logout

- Click "Logout" in header
- Clear session
- Redirect to login

---

## DARK MODE / LIGHT MODE

**Toggle in header (top-right):**
- Sun icon = Light mode
- Moon icon = Dark mode
- Toggle switches instantly
- Preference saved to localStorage

**Color scheme:**
- **Light mode:** White background, dark text, blue accents
- **Dark mode:** Dark gray/black background, light text, blue accents

**Apply to:** All pages (auth, dashboard, upload, client interface)

---

## TECH STACK

### Frontend
- **Framework:** Next.js 14+
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Dark mode:** next-themes
- **Icons:** lucide-react
- **Form handling:** React Hook Form + Zod
- **HTTP client:** Axios or Fetch
- **Image optimization:** Next Image

### Backend / Database
- **Auth:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **File storage:** Supabase Storage (S3-compatible)
- **Real-time updates:** Supabase Realtime (optional)

### Desktop App (Future)
- **Framework:** Python with PyQt or Electron
- **File operations:** OS native file system
- **Parsing:** Simple string parsing for selection.txt

---

## DEVELOPMENT PHASES

### Phase 1: Admin UI (Web App)
- [ ] Next.js setup with Tailwind + shadcn/ui
- [ ] Auth (sign up / login / logout)
- [ ] Supabase integration (auth + database)
- [ ] Dashboard (project list)
- [ ] Create project form
- [ ] Image upload (folder, filter, resize)
- [ ] Project status tracking
- [ ] Download selection.txt button
- [ ] Dark/Light mode toggle

### Phase 2: Client UI (Web App)
- [ ] Shareable link generation
- [ ] Client landing page
- [ ] Gallery view (grid layout)
- [ ] Swipe view (full-screen)
- [ ] Selection states management
- [ ] Progress display
- [ ] Submit button logic (Maybe = 0 enforcement)
- [ ] Review screen
- [ ] Submission confirmation
- [ ] Undo functionality (optional)

### Phase 3: Backend Infrastructure
- [ ] Supabase tables (users, projects, images, selections)
- [ ] Real-time updates (client side)
- [ ] Secure API endpoints
- [ ] File upload handling
- [ ] Image resizing pipeline
- [ ] Error handling + logging

### Phase 4: Desktop App
- [ ] Python/Electron setup
- [ ] UI for file selection
- [ ] selection.txt parser
- [ ] File matching algorithm
- [ ] Folder creation
- [ ] Progress reporting
- [ ] Error handling (missing files, etc.)

---

## SUCCESS CRITERIA

### V1 Launch
- Admin can upload 500 images in < 5 minutes
- Client selection < 15 minutes for 150 images
- Folder creation: 30 seconds (desktop app)
- Zero manual file searching by studio
- Zero missing files in output

### Long-term
- 100+ active studios
- 1000+ completed projects
- 95% on-time album delivery
- NPS > 40

---

## SECURITY & PRIVACY

**Data Storage:**
- All user data in Supabase (encrypted at rest)
- Images stored in Supabase Storage (private by default)
- Client links expire after 30 days (optional)

**Authentication:**
- Passwords hashed with bcrypt
- JWT tokens for session management
- HTTPS only

**Privacy:**
- No tracking / analytics in V1
- No third-party integrations
- Data not shared with anyone

---

## CONSTRAINTS & ASSUMPTIONS

- Preview filenames must match original filenames exactly (IMG_001.jpg)
- Clients have reliable internet (for web access)
- Studio has local originals (not cloud-dependent for now)
- Desktop app runs on studio's computer (Windows/Mac)
- English UI (V1)
- Single studio per account (V1, multi-team in V2)

---

## DEPLOYMENT

**Frontend:** Vercel (automatic from GitHub)
**Backend:** Supabase (managed)
**Desktop App:** GitHub releases (downloadable installers)

---

## TIMELINE ESTIMATE

- Phase 1 (Admin UI): 3–4 weeks
- Phase 2 (Client UI): 2–3 weeks
- Phase 3 (Backend): 2 weeks (parallel with Phases 1–2)
- Phase 4 (Desktop App): 2–3 weeks

**MVP Launch:** 8–10 weeks

---

**This specification is complete and ready for development.**

**No ambiguity. No scope creep. Build it.**
