"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandingForm } from "@/features/branding/components/branding-form"
import { BrandingPreview } from "@/features/branding/components/branding-preview"
import { PageLoading } from "@/components/shared/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const [studioId, setStudioId] = useState("")
  const [studioName, setStudioName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_id")
        .eq("id", user.id)
        .single<{ studio_id: string }>()
      if (!profile) return
      setStudioId(profile.studio_id)
      const { data: studio } = await supabase
        .from("studios")
        .select("name")
        .eq("id", profile.studio_id)
        .single<{ name: string }>()
      if (studio) setStudioName(studio.name)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return <PageLoading />

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your studio settings and branding
        </p>
      </div>

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Studio Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studioName">Studio Name</Label>
                <Input id="studioName" value={studioName} disabled />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your studio name.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You are currently on the Free plan.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <BrandingForm studioId={studioId} />
            <div className="space-y-4">
              <div className="sticky top-20">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                  Preview
                </h3>
                <BrandingPreview
                  primaryColor="#000000"
                  secondaryColor="#ffffff"
                  accentColor="#f59e0b"
                  logoUrl={null}
                  welcomeMessage={null}
                  studioName={studioName}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
