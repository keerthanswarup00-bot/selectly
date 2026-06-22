import Link from "next/link"
import { AuthCard } from "@/features/auth/components/auth-card"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Check your email"
      description="We sent you a verification link"
    >
      <div className="space-y-4 text-center text-sm text-muted-foreground">
        <p>
          Please check your email and click the verification link to activate
          your account.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthCard>
  )
}
