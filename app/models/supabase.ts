export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      event_participations: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          event_id: string
          id: string
          profile_id: string
          registered_at: string
          status: string
          submission_id: string | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          registered_at?: string
          status?: string
          submission_id?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          registered_at?: string
          status?: string
          submission_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_participations_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_participations_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_participations_submission_id"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          created_by: string
          description: string | null
          end_at: string
          id: string
          location: string | null
          start_at: string
          status: string
          title: string
          updated_at: string
          waitlist_capacity: number
        }
        Insert: {
          capacity: number
          created_at?: string
          created_by: string
          description?: string | null
          end_at: string
          id?: string
          location?: string | null
          start_at: string
          status?: string
          title: string
          updated_at?: string
          waitlist_capacity?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string
          id?: string
          location?: string | null
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
          waitlist_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_events: {
        Row: {
          created_at: string
          event_id: string
          form_id: string
          is_required: boolean
          priority: number
        }
        Insert: {
          created_at?: string
          event_id: string
          form_id: string
          is_required?: boolean
          priority?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          form_id?: string
          is_required?: boolean
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_events_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_form_events_form_id"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          field_options: Json | null
          field_type: string
          form_id: string
          id: string
          is_required: boolean
          label: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          field_options?: Json | null
          field_type: string
          form_id: string
          id?: string
          is_required?: boolean
          label: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          field_options?: Json | null
          field_type?: string
          form_id?: string
          id?: string
          is_required?: boolean
          label?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_fields_form_id"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_answers: {
        Row: {
          answer_data: Json | null
          answer_text: string | null
          created_at: string
          field_id: string
          id: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          answer_data?: Json | null
          answer_text?: string | null
          created_at?: string
          field_id: string
          id?: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          answer_data?: Json | null
          answer_text?: string | null
          created_at?: string
          field_id?: string
          id?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_submission_answers_field_id"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_form_submission_answers_submission_id"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          form_id: string
          id: string
          status: string
          submitted_at: string | null
          submitted_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          status?: string
          submitted_at?: string | null
          submitted_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_submissions_form_id"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_form_submissions_submitted_by"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          publish_end_at: string | null
          publish_start_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          publish_end_at?: string | null
          publish_start_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          publish_end_at?: string | null
          publish_start_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_forms_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          resource: string
          updated_at: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          resource: string
          updated_at?: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          resource?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role_id: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role_id: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role_id?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_role_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          permission_id: number
          role_id: number
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          permission_id: number
          role_id: number
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_role_permissions_permission_id"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_role_permissions_role_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          permission_level: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          permission_level?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          permission_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      waitlists: {
        Row: {
          accepted_at: string | null
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          offered_at: string | null
          position: number
          profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          offered_at?: string | null
          position: number
          profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          offered_at?: string | null
          position?: number
          profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_waitlists_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_waitlists_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_user_permissions: {
        Row: {
          action: string | null
          permission_code: string | null
          permission_level: number | null
          permission_name: string | null
          resource: string | null
          role_code: string | null
          role_name: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_permission_level: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

