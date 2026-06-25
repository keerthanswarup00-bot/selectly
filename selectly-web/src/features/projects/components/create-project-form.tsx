"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { createProjectSchema } from "@/features/projects/schemas/project-schema"
import { createProject } from "@/features/projects/actions/create-project"

type FormValues = z.infer<typeof createProjectSchema>

export function CreateProjectForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      clientName: "",
      eventDate: "",
      notes: "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsPending(true)

    const formData = new FormData()
    formData.append("clientName", data.clientName)
    if (data.eventDate) formData.append("eventDate", data.eventDate)
    if (data.notes) formData.append("notes", data.notes)

    const result = await createProject(formData)

    if (result.success) {
      toast({ title: "Project created" })
      router.push(`/app/project/${result.data.id}`)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clientName">Client Name</Label>
        <Input id="clientName" {...register("clientName")} placeholder="Client name" autoFocus />
        {errors.clientName && (
          <p className="text-sm text-destructive">{errors.clientName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Event Date (optional)</Label>
        <Input id="eventDate" type="date" {...register("eventDate")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Any notes about this project" rows={3} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating..." : "Create Project"}
      </Button>
    </form>
  )
}
