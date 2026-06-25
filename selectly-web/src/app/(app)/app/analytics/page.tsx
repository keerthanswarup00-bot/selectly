"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AnalyticsCards } from "@/features/analytics/components/analytics-cards"
import { ActivityTimeline, type ActivityItem } from "@/features/activity/components/activity-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { BarChart3, Activity } from "lucide-react"

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    totalImages: 0,
    selectionsSubmitted: 0,
    pendingReviews: 0,
    recentActivity: 0,
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])

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

      const { data: projects } = await supabase
        .from("projects")
        .select("id, status, total_images")
        .eq("studio_id", profile.studio_id)
        .is("deleted_at", null)

      if (projects) {
        const projIds = projects.map((p) => p.id)
        const totalImages = projects.reduce((sum, p) => sum + (p.total_images ?? 0), 0)
        const { count: selectionsCount } = await supabase
          .from("selections")
          .select("id", { count: "exact", head: true })
          .in("project_id", projIds)

        setAnalytics({
          totalProjects: projects.length,
          totalImages,
          selectionsSubmitted: selectionsCount ?? 0,
          pendingReviews: projects.filter((p) => p.status === "submitted").length,
          recentActivity: 0,
        })
      }

      const { data: activityData } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("studio_id", profile.studio_id)
        .order("created_at", { ascending: false })
        .limit(20)

      setActivities((activityData ?? []) as ActivityItem[])
      setIsLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your studio&apos;s performance
        </p>
      </div>

      <AnalyticsCards data={analytics} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && activities.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-8 w-8" />}
              title="No Activity Yet"
              description="Activity will appear here as you use Selixo."
              className="border-0 min-h-[200px]"
            />
          ) : (
            <ActivityTimeline activities={activities} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
