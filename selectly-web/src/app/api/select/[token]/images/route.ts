import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
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
          .select("id, status")
          .eq("link_token", token)
          .single(),
    )

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      )
    }

    if (project.status !== "selecting" && project.status !== "submitted") {
      logger.warn("select-images", "Images not available", {
        token,
        status: project.status,
      })
      return NextResponse.json(
        { error: "Selection is not available" },
        { status: 403 },
      )
    }

    const { data: images, error: imagesError } = await retryableRequest(
      async () =>
        supabase
          .from("project_images")
          .select("id, filename, preview_url, preview_expires_at")
          .eq("project_id", project.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: true }),
    )

    if (imagesError) {
      throw imagesError
    }

    return NextResponse.json({
      total: images.length,
      images: images.map((img) => ({
        id: img.id,
        filename: img.filename,
        preview_url: img.preview_url,
      })),
    })
  } catch (error) {
    logger.error("select-images", "Failed to fetch images", { token, error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
