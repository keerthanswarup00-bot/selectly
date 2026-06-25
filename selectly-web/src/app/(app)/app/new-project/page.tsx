import { CreateProjectForm } from "@/features/projects/components/create-project-form"

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
        <p className="text-sm text-muted-foreground">
          Create a new client project for photo selection
        </p>
      </div>
      <CreateProjectForm />
    </div>
  )
}
