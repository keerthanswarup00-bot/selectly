"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, ArrowRight, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingData {
  studio_name: string | null
  client_name: string
  event_date: string | null
  welcome_message: string | null
  logo_url: string | null
  primary_color: string
  accent_color: string
  cover_image: string | null
}

export default function ClientLandingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [data, setData] = useState<LandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLanding() {
      try {
        const res = await fetch(`/api/select/${token}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Project not found")
        }
        const project = await res.json()

        let branding = { primary_color: "#000000", accent_color: "#f59e0b", logo_url: null, welcome_message: null }
        try {
          const brandingRes = await fetch(`/api/select/${token}/branding`)
          if (brandingRes.ok) {
            branding = await brandingRes.json()
          }
        } catch {}

        setData({
          studio_name: project.studio_name,
          client_name: project.client_name,
          event_date: project.event_date,
          welcome_message: branding.welcome_message,
          logo_url: branding.logo_url,
          primary_color: branding.primary_color,
          accent_color: branding.accent_color,
          cover_image: project.cover_image_path ?? null,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }
    fetchLanding()
  }, [token])

  const handleStart = () => {
    router.push(`/share/${token}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Gallery Not Available</h1>
          <p className="text-muted-foreground mt-2">{error ?? "This link may be invalid or expired."}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: data.primary_color + "08" }}
    >
      <div className="w-full max-w-lg space-y-8 text-center">
        {data.logo_url && (
          <div className="mx-auto flex items-center justify-center">
            <img
              src={data.logo_url}
              alt={data.studio_name ?? "Studio logo"}
              className="h-20 w-auto object-contain"
            />
          </div>
        )}

        {!data.logo_url && data.studio_name && (
          <div className="mx-auto flex items-center justify-center gap-2">
            <Camera className="h-6 w-6" style={{ color: data.accent_color }} />
            <span className="text-lg font-medium">{data.studio_name}</span>
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {data.client_name}&apos;s Gallery
          </h1>
          {data.event_date && (
            <p className="text-muted-foreground">
              {new Date(data.event_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        {data.welcome_message && (
          <div
            className="rounded-lg p-4 text-sm"
            style={{ background: data.accent_color + "15", color: data.primary_color }}
          >
            {data.welcome_message}
          </div>
        )}

        <Button
          onClick={handleStart}
          size="lg"
          className="gap-2 px-8"
          style={{
            background: data.accent_color,
            color: "#fff",
          }}
        >
          Start Viewing <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          Powered by Selixo
        </p>
      </div>
    </div>
  )
}
