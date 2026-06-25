"use client"

import { cn } from "@/lib/utils/cn"

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercent?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  color?: "default" | "success" | "warning" | "danger"
}

export function ProgressBar({
  value,
  max,
  label,
  showPercent = false,
  className,
  size = "md",
  color = "default",
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0

  const sizeClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }

  const colorClass = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercent && (
            <span className="font-medium">
              {value} / {max} ({Math.round(percent)}%)
            </span>
          )}
        </div>
      )}
      <div
        className={cn("w-full overflow-hidden rounded-full bg-muted", sizeClass[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Progress"}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClass[color],
            color === "default" && percent >= 100 && "bg-green-500",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
