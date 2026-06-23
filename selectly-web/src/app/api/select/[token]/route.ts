import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { retryableRequest } from "@/lib/retry"
import { unstable_cache } from "next/cache"

async function getProject(token: string) {
  const supabase = await createServerClient()

  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      id,
      client_name,
      event_date,
      target_count,
      min_count,
      max_count,
      status,
      studio_id
    `)
    .eq("link_token", token)
    .single()

  if (error || !project) return null
  return project
}

const getCachedProject = unstable_cache(
  async (token: string) => getProject(token),
  ["select-project"],
  { revalidate: 60, tags: ["project"] },
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const project = await retryableRequest(() => getCachedProject(token))

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      )
    }

    if (project.status !== "selecting" && project.status !== "submitted") {
      logger.warn("select-api", "Selection not available", {
        token,
        status: project.status,
      })
      return NextResponse.json(
        { error: "Selection is not available" },
        { status: 403 },
      )
    }

    const supabase = await createServerClient()
    const { data: studio } = await supabase
      .from("studios")
      .select("name")
      .eq("id", project.studio_id)
      .single()

    return NextResponse.json({
      client_name: project.client_name,
      event_date: project.event_date,
      target_count: project.target_count,
      min_count: project.min_count,
      max_count: project.max_count,
      status: project.status,
      studio_name: studio?.name ?? null,
    })
  } catch (error) {
    logger.error("select-api", "Failed to fetch project", { token, error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
