import type { Metadata } from "next"
import { AuthCard } from "@/features/auth/components/auth-card"
import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Selixo account password.",
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
