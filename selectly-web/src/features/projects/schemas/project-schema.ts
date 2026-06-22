import { z } from "zod"

export const createProjectSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(200),
  eventDate: z.string().min(1, "Event date is required"),
  targetCount: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(9999, "Must be under 10,000"),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
