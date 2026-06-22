"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      clientName: "",
      eventDate: "",
      targetCount: undefined,
    },
  })

  const targetCount = watch("targetCount")
  const minCount = targetCount ? Math.round(targetCount * 0.8) : null
  const maxCount = targetCount ? Math.round(targetCount * 1.2) : null

  async function onSubmit(data: FormValues) {
    setIsPending(true)

    const formData = new FormData()
    formData.append("clientName", data.clientName)
    formData.append("eventDate", data.eventDate)
    formData.append("targetCount", String(data.targetCount))

    const result = await createProject(formData)

    if (result.success) {
      toast({ title: "Project created", description: "Redirecting to project..." })
      router.push(`/dashboard/project/${result.data.id}`)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clientName">Client Name</Label>
        <Input id="clientName" {...register("clientName")} placeholder="Client name" />
        {errors.clientName && (
          <p className="text-sm text-destructive">{errors.clientName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Event Date</Label>
        <Input id="eventDate" type="date" {...register("eventDate")} />
        {errors.eventDate && (
          <p className="text-sm text-destructive">{errors.eventDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetCount">Target Count</Label>
        <Input
          id="targetCount"
          type="number"
          min={1}
          max={9999}
          {...register("targetCount")}
          placeholder="Number of images needed"
        />
        {errors.targetCount && (
          <p className="text-sm text-destructive">{errors.targetCount.message}</p>
        )}
        {minCount !== null && maxCount !== null && (
          <p className="text-sm text-muted-foreground">
            Range: {minCount} – {maxCount} images
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating..." : "Create Project"}
      </Button>
    </form>
  )
}
