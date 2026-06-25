import { z } from "zod"

export const createProjectSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(200),
  eventDate: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
