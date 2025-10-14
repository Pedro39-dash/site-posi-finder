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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analysis_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_categories: {
        Row: {
          audit_report_id: string
          category: string
          created_at: string
          id: string
          score: number
          status: string
        }
        Insert: {
          audit_report_id: string
          category: string
          created_at?: string
          id?: string
          score?: number
          status: string
        }
        Update: {
          audit_report_id?: string
          category?: string
          created_at?: string
          id?: string
          score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_categories_audit_report_id_fkey"
            columns: ["audit_report_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_issues: {
        Row: {
          audit_category_id: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string
          recommendation: string | null
          type: string
        }
        Insert: {
          audit_category_id: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority: string
          recommendation?: string | null
          type: string
        }
        Update: {
          audit_category_id?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          recommendation?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_issues_audit_category_id_fkey"
            columns: ["audit_category_id"]
            isOneToOne: false
            referencedRelation: "audit_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_keywords: {
        Row: {
          audit_report_id: string
          category: string
          created_at: string
          id: string
          keyword: string
          keyword_type: string | null
          relevance_score: number | null
        }
        Insert: {
          audit_report_id: string
          category: string
          created_at?: string
          id?: string
          keyword: string
          keyword_type?: string | null
          relevance_score?: number | null
        }
        Update: {
          audit_report_id?: string
          category?: string
          created_at?: string
          id?: string
          keyword?: string
          keyword_type?: string | null
          relevance_score?: number | null
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          overall_score: number
          project_id: string | null
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          overall_score?: number
          project_id?: string | null
          status?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          overall_score?: number
          project_id?: string | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_analyses: {
        Row: {
          audit_report_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          overall_competitiveness_score: number | null
          project_id: string | null
          status: string
          target_domain: string
          total_competitors: number | null
          total_keywords: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_report_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          overall_competitiveness_score?: number | null
          project_id?: string | null
          status?: string
          target_domain: string
          total_competitors?: number | null
          total_keywords?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_report_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          overall_competitiveness_score?: number | null
          project_id?: string | null
          status?: string
          target_domain?: string
          total_competitors?: number | null
          total_keywords?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analyses_audit_report_id_fkey"
            columns: ["audit_report_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_domains: {
        Row: {
          analysis_id: string
          average_position: number | null
          created_at: string
          detected_automatically: boolean | null
          domain: string
          id: string
          metadata: Json | null
          relevance_score: number | null
          share_of_voice: number | null
          total_keywords_found: number | null
        }
        Insert: {
          analysis_id: string
          average_position?: number | null
          created_at?: string
          detected_automatically?: boolean | null
          domain: string
          id?: string
          metadata?: Json | null
          relevance_score?: number | null
          share_of_voice?: number | null
          total_keywords_found?: number | null
        }
        Update: {
          analysis_id?: string
          average_position?: number | null
          created_at?: string
          detected_automatically?: boolean | null
          domain?: string
          id?: string
          metadata?: Json | null
          relevance_score?: number | null
          share_of_voice?: number | null
          total_keywords_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_domains_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_keywords: {
        Row: {
          analysis_id: string
          competition_level: string | null
          competitor_positions: Json | null
          created_at: string
          id: string
          keyword: string
          metadata: Json | null
          search_volume: number | null
          target_domain_position: number | null
        }
        Insert: {
          analysis_id: string
          competition_level?: string | null
          competitor_positions?: Json | null
          created_at?: string
          id?: string
          keyword: string
          metadata?: Json | null
          search_volume?: number | null
          target_domain_position?: number | null
        }
        Update: {
          analysis_id?: string
          competition_level?: string | null
          competitor_positions?: Json | null
          created_at?: string
          id?: string
          keyword?: string
          metadata?: Json | null
          search_volume?: number | null
          target_domain_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_keywords_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics: {
        Row: {
          change_percentage: number | null
          current_value: number
          id: string
          metadata: Json | null
          metric_type: string
          period_type: string
          previous_value: number | null
          project_id: string | null
          recorded_at: string
          user_id: string
        }
        Insert: {
          change_percentage?: number | null
          current_value?: number
          id?: string
          metadata?: Json | null
          metric_type: string
          period_type?: string
          previous_value?: number | null
          project_id?: string | null
          recorded_at?: string
          user_id: string
        }
        Update: {
          change_percentage?: number | null
          current_value?: number
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_type?: string
          previous_value?: number | null
          project_id?: string | null
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      keyword_opportunities: {
        Row: {
          analysis_id: string
          best_competitor_domain: string | null
          best_competitor_position: number | null
          created_at: string
          gap_size: number | null
          id: string
          keyword: string
          metadata: Json | null
          opportunity_type: string
          priority_score: number | null
          recommended_action: string | null
          target_position: number | null
        }
        Insert: {
          analysis_id: string
          best_competitor_domain?: string | null
          best_competitor_position?: number | null
          created_at?: string
          gap_size?: number | null
          id?: string
          keyword: string
          metadata?: Json | null
          opportunity_type: string
          priority_score?: number | null
          recommended_action?: string | null
          target_position?: number | null
        }
        Update: {
          analysis_id?: string
          best_competitor_domain?: string | null
          best_competitor_position?: number | null
          created_at?: string
          gap_size?: number | null
          id?: string
          keyword?: string
          metadata?: Json | null
          opportunity_type?: string
          priority_score?: number | null
          recommended_action?: string | null
          target_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_opportunities_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_rankings: {
        Row: {
          clicks: number | null
          created_at: string
          ctr: number | null
          current_position: number | null
          data_source: string | null
          device: string
          id: string
          impressions: number | null
          keyword: string
          last_seen_at: string | null
          location: string | null
          metadata: Json | null
          previous_position: number | null
          project_id: string
          search_engine: string
          tracking_status: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          current_position?: number | null
          data_source?: string | null
          device?: string
          id?: string
          impressions?: number | null
          keyword: string
          last_seen_at?: string | null
          location?: string | null
          metadata?: Json | null
          previous_position?: number | null
          project_id: string
          search_engine?: string
          tracking_status?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          current_position?: number | null
          data_source?: string | null
          device?: string
          id?: string
          impressions?: number | null
          keyword?: string
          last_seen_at?: string | null
          location?: string | null
          metadata?: Json | null
          previous_position?: number | null
          project_id?: string
          search_engine?: string
          tracking_status?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      keyword_suggestions: {
        Row: {
          difficulty_score: number | null
          id: string
          metadata: Json | null
          project_id: string
          relevance_score: number | null
          search_volume: number | null
          source_type: string
          status: string | null
          suggested_at: string
          suggested_keyword: string
        }
        Insert: {
          difficulty_score?: number | null
          id?: string
          metadata?: Json | null
          project_id: string
          relevance_score?: number | null
          search_volume?: number | null
          source_type: string
          status?: string | null
          suggested_at?: string
          suggested_keyword: string
        }
        Update: {
          difficulty_score?: number | null
          id?: string
          metadata?: Json | null
          project_id?: string
          relevance_score?: number | null
          search_volume?: number | null
          source_type?: string
          status?: string | null
          suggested_at?: string
          suggested_keyword?: string
        }
        Relationships: []
      }
      keyword_tags: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          keyword_ranking_id: string
          tag_color: string | null
          tag_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          keyword_ranking_id: string
          tag_color?: string | null
          tag_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          keyword_ranking_id?: string
          tag_color?: string | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_tags_keyword_ranking_id_fkey"
            columns: ["keyword_ranking_id"]
            isOneToOne: false
            referencedRelation: "keyword_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_configs: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          monitoring_type: string
          next_run_at: string | null
          project_id: string
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          monitoring_type?: string
          next_run_at?: string | null
          project_id: string
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          monitoring_type?: string
          next_run_at?: string | null
          project_id?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monitoring_logs: {
        Row: {
          config_id: string
          error_message: string | null
          executed_at: string
          execution_time_ms: number | null
          execution_type: string
          id: string
          results: Json | null
          status: string
        }
        Insert: {
          config_id: string
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          execution_type: string
          id?: string
          results?: Json | null
          status?: string
        }
        Update: {
          config_id?: string
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          execution_type?: string
          id?: string
          results?: Json | null
          status?: string
        }
        Relationships: []
      }
      monitoring_sessions: {
        Row: {
          created_at: string
          id: string
          last_check_at: string | null
          metadata: Json | null
          monitoring_frequency: string
          next_check_at: string | null
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_check_at?: string | null
          metadata?: Json | null
          monitoring_frequency?: string
          next_check_at?: string | null
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_check_at?: string | null
          metadata?: Json | null
          monitoring_frequency?: string
          next_check_at?: string | null
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string
          project_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          market_segment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          market_segment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          market_segment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_integrations: {
        Row: {
          access_token: string | null
          account_email: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync_at: string | null
          project_id: string
          property_id: string | null
          refresh_token: string | null
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string | null
          view_id: string | null
        }
        Insert: {
          access_token?: string | null
          account_email?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_sync_at?: string | null
          project_id: string
          property_id?: string | null
          refresh_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          view_id?: string | null
        }
        Update: {
          access_token?: string | null
          account_email?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          project_id?: string
          property_id?: string | null
          refresh_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          view_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          competitor_domains: string[] | null
          created_at: string
          domain: string
          focus_keywords: string[] | null
          id: string
          is_active: boolean | null
          market_segment: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competitor_domains?: string[] | null
          created_at?: string
          domain: string
          focus_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          market_segment?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competitor_domains?: string[] | null
          created_at?: string
          domain?: string
          focus_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          market_segment?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ranking_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_active: boolean | null
          keyword: string
          last_triggered: string | null
          metadata: Json | null
          project_id: string
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword: string
          last_triggered?: string | null
          metadata?: Json | null
          project_id: string
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword?: string
          last_triggered?: string | null
          metadata?: Json | null
          project_id?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      ranking_history: {
        Row: {
          change_from_previous: number | null
          id: string
          keyword_ranking_id: string
          metadata: Json | null
          position: number
          recorded_at: string
        }
        Insert: {
          change_from_previous?: number | null
          id?: string
          keyword_ranking_id: string
          metadata?: Json | null
          position: number
          recorded_at?: string
        }
        Update: {
          change_from_previous?: number | null
          id?: string
          keyword_ranking_id?: string
          metadata?: Json | null
          position?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ranking_history_keyword_ranking"
            columns: ["keyword_ranking_id"]
            isOneToOne: false
            referencedRelation: "keyword_rankings"
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_dashboard_metrics: {
        Args: { _period_type?: string; _project_id?: string; _user_id: string }
        Returns: undefined
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      schedule_monitoring_job: {
        Args: { _config_id: string; _frequency?: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "client" | "display"
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
  public: {
    Enums: {
      user_role: ["admin", "client", "display"],
    },
  },
} as const
