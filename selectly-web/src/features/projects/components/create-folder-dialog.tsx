"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { createFolder } from "@/features/folders/actions/folder-actions"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  selectionType: z.enum(["no_limit", "minimum", "range"]),
  minCount: z.coerce.number().int().min(0).default(0),
  maxCount: z.coerce.number().int().min(0).default(0),
})

type FormValues = z.infer<typeof formSchema>

interface CreateFolderDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFolderDialog({ projectId, open, onOpenChange }: CreateFolderDialogProps) {
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      selectionType: "no_limit",
      minCount: 0,
      maxCount: 0,
    },
  })

  const selectionType = watch("selectionType")

  async function onSubmit(data: FormValues) {
    setIsPending(true)

    const formData = new FormData()
    formData.append("projectId", projectId)
    formData.append("name", data.name)
    if (data.description) formData.append("description", data.description)
    formData.append("selectionType", data.selectionType)
    formData.append("minCount", String(data.minCount))
    formData.append("maxCount", String(data.maxCount))

    const result = await createFolder(formData)

    if (result.success) {
      toast({ title: "Folder created" })
      reset()
      onOpenChange(false)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }

    setIsPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize images and set selection rules for clients.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g., Wedding Ceremony" autoFocus />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" {...register("description")} placeholder="What's in this folder?" rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Selection Type</Label>
            <RadioGroup
              value={selectionType}
              onValueChange={(v) => setValue("selectionType", v as FormValues["selectionType"])}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                <RadioGroupItem value="no_limit" id="no_limit" />
                <Label htmlFor="no_limit" className="cursor-pointer font-normal">
                  <span className="font-medium">No Limit</span>
                  <p className="text-xs text-muted-foreground">Clients can select any number of images</p>
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                <RadioGroupItem value="minimum" id="minimum" />
                <Label htmlFor="minimum" className="cursor-pointer font-normal">
                  <span className="font-medium">Minimum</span>
                  <p className="text-xs text-muted-foreground">Clients must select at least a certain number</p>
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="cursor-pointer font-normal">
                  <span className="font-medium">Range</span>
                  <p className="text-xs text-muted-foreground">Clients must select between min and max</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {selectionType === "minimum" && (
            <div className="space-y-2">
              <Label htmlFor="minCount">Minimum Selection</Label>
              <Input id="minCount" type="number" min={1} {...register("minCount")} />
            </div>
          )}

          {selectionType === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minCount">Min</Label>
                <Input id="minCount" type="number" min={0} {...register("minCount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCount">Max</Label>
                <Input id="maxCount" type="number" min={1} {...register("maxCount")} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Folder"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
