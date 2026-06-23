"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardsProps {
  stats: {
    draft: number
    uploading: number
    selecting: number
    completed: number
    total: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    { label: "Draft", value: stats.draft },
    { label: "Uploading", value: stats.uploading },
    { label: "Selecting", value: stats.selecting },
    { label: "Completed", value: stats.completed },
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
