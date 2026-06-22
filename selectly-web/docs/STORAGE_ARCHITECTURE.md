# Storage Architecture

## Overview

Selectly uses **Supabase Storage** (backed by S3) for all image file storage. The database only stores metadata — the actual bytes live in object storage.

---

## Bucket Structure

### Single Bucket: `previews`

A single bucket holds all project images across all studios. Isolation is achieved via folder paths and RLS policies.

```
previews/
├── <studio-uuid-1>/
│   ├── <project-uuid-a>/
│   │   ├── img_001.jpg
│   │   ├── img_002.jpg
│   │   └── DSC_1234.png
│   └── <project-uuid-b>/
│       └── wedding_001.heic
├── <studio-uuid-2>/
│   └── <project-uuid-c>/
│       └── portrait_001.webp
└── ...
```

### Path Pattern

```
{studio_id}/{project_id}/{filename}
```

Each segment is named with its respective UUID (or original filename for the file itself). This ensures:

- **Global uniqueness**: Two studios can never collide
- **RLS-friendly**: The first folder segment is the `studio_id`, which RLS checks against `auth.get_studio_id()`
- **Listable**: Listing `studio-uuid/project-uuid/` returns all images for a project
- **Portable**: Moving files between projects is just a rename operation

---

## Access Control

### Authenticated Studio Users

All CRUD operations go through Supabase Storage RLS. The policy checks:

```sql
(storage.foldername(name))[1] = auth.get_studio_id()::text
```

This means:
- A user from Studio A **cannot** list, read, write, or delete files in Studio B's folder
- The check is at the storage layer — even if a user guesses a path, they can't access it
- Operations are scoped to the `previews` bucket only

### Client Selection View

Clients accessing via `link_token` need to view images without authentication. The approach:

1. Generate **signed URLs** server-side when the client view loads
2. Signed URLs are time-limited (e.g. 24 hours) and specific to each file
3. The URL generation happens in a server action protected by the `link_token`

```typescript
// Server action for generating signed URLs
async function getImageUrls(linkToken: string) {
  const { project } = await validateLinkToken(linkToken);
  const images = await getProjectImages(project.id);

  return Promise.all(
    images.map(img =>
      supabase.storage
        .from('previews')
        .createSignedUrl(img.storage_path, 86400) // 24 hours
    )
  );
}
```

---

## CDN Strategy

Supabase Storage automatically serves files through a CDN (backed by S3 + CloudFront). Key points:

| Aspect | Detail |
|--------|--------|
| **Cache** | Files are cached at edge locations (TTL controlled by Cache-Control header) |
| **Transformation** | Supabase Storage supports image transformations via URL parameters |
| **Signed URLs** | Generated URLs bypass CDN cache (must be considered for performance) |
| **Regional** | Data is stored in the region you selected when creating the Supabase project |

### Image Transformations

Supabase supports on-the-fly image transformations via query parameters:

```
https://<project>.supabase.co/storage/v1/render/image/public/previews/studio-uuid/project-uuid/img.jpg?width=400&height=300&resize=cover
```

This is useful for:
- Generating thumbnails without storing duplicates
- Serving responsive images to clients
- Reducing bandwidth for the selection view

However, since our bucket is private (not public), we need to use signed URLs with transformation parameters:

```typescript
supabase.storage
  .from('previews')
  .createSignedUrl(storagePath, 86400, {
    transform: { width: 400, height: 300, resize: 'cover' },
  });
```

---

## Image Compression Flow

```
User uploads original (e.g. 24MP RAW → JPEG at 10MB)
  → Server receives buffer
  → Validate type and size
  → Option A: Upload original as-is (simpler, faster)
  → Option B: Compress with Sharp before upload (saves storage, slower upload)

  → Insert metadata in project_images
  → Generate thumbnails on-the-fly via Supabase transform (no extra storage)
```

**Recommendation:** For Phase 1, upload originals as-is. Compression can be added later when storage costs become significant. Supabase's on-the-fly transforms handle the responsive delivery.

---

## Cost Estimation

### Storage Costs (Supabase Pro)

| Item | Calculation | Monthly Cost |
|------|-------------|-------------|
| Database | Included in Pro ($25) | $25 |
| Storage | 100 GB included, then $0.021/GB | $0 |
| Bandwidth | 5 GB included, then $0.09/GB | $0 |
| Image transforms | 100 transforms included, then $5 per 1000 | $0 |

### At Scale (~100 GB images, ~500 GB bandwidth)

| Item | Cost |
|------|------|
| Database (Pro) | $25 |
| Extra storage (100-100=0 GB) | $0 |
| Extra bandwidth (500-5=495 GB) | $44.55 |
| Total | ~$70/month |

### Optimization Tips

- Use WebP format for uploads (smaller than JPEG at same quality)
- Enable Supabase's built-in compression on upload
- Set appropriate file size limits (50 MB per file)
- Clean up files when projects are deleted (storage lifecycle rules)
- Consider archival for completed projects (move to colder storage)

---

## Migration to Alternative Storage

If you outgrow Supabase Storage in the future, the abstraction layer makes migration straightforward:

1. The `storage_path` column in `project_images` is a string — it can point to any storage system
2. Image upload/download logic is encapsulated in `src/lib/actions/images.ts`
3. Signed URL generation is a single function to swap out

Potential alternatives:
- **AWS S3 directly** (more control, lower cost at scale)
- **Cloudflare R2** (no egress fees)
- **Google Cloud Storage** (if already in GCP)
