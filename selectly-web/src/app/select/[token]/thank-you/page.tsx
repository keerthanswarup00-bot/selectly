"use client"

import { CheckCircle } from "lucide-react"

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Selection Submitted!</h1>
        <p className="text-muted-foreground text-lg">
          Thank you for selecting your photos. Your selections have been locked and cannot be changed.
        </p>
        <p className="text-sm text-muted-foreground">
          The studio will process your selections and deliver the album soon.
        </p>
      </div>
    </div>
  )
}
