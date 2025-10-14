export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audits: {
        Row: {
          created_at: string
          id: string
          project_id: string
          report: Json | null
          score: number | null
          status: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          report?: Json | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          report?: Json | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_analysis: {
        Row: {
          created_at: string
          id: string
          keywords: string[] | null
          project_id: string | null // <<< ADICIONADO AQUI
          status: Database["public"]["Enums"]["analysis_status"] | null
          target_domain: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          keywords?: string[] | null
          project_id?: string | null // <<< ADICIONADO AQUI
          status?: Database["public"]["Enums"]["analysis_status"] | null
          target_domain?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: string[] | null
          project_id?: string | null // <<< ADICIONADO AQUI
          status?: Database["public"]["Enums"]["analysis_status"] | null
          target_domain?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_domains: {
        Row: {
          analysis_id: string
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_domains_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitive_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_keywords: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          keyword: string
          positions: Json | null
          search_volume: number | null
          target_domain_position: number | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          keyword: string
          positions?: Json | null
          search_volume?: number | null
          target_domain_position?: number | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          keyword?: string
          positions?: Json | null
          search_volume?: number | null
          target_domain_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_keywords_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitive_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_keywords: {
        Row: {
          clicks: number | null
          country: string | null
          created_at: string
          ctr: number | null
          id: string
          impressions: number | null
          keyword: string
          position: number | null
          project_id: string
        }
        Insert: {
          clicks?: number | null
          country?: string | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number | null
          keyword: string
          position?: number | null
          project_id: string
        }
        Update: {
          clicks?: number | null
          country?: string | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number | null
          keyword?: string
          position?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_keywords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monitored_keywords: {
        Row: {
          created_at: string
          id: string
          is_monitoring: boolean
          keyword: string
          project_id: string
          tags: string[] | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_monitoring?: boolean
          keyword: string
          project_id: string
          tags?: string[] | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_monitoring?: boolean
          keyword?: string
          project_id?: string
          tags?: string[] | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitored_keywords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      position_history: {
        Row: {
          checked_at: string
          id: string
          keyword_id: string
          position: number | null
          url: string | null
        }
        Insert: {
          checked_at?: string
          id?: string
          keyword_id: string
          position?: number | null
          url?: string | null
        }
        Update: {
          checked_at?: string
          id?: string
          keyword_id?: string
          position?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_history_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "monitored_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          domain: string
          gsc_property: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          gsc_property?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          gsc_property?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_keywords_for_project: {
        Args: {
          p_project_id: string
        }
        Returns: {
          id: string
          keyword: string
          url: string
          tags: string[]
          is_monitoring: boolean
          current_position: number
          last_checked: string
          history: Json
        }[]
      }
    }
    Enums: {
      analysis_status: "pending" | "in_progress" | "completed" | "failed"
      user_role: "admin" | "client" | "display"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never