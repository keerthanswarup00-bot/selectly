"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface SubscriptionInfo {
  plan: {
    name: string
    code: string
    max_projects: number
    max_images_per_project: number
    max_storage_gb: number
    features: Record<string, boolean>
  }
  status: string
  trialEnd: string | null
}

export function useSubscription(studioId?: string) {
  return useQuery({
    queryKey: ["subscription", studioId],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      if (!studioId) return null
      const supabase = createClient()

      const { data: sub, error: subError } = await supabase
        .from("studio_subscriptions")
        .select("status, trial_end, plan_id")
        .eq("studio_id", studioId)
        .single()

      if (subError || !sub) return null

      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("name, code, max_projects, max_images_per_project, max_storage_gb, features")
        .eq("id", sub.plan_id)
        .single()

      if (!plan) return null

      return {
        plan: {
          name: plan.name,
          code: plan.code,
          max_projects: plan.max_projects,
          max_images_per_project: plan.max_images_per_project,
          max_storage_gb: plan.max_storage_gb,
          features: plan.features as Record<string, boolean>,
        },
        status: sub.status,
        trialEnd: sub.trial_end,
      }
    },
    enabled: !!studioId,
  })
}

export function useFeatureGate(studioId?: string) {
  const { data: subscription } = useSubscription(studioId)

  return {
    canAccess: (feature: string): boolean => {
      if (!subscription) return false
      return subscription.plan.features[feature] ?? false
    },
    hasReachedProjectLimit: (currentCount: number): boolean => {
      if (!subscription) return true
      if (subscription.plan.max_projects === -1) return false
      return currentCount >= subscription.plan.max_projects
    },
    hasReachedImageLimit: (currentCount: number): boolean => {
      if (!subscription) return true
      if (subscription.plan.max_images_per_project === -1) return false
      return currentCount >= subscription.plan.max_images_per_project
    },
    plan: subscription?.plan ?? null,
    status: subscription?.status ?? null,
  }
}
