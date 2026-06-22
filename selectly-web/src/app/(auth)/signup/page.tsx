import { AuthCard } from "@/features/auth/components/auth-card"
import { SignupForm } from "@/features/auth/components/signup-form"

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
