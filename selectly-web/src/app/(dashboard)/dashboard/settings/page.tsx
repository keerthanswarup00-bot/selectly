"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoading } from "@/components/shared/loading-spinner"

export default function SettingsPage() {
  const [studioName, setStudioName] = useState("")

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_id")
        .eq("id", user.id)
        .single()
      if (!profile) return
      const { data: studio } = await supabase
        .from("studios")
        .select("name")
        .eq("id", profile.studio_id)
        .single()
      if (studio) setStudioName(studio.name)
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your studio settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Studio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {studioName || "Loading..."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
