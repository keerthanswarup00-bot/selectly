"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectStats } from "@/features/projects/hooks/use-projects"

interface StatsCardsProps {
  studioId: string
}

export function StatsCards({ studioId }: StatsCardsProps) {
  const { data: stats, isLoading } = useProjectStats(studioId)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const items = [
    { label: "Draft", value: stats?.draft ?? 0 },
    { label: "Uploading", value: stats?.uploading ?? 0 },
    { label: "Selecting", value: stats?.selecting ?? 0 },
    { label: "Completed", value: stats?.completed ?? 0 },
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
