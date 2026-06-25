import { Card, CardContent } from "@/components/ui/card"

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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
