"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar"

interface DashboardShellProps {
  studioId: string
  studioName: string
  children: React.ReactNode
}

export function DashboardShell({
  studioId: _studioId,
  studioName,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          studioName={studioName}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
