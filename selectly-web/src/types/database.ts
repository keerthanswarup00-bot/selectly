export interface Database {
  public: {
    Tables: {
      studios: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          studio_id: string
          email: string
          full_name: string | null
          role: "owner" | "editor" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          studio_id: string
          email: string
          full_name?: string | null
          role?: "owner" | "editor" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          email?: string
          full_name?: string | null
          role?: "owner" | "editor" | "admin"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_studio_id_fkey"
            columns: ["studio_id"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          studio_id: string
          created_by: string
          client_name: string
          event_date: string | null
          target_count: number
          min_count: number
          max_count: number
          status: "draft" | "uploading" | "uploaded" | "selecting" | "submitted" | "completed"
          link_token: string
          total_images: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          studio_id: string
          created_by: string
          client_name: string
          event_date?: string | null
          target_count: number
          min_count: number
          max_count: number
          status?: "draft" | "uploading" | "uploaded" | "selecting" | "submitted" | "completed"
          link_token?: string
          total_images?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          studio_id?: string
          created_by?: string
          client_name?: string
          event_date?: string | null
          target_count?: number
          min_count?: number
          max_count?: number
          status?: "draft" | "uploading" | "uploaded" | "selecting" | "submitted" | "completed"
          link_token?: string
          total_images?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_studio_id_fkey"
            columns: ["studio_id"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_images: {
        Row: {
          id: string
          project_id: string
          studio_id: string
          filename: string
          storage_path: string
          file_size: number | null
          mime_type: string | null
          width: number | null
          height: number | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          studio_id: string
          filename: string
          storage_path: string
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          studio_id?: string
          filename?: string
          storage_path?: string
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_studio_id_fkey"
            columns: ["studio_id"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          }
        ]
      }
      selections: {
        Row: {
          id: string
          project_id: string
          studio_id: string
          selected: string[]
          highlighted: string[]
          rejected: string[]
          skipped: string[]
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          studio_id: string
          selected?: string[]
          highlighted?: string[]
          rejected?: string[]
          skipped?: string[]
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          studio_id?: string
          selected?: string[]
          highlighted?: string[]
          rejected?: string[]
          skipped?: string[]
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "selections_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selections_studio_id_fkey"
            columns: ["studio_id"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          studio_id: string
          profile_id: string
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          profile_id: string
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          profile_id?: string
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_studio_id_fkey"
            columns: ["studio_id"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_studio_id: {
        Args: Record<string, never>
        Returns: string
      }
      is_studio_member: {
        Args: { check_studio_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
