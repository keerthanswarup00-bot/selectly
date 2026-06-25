import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log("Seeding demo data...")

  const email = "demo@selixo.io"
  const password = "Demo1234!"

  const { data: existingUser, error: lookupError } = await admin.auth.admin.listUsers()
  if (!lookupError) {
    const found = existingUser.users.find((u) => u.email === email)
    if (found) {
      console.log("Demo user already exists, cleaning up...")
      await admin.auth.admin.deleteUser(found.id)
    }
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    console.error("Failed to create auth user:", authError?.message)
    process.exit(1)
  }

  const userId = authData.user.id
  console.log("Created auth user:", userId)

  const { data: studio, error: studioError } = await admin
    .from("studios")
    .insert({ name: "Demo Studio", slug: "demo-studio" })
    .select("id")
    .single()

  if (studioError || !studio) {
    console.error("Failed to create studio:", studioError?.message)
    await admin.auth.admin.deleteUser(userId)
    process.exit(1)
  }

  console.log("Created studio:", studio.id)

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    studio_id: studio.id,
    email,
    full_name: "Demo Photographer",
    role: "owner",
  })

  if (profileError) {
    console.error("Failed to create profile:", profileError?.message)
    await admin.from("studios").delete().eq("id", studio.id)
    await admin.auth.admin.deleteUser(userId)
    process.exit(1)
  }

  console.log("Created profile")

  const projects = [
    { client_name: "Smith & Johnson Wedding", event_date: "2025-09-15", target_count: 250 },
    { client_name: "Emily Rose Portraits", event_date: "2025-08-22", target_count: 50 },
    { client_name: "Corporate Headshots - TechCorp", event_date: "2025-07-10", target_count: 80 },
    { client_name: "Greenfield Maternity Shoot", event_date: "2025-06-05", target_count: 30 },
  ]

  for (const project of projects) {
    const minCount = Math.round(project.target_count * 0.8)
    const maxCount = Math.round(project.target_count * 1.2)

    const { data: proj, error: projError } = await admin
      .from("projects")
      .insert({
        studio_id: studio.id,
        created_by: userId,
        client_name: project.client_name,
        event_date: project.event_date,
        target_count: project.target_count,
        min_count: minCount,
        max_count: maxCount,
        status: "selecting",
      })
      .select("id, link_token")
      .single()

    if (projError) {
      console.error(`Failed to create project ${project.client_name}:`, projError.message)
      continue
    }

    console.log(`Created project: ${project.client_name} (${proj.id})`)
    console.log(`  Share link: /share/${proj.link_token}`)

    await admin.from("activity_logs").insert({
      studio_id: studio.id,
      profile_id: userId,
      action: "project.created",
      resource_type: "project",
      resource_id: proj.id,
      metadata: { client_name: project.client_name },
    })
  }

  console.log("\n--- DEMO DATA CREATED ---")
  console.log("Email:    demo@selixo.io")
  console.log("Password: Demo1234!")
  console.log("Login at: http://localhost:3000/login")
}

seed().catch(console.error)
