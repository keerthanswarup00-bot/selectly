import { format, formatDistanceToNow, parseISO } from "date-fns"

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d, yyyy")
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d, yyyy h:mm a")
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatEventDate(date: string): string {
  return format(parseISO(date), "MMMM d, yyyy")
}

export function toInputDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}
