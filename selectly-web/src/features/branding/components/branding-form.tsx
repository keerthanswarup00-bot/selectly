"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const brandingSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
  font_choice: z.string().min(1),
  welcome_message: z.string().max(500).optional(),
})

type BrandingFormValues = z.infer<typeof brandingSchema>

export function BrandingForm({ studioId }: { studioId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primary_color: "#000000",
      secondary_color: "#ffffff",
      accent_color: "#f59e0b",
      font_choice: "inter",
      welcome_message: "",
    },
  })

  useEffect(() => {
    async function loadBranding() {
      const supabase = createClient()
      const { data: raw } = await supabase
        .from("studio_branding")
        .select("*")
        .eq("studio_id", studioId)
        .single()
      const data = raw as {
        primary_color: string
        secondary_color: string
        accent_color: string
        font_choice: string
        welcome_message: string | null
        logo_url: string | null
      } | null
      if (data) {
        reset({
          primary_color: data.primary_color ?? "#000000",
          secondary_color: data.secondary_color ?? "#ffffff",
          accent_color: data.accent_color ?? "#f59e0b",
          font_choice: data.font_choice ?? "inter",
          welcome_message: data.welcome_message ?? "",
        })
        setLogoUrl(data.logo_url)
      }
      setIsLoading(false)
    }
    loadBranding()
  }, [studioId, reset])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const path = `${studioId}/branding/logo.${file.name.split(".").pop()}`
      const { error: uploadError } = await supabase.storage
        .from("previews")
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = await supabase.storage
        .from("previews")
        .createSignedUrl(path, 60 * 60 * 24 * 365)

      if (urlData?.signedUrl) {
        setLogoUrl(urlData.signedUrl)
        toast({ title: "Logo uploaded" })
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  async function onSubmit(data: BrandingFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("studio_branding")
        .upsert({
          studio_id: studioId,
          logo_url: logoUrl,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
          font_choice: data.font_choice,
          welcome_message: data.welcome_message ?? null,
        })

      if (error) throw error
      toast({ title: "Branding saved" })
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save branding",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                <img
                  src={logoUrl}
                  alt="Studio logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="logo">Upload Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />
            {uploadingLogo && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                className="w-12 p-1"
                {...register("primary_color")}
              />
              <Input {...register("primary_color")} placeholder="#000000" />
            </div>
            {errors.primary_color && (
              <p className="text-sm text-destructive">{errors.primary_color.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                className="w-12 p-1"
                {...register("secondary_color")}
              />
              <Input {...register("secondary_color")} placeholder="#ffffff" />
            </div>
            {errors.secondary_color && (
              <p className="text-sm text-destructive">{errors.secondary_color.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                type="color"
                className="w-12 p-1"
                {...register("accent_color")}
              />
              <Input {...register("accent_color")} placeholder="#f59e0b" />
            </div>
            {errors.accent_color && (
              <p className="text-sm text-destructive">{errors.accent_color.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font_choice">Font</Label>
            <select
              id="font_choice"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("font_choice")}
            >
              <option value="inter">Inter</option>
              <option value="georgia">Georgia</option>
              <option value="arial">Arial</option>
              <option value="times">Times New Roman</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome_message">Welcome Message</Label>
            <Textarea
              id="welcome_message"
              {...register("welcome_message")}
              placeholder="Welcome to our proofing gallery!"
              rows={3}
            />
            {errors.welcome_message && (
              <p className="text-sm text-destructive">{errors.welcome_message.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Branding"}
      </Button>
    </form>
  )
}
