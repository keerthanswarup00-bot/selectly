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
      .select("id, link_disabled")
      .eq("link_token", token)
      .single()

    if (!folder || folder.link_disabled) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 },
      )
    }

    const folderId = folder.id

    // Get folder info
    const { data: folderInfo } = await supabase
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
        status
      `)
      .eq("id", folderId)
      .single()

    if (!folderInfo) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 },
      )
    }

    // Get project info
    const { data: project } = await supabase
      .from("projects")
      .select("client_name, studio_id")
      .eq("id", folderInfo.project_id)
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

    // Get images
    const { data: images } = await supabase
      .from("project_images")
      .select("id, filename, preview_url, preview_expires_at")
      .eq("folder_id", folderId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    // Check if there's an existing selection (identified by client IP or session)
    // For simplicity, we check by a combination of project + anonymous identifier
    const { data: existingSelections } = await supabase
      .from("selections")
      .select("selected, client_name")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false })
      .limit(1)

    const selection = existingSelections?.[0] ?? null

    return NextResponse.json({
      folder: {
        name: folderInfo.name,
        description: folderInfo.description,
        selection_type: folderInfo.selection_type,
        min_count: folderInfo.min_count,
        max_count: folderInfo.max_count,
        total_images: folderInfo.total_images,
        status: folderInfo.status,
        client_name: project.client_name,
        studio_name: studio?.name ?? null,
      },
      images: (images ?? []).map((img) => ({
        id: img.id,
        filename: img.filename,
        preview_url: img.preview_url,
      })),
      selection: selection ? {
        selected: selection.selected,
        client_name: selection.client_name,
      } : null,
    })
  } catch (error) {
    logger.error("client-folder-images", "Failed to fetch folder images", { token, error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
