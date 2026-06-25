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
          notes: string | null
          status: "draft" | "uploading" | "uploaded" | "selecting" | "submitted" | "completed"
          link_token: string
          total_images: number
          cover_image_path: string | null
          welcome_message: string | null
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
          target_count?: number
          min_count?: number
          max_count?: number
          notes?: string | null
          status?: "draft" | "uploading" | "uploaded" | "selecting" | "submitted" | "completed"
          link_token?: string
          total_images?: number
          cover_image_path?: string | null
          welcome_message?: string | null
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
          notes?: string | null
          status?: "draft" | "uploading" | "uploaded" | "selecting" | "submitted" | "completed"
          link_token?: string
          total_images?: number
          cover_image_path?: string | null
          welcome_message?: string | null
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
      folders: {
        Row: {
          id: string
          project_id: string
          studio_id: string
          name: string
          description: string | null
          sort_order: number
          selection_type: "no_limit" | "minimum" | "range"
          min_count: number
          max_count: number
          total_images: number
          link_token: string
          link_expires_at: string | null
          link_password: string | null
          link_disabled: boolean
          status: "draft" | "uploading" | "ready" | "shared" | "viewing" | "in_progress" | "submitted" | "approved" | "archived"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          studio_id: string
          name: string
          description?: string | null
          sort_order?: number
          selection_type?: "no_limit" | "minimum" | "range"
          min_count?: number
          max_count?: number
          total_images?: number
          link_token?: string
          link_expires_at?: string | null
          link_password?: string | null
          link_disabled?: boolean
          status?: "draft" | "uploading" | "ready" | "shared" | "viewing" | "in_progress" | "submitted" | "approved" | "archived"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          studio_id?: string
          name?: string
          description?: string | null
          sort_order?: number
          selection_type?: "no_limit" | "minimum" | "range"
          min_count?: number
          max_count?: number
          total_images?: number
          link_token?: string
          link_expires_at?: string | null
          link_password?: string | null
          link_disabled?: boolean
          status?: "draft" | "uploading" | "ready" | "shared" | "viewing" | "in_progress" | "submitted" | "approved" | "archived"
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
      project_images: {
        Row: {
          id: string
          project_id: string
          folder_id: string | null
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
          folder_id?: string | null
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
          folder_id?: string | null
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
          folder_id: string | null
          studio_id: string
          client_name: string | null
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
          folder_id?: string | null
          studio_id: string
          client_name?: string | null
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
          folder_id?: string | null
          studio_id?: string
          client_name?: string | null
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
      studio_branding: {
        Row: {
          id: string
          studio_id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          font_choice: string
          welcome_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          font_choice?: string
          welcome_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          font_choice?: string
          welcome_message?: string | null
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
      image_statuses: {
        Row: {
          id: string
          image_id: string
          project_id: string
          studio_id: string
          status: "favorite" | "maybe" | "rejected" | "selected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_id: string
          project_id: string
          studio_id: string
          status: "favorite" | "maybe" | "rejected" | "selected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_id?: string
          project_id?: string
          studio_id?: string
          status?: "favorite" | "maybe" | "rejected" | "selected"
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
      email_templates: {
        Row: {
          id: string
          studio_id: string
          name: string
          subject: string
          body_html: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          name: string
          subject: string
          body_html: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          name?: string
          subject?: string
          body_html?: string
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
      subscription_plans: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          price_monthly_cents: number
          max_projects: number
          max_images_per_project: number
          max_storage_gb: number
          features: Record<string, unknown>
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          price_monthly_cents: number
          max_projects?: number
          max_images_per_project?: number
          max_storage_gb?: number
          features?: Record<string, unknown>
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          price_monthly_cents?: number
          max_projects?: number
          max_images_per_project?: number
          max_storage_gb?: number
          features?: Record<string, unknown>
          is_active?: boolean
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
      studio_subscriptions: {
        Row: {
          id: string
          studio_id: string
          plan_id: string
          status: "active" | "trialing" | "past_due" | "canceled" | "expired"
          current_period_start: string
          current_period_end: string | null
          trial_end: string | null
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          plan_id: string
          status?: "active" | "trialing" | "past_due" | "canceled" | "expired"
          current_period_start?: string
          current_period_end?: string | null
          trial_end?: string | null
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          plan_id?: string
          status?: "active" | "trialing" | "past_due" | "canceled" | "expired"
          current_period_start?: string
          current_period_end?: string | null
          trial_end?: string | null
          canceled_at?: string | null
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

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
export type FolderRow = Database["public"]["Tables"]["folders"]["Row"]
export type ImageRow = Database["public"]["Tables"]["project_images"]["Row"]
export type SelectionRow = Database["public"]["Tables"]["selections"]["Row"]
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
