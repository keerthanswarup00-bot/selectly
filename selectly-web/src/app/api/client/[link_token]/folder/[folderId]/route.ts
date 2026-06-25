import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ link_token: string }> },
) {
  const { link_token: token } = await params

  try {
    const supabase = await createServerClient()

    // Find all shared folders with this link token
    const { data: folder } = await supabase
      .from("folders")
      .select(`
        id,
        project_id,
        name,
        description,
        selection_type,
        min_count,
        max_count,
        total_images,
        status,
        link_disabled
      `)
      .eq("link_token", token)
      .single()

    if (!folder || folder.link_disabled) {
      return NextResponse.json(
        { error: "Folder not found or sharing is disabled" },
        { status: 404 },
      )
    }

    // Get project info
    const { data: project } = await supabase
      .from("projects")
      .select("client_name, event_date, status, studio_id")
      .eq("id", folder.project_id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      )
    }

    const { data: studio } = await supabase
      .from("studios")
      .select("name")
      .eq("id", project.studio_id)
      .single()

    return NextResponse.json({
      project: {
        client_name: project.client_name,
        event_date: project.event_date,
        studio_name: studio?.name ?? null,
        welcome_message: null,
      },
      folder: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        selection_type: folder.selection_type,
        min_count: folder.min_count,
        max_count: folder.max_count,
        total_images: folder.total_images,
        status: folder.status,
      },
    })
  } catch (error) {
    logger.error("client-folder-api", "Failed to fetch folder", { token, error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
