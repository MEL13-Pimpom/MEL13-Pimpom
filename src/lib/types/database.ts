export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          ai_enabled: boolean
          ai_min_confidence: number
          ai_model: string
          id: number
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          ai_min_confidence?: number
          ai_model?: string
          id?: number
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          ai_min_confidence?: number
          ai_model?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: number
          ip_address: unknown
          new_value: string | null
          old_value: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: never
          ip_address?: unknown
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: never
          ip_address?: unknown
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link_url: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          address: string
          ai_category: string | null
          ai_classified_at: string | null
          ai_confidence: number | null
          ai_decision: string | null
          ai_is_waste: boolean | null
          ai_match: boolean | null
          ai_reason: string | null
          created_at: string
          geocoding_source: string
          id: string
          latitude: number
          longitude: number
          notes: string | null
          photo_url: string | null
          preferred_date: string
          preferred_time_window: string
          rejection_reason: string | null
          resident_id: string
          scheduled_date: string | null
          scheduled_time_window: string | null
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
          weight_kg_estimate: number | null
        }
        Insert: {
          address: string
          ai_category?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          ai_decision?: string | null
          ai_is_waste?: boolean | null
          ai_match?: boolean | null
          ai_reason?: string | null
          created_at?: string
          geocoding_source: string
          id?: string
          latitude: number
          longitude: number
          notes?: string | null
          photo_url?: string | null
          preferred_date: string
          preferred_time_window: string
          rejection_reason?: string | null
          resident_id: string
          scheduled_date?: string | null
          scheduled_time_window?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          weight_kg_estimate?: number | null
        }
        Update: {
          address?: string
          ai_category?: string | null
          ai_classified_at?: string | null
          ai_confidence?: number | null
          ai_decision?: string | null
          ai_is_waste?: boolean | null
          ai_match?: boolean | null
          ai_reason?: string | null
          created_at?: string
          geocoding_source?: string
          id?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          photo_url?: string | null
          preferred_date?: string
          preferred_time_window?: string
          rejection_reason?: string | null
          resident_id?: string
          scheduled_date?: string | null
          scheduled_time_window?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          weight_kg_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          arrived_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          request_id: string
          route_id: string
          status: Database["public"]["Enums"]["stop_status"]
          stop_order: number
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          request_id: string
          route_id: string
          status?: Database["public"]["Enums"]["stop_status"]
          stop_order: number
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          request_id?: string
          route_id?: string
          status?: Database["public"]["Enums"]["stop_status"]
          stop_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          collector_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["route_status"]
          time_window: string
          updated_at: string
        }
        Insert: {
          collector_id?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["route_status"]
          time_window?: string
          updated_at?: string
        }
        Update: {
          collector_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["route_status"]
          time_window?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_ai_classification: {
        Args: {
          p_category: string
          p_confidence: number
          p_decision: string
          p_is_waste: boolean
          p_match: boolean
          p_reason: string
          p_request_id: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_collector: { Args: never; Returns: boolean }
      is_resident: { Args: never; Returns: boolean }
      notify_admins_role_change_request: {
        Args: { p_body: string; p_link_url: string; p_title: string }
        Returns: number
      }
      request_belongs_to_me: {
        Args: { p_request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_type:
        | "request_update"
        | "task_assigned"
        | "schedule_change"
        | "broadcast"
        | "system"
        | "role_change_request"
        | "role_change_response"
      request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "missed"
      request_type:
        | "paper"
        | "plastic"
        | "metal"
        | "glass"
        | "electronic"
        | "mixed"
      route_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "uncompleted"
      stop_status:
        | "pending"
        | "en_route"
        | "arrived"
        | "completed"
        | "missed"
        | "skipped"
      user_role: "resident" | "admin" | "collector"
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

export type UserRole = Enums<"user_role">
export type RequestStatus = Enums<"request_status">
export type RequestType = Enums<"request_type">
export type RouteStatus = Enums<"route_status">
export type StopStatus = Enums<"stop_status">
export type NotificationType = Enums<"notification_type">

export type Profile = Tables<"profiles">
export type PickupRequest = Tables<"pickup_requests">
export type Route = Tables<"routes">
export type RouteStop = Tables<"route_stops">
export type Notification = Tables<"notifications">
export type AuditLog = Tables<"audit_logs">
export type AppSettings = Tables<"app_settings">

export const Constants = {
  public: {
    Enums: {
      notification_type: [
        "request_update",
        "task_assigned",
        "schedule_change",
        "broadcast",
        "system",
        "role_change_request",
        "role_change_response",
      ],
      request_status: [
        "pending",
        "approved",
        "rejected",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "missed",
      ],
      request_type: [
        "paper",
        "plastic",
        "metal",
        "glass",
        "electronic",
        "mixed",
      ],
      route_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
        "uncompleted",
      ],
      stop_status: [
        "pending",
        "en_route",
        "arrived",
        "completed",
        "missed",
        "skipped",
      ],
      user_role: ["resident", "admin", "collector"],
    },
  },
} as const
