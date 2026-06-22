"use client"

import { LogOut, Menu, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils/cn"

interface DashboardHeaderProps {
  studioName: string
  onMenuToggle?: () => void
  className?: string
}

export function DashboardHeader({
  studioName,
  onMenuToggle,
  className,
}: DashboardHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6",
        className,
      )}
    >
      {onMenuToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex items-center gap-2 font-semibold">
        <Camera className="h-5 w-5 text-primary" />
        <span>Selectly</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline-block">
          {studioName}
        </span>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
