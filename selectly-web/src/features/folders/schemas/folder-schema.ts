import { z } from "zod"

export const createFolderSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Folder name is required").max(200),
  description: z.string().optional(),
  selectionType: z.enum(["no_limit", "minimum", "range"]),
  minCount: z.coerce.number().int().min(0).default(0),
  maxCount: z.coerce.number().int().min(0).default(0),
})

export const updateFolderSchema = z.object({
  folderId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  selectionType: z.enum(["no_limit", "minimum", "range"]).optional(),
  minCount: z.coerce.number().int().min(0).optional(),
  maxCount: z.coerce.number().int().min(0).optional(),
  status: z.enum(["draft", "uploading", "ready", "shared", "viewing", "in_progress", "submitted", "approved", "archived"]).optional(),
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
