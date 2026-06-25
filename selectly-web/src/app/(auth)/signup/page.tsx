import type { Metadata } from "next"
import { AuthCard } from "@/features/auth/components/auth-card"
import { SignupForm } from "@/features/auth/components/signup-form"

export const metadata: Metadata = {
  title: "Create your studio",
  description: "Sign up for Selixo and start managing your photo projects",
}

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your studio"
      description="Start building your projects"
    >
      <SignupForm />
    </AuthCard>
  )
}
