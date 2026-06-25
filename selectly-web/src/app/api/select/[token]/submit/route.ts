import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { retryableRequest } from "@/lib/retry"
import { revalidateTag } from "next/cache"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const body = await request.json()
    const { selected, highlighted }: { selected: string[]; highlighted: string[] } = body

    if (!Array.isArray(selected)) {
      return NextResponse.json(
        { error: "selected must be an array of filenames" },
        { status: 400 },
      )
    }

    const admin = createAdminClient()

    const { data: project, error: projectError } = await retryableRequest(
      async () =>
        admin
          .from("projects")
          .select("id, studio_id, status, min_count, max_count")
          .eq("link_token", token)
          .single(),
    )

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      )
    }

    if (project.status !== "selecting") {
      logger.warn("select-submit", "Selection window closed", {
        token,
        status: project.status,
      })
      return NextResponse.json(
        { error: "Selection window has closed" },
        { status: 403 },
      )
    }

    const selectedCount = selected.length
    if (selectedCount < project.min_count || selectedCount > project.max_count) {
      return NextResponse.json(
        {
          error: `Selection must be between ${project.min_count} and ${project.max_count} photos`,
          currentCount: selectedCount,
        },
        { status: 400 },
      )
    }

    if (Array.isArray(highlighted)) {
      const invalidHighlights = highlighted.filter((h) => !selected.includes(h))
      if (invalidHighlights.length > 0) {
        return NextResponse.json(
          { error: "Highlighted photos must be in the selected list" },
          { status: 400 },
        )
      }
    }

    const { data: selection, error: insertError } = await retryableRequest(
      async () =>
        admin
          .from("selections")
          .insert({
            project_id: project.id,
            studio_id: project.studio_id,
            selected,
            highlighted: highlighted ?? [],
            submitted_at: new Date().toISOString(),
          })
          .select("id")
          .single(),
    )

    if (insertError) {
      throw insertError
    }

    const { error: updateError } = await admin
      .from("projects")
      .update({ status: "submitted" })
      .eq("id", project.id)

    if (updateError) {
      logger.error("select-submit", "Failed to update project status", {
        projectId: project.id,
        error: updateError,
      })
    }

    revalidateTag("project")

    return NextResponse.json({
      message: "Selection submitted successfully",
      selectionId: selection.id,
    })
  } catch (error) {
    logger.error("select-submit", "Failed to submit selection", { token, error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
