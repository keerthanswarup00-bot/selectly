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
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
        }>
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
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
        }>
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
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
        }>
      }
      project_images: {
        Row: {
          id: string
          project_id: string
          studio_id: string
          filename: string
          storage_path: string
          preview_url: string | null
          preview_expires_at: string | null
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
          preview_url?: string | null
          preview_expires_at?: string | null
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
          preview_url?: string | null
          preview_expires_at?: string | null
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
          deleted_at?: string | null
        }
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
        }>
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
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
        }>
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
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          referencedRelation: string
          referencedColumns: string[]
        }>
      }
    }
    Views: never
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
