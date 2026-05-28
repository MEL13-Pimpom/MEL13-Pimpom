export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_name: string;
          created_at: string;
          id: number;
          ip_address: unknown | null;
          new_value: string | null;
          old_value: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_name?: string;
          created_at?: string;
          id?: never;
          ip_address?: unknown | null;
          new_value?: string | null;
          old_value?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_name?: string;
          created_at?: string;
          id?: never;
          ip_address?: unknown | null;
          new_value?: string | null;
          old_value?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link_url: string | null;
          read_at: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link_url?: string | null;
          read_at?: string | null;
          title: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link_url?: string | null;
          read_at?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pickup_requests: {
        Row: {
          address: string;
          created_at: string;
          geocoding_source: string;
          id: string;
          latitude: number;
          longitude: number;
          notes: string | null;
          photo_url: string | null;
          preferred_date: string;
          preferred_time_window: string;
          rejection_reason: string | null;
          resident_id: string;
          scheduled_date: string | null;
          scheduled_time_window: string | null;
          status: Database["public"]["Enums"]["request_status"];
          type: Database["public"]["Enums"]["request_type"];
          updated_at: string;
          weight_kg_estimate: number | null;
        };
        Insert: {
          address: string;
          created_at?: string;
          geocoding_source: string;
          id?: string;
          latitude: number;
          longitude: number;
          notes?: string | null;
          photo_url?: string | null;
          preferred_date: string;
          preferred_time_window: string;
          rejection_reason?: string | null;
          resident_id: string;
          scheduled_date?: string | null;
          scheduled_time_window?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          type: Database["public"]["Enums"]["request_type"];
          updated_at?: string;
          weight_kg_estimate?: number | null;
        };
        Update: {
          address?: string;
          created_at?: string;
          geocoding_source?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          notes?: string | null;
          photo_url?: string | null;
          preferred_date?: string;
          preferred_time_window?: string;
          rejection_reason?: string | null;
          resident_id?: string;
          scheduled_date?: string | null;
          scheduled_time_window?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          type?: Database["public"]["Enums"]["request_type"];
          updated_at?: string;
          weight_kg_estimate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_requests_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      route_stops: {
        Row: {
          arrived_at: string | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          request_id: string;
          route_id: string;
          status: Database["public"]["Enums"]["stop_status"];
          stop_order: number;
          updated_at: string;
        };
        Insert: {
          arrived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          request_id: string;
          route_id: string;
          status?: Database["public"]["Enums"]["stop_status"];
          stop_order: number;
          updated_at?: string;
        };
        Update: {
          arrived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          request_id?: string;
          route_id?: string;
          status?: Database["public"]["Enums"]["stop_status"];
          stop_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_stops_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "pickup_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_stops_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          collector_id: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          scheduled_date: string;
          status: Database["public"]["Enums"]["route_status"];
          time_window: string;
          updated_at: string;
        };
        Insert: {
          collector_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          scheduled_date: string;
          status?: Database["public"]["Enums"]["route_status"];
          time_window?: string;
          updated_at?: string;
        };
        Update: {
          collector_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          scheduled_date?: string;
          status?: Database["public"]["Enums"]["route_status"];
          time_window?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routes_collector_id_fkey";
            columns: ["collector_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_collector: { Args: Record<string, never>; Returns: boolean };
      is_resident: { Args: Record<string, never>; Returns: boolean };
      notify_admins_role_change_request: {
        Args: { p_title: string; p_body: string; p_link_url: string };
        Returns: number;
      };
      request_belongs_to_me: {
        Args: { p_request_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      notification_type:
        | "request_update"
        | "task_assigned"
        | "schedule_change"
        | "broadcast"
        | "system"
        | "role_change_request"
        | "role_change_response";
      request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "missed";
      request_type:
        | "paper"
        | "plastic"
        | "metal"
        | "glass"
        | "electronic"
        | "mixed";
      route_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "uncompleted";
      stop_status:
        | "pending"
        | "en_route"
        | "arrived"
        | "completed"
        | "missed"
        | "skipped";
      user_role: "resident" | "admin" | "collector";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Row"];

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Insert"];

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Update"];

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T];

export type UserRole = Enums<"user_role">;
export type RequestStatus = Enums<"request_status">;
export type RequestType = Enums<"request_type">;
export type RouteStatus = Enums<"route_status">;
export type StopStatus = Enums<"stop_status">;
export type NotificationType = Enums<"notification_type">;

export type Profile = Tables<"profiles">;
export type PickupRequest = Tables<"pickup_requests">;
export type Route = Tables<"routes">;
export type RouteStop = Tables<"route_stops">;
export type Notification = Tables<"notifications">;
export type AuditLog = Tables<"audit_logs">;
