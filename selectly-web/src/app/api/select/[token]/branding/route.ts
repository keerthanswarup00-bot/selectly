import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { retryableRequest } from "@/lib/retry"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const supabase = await createServerClient()

    const { data: project, error: projectError } = await retryableRequest(
      async () =>
        supabase
          .from("projects")
          .select("studio_id")
          .eq("link_token", token)
          .single(),
    )

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      )
    }

    const { data: branding } = await retryableRequest(
      async () =>
        supabase
          .from("studio_branding")
          .select("logo_url, primary_color, accent_color, welcome_message")
          .eq("studio_id", project.studio_id)
          .single(),
    )

    return NextResponse.json({
      logo_url: branding?.logo_url ?? null,
      primary_color: branding?.primary_color ?? "#000000",
      accent_color: branding?.accent_color ?? "#f59e0b",
      welcome_message: branding?.welcome_message ?? null,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
