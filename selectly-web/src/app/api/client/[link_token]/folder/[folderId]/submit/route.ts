import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ link_token: string; folderId: string }> },
) {
  const { link_token: token, folderId } = await params

  try {
    const body = await request.json()
    const { selected, highlighted, client_name } = body

    if (!Array.isArray(selected)) {
      return NextResponse.json(
        { error: "Invalid selection data" },
        { status: 400 },
      )
    }

    if (!client_name || typeof client_name !== "string" || client_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 },
      )
    }

    const supabase = await createServerClient()

    // Verify folder and get project info
    const { data: folder } = await supabase
      .from("folders")
      .select("id, project_id, studio_id, selection_type, min_count, max_count, link_disabled")
      .eq("link_token", token)
      .eq("id", folderId)
      .single()

    if (!folder || folder.link_disabled) {
      return NextResponse.json(
        { error: "Folder not found or sharing is disabled" },
        { status: 404 },
      )
    }

    // Validate against selection rules
    if (folder.selection_type === "minimum" && selected.length < folder.min_count) {
      return NextResponse.json(
        { error: `Minimum selection is ${folder.min_count}` },
        { status: 400 },
      )
    }

    if (folder.selection_type === "range") {
      if (selected.length < folder.min_count) {
        return NextResponse.json(
          { error: `Minimum selection is ${folder.min_count}` },
          { status: 400 },
        )
      }
      if (selected.length > folder.max_count) {
        return NextResponse.json(
          { error: `Maximum selection is ${folder.max_count}` },
          { status: 400 },
        )
      }
    }

    // Insert selection
    const { error: insertError } = await supabase
      .from("selections")
      .insert({
        project_id: folder.project_id,
        folder_id: folder.id,
        studio_id: folder.studio_id,
        client_name: client_name.trim(),
        selected,
        highlighted: Array.isArray(highlighted) ? highlighted : [],
        submitted_at: new Date().toISOString(),
      })

    if (insertError) {
      logger.error("client-submit", "Failed to insert selection", { error: insertError })
      return NextResponse.json(
        { error: "Failed to submit selection" },
        { status: 500 },
      )
    }

    // Update folder status
    await supabase
      .from("folders")
      .update({ status: "submitted" })
      .eq("id", folder.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("client-submit", "Submission failed", { token, error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
