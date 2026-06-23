import type { Metadata } from "next"
import { AuthCard } from "@/features/auth/components/auth-card"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Selectly studio account",
}

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to Selectly"
    >
      <LoginForm />
    </AuthCard>
  )
}
