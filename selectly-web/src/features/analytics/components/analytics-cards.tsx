"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalyticsData {
  totalProjects: number
  totalImages: number
  selectionsSubmitted: number
  pendingReviews: number
  recentActivity: number
}

interface AnalyticsCardsProps {
  data?: AnalyticsData
  isLoading: boolean
}

export function AnalyticsCards({ data, isLoading }: AnalyticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const items = [
    { label: "Total Projects", value: data.totalProjects },
    { label: "Total Images", value: data.totalImages },
    { label: "Selections Submitted", value: data.selectionsSubmitted },
    { label: "Pending Reviews", value: data.pendingReviews },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
