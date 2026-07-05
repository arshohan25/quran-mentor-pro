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
      admin_promotion_approvals: {
        Row: {
          approver_id: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          approver_id: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          approver_id?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_promotion_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "admin_promotion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_promotion_requests: {
        Row: {
          applied_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          id: string
          reason: string | null
          requested_by: string
          status: Database["public"]["Enums"]["admin_request_status"]
          target_user_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["admin_request_status"]
          target_user_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["admin_request_status"]
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_branding: {
        Row: {
          accent_hsl: string
          app_name_ar: string
          app_name_bn: string
          app_name_en: string
          default_country: string | null
          default_language: string
          default_theme: string
          gold_hsl: string
          id: number
          logo_url: string | null
          primary_hsl: string
          tagline_ar: string | null
          tagline_bn: string | null
          tagline_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_hsl?: string
          app_name_ar?: string
          app_name_bn?: string
          app_name_en?: string
          default_country?: string | null
          default_language?: string
          default_theme?: string
          gold_hsl?: string
          id?: number
          logo_url?: string | null
          primary_hsl?: string
          tagline_ar?: string | null
          tagline_bn?: string | null
          tagline_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_hsl?: string
          app_name_ar?: string
          app_name_bn?: string
          app_name_en?: string
          default_country?: string | null
          default_language?: string
          default_theme?: string
          gold_hsl?: string
          id?: number
          logo_url?: string | null
          primary_hsl?: string
          tagline_ar?: string | null
          tagline_bn?: string | null
          tagline_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: number
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      bookmarks_sync: {
        Row: {
          ayah: number
          created_at: string
          id: string
          note: string | null
          surah: number
          user_id: string
        }
        Insert: {
          ayah: number
          created_at?: string
          id?: string
          note?: string | null
          surah: number
          user_id: string
        }
        Update: {
          ayah?: number
          created_at?: string
          id?: string
          note?: string | null
          surah?: number
          user_id?: string
        }
        Relationships: []
      }
      content_item_locales: {
        Row: {
          country: string
          enabled: boolean
          id: string
          key: string
          language: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          country: string
          enabled?: boolean
          id?: string
          key: string
          language: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          country?: string
          enabled?: boolean
          id?: string
          key?: string
          language?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          ar: string | null
          bn: string | null
          created_at: string
          en: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          ar?: string | null
          bn?: string | null
          created_at?: string
          en?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          ar?: string | null
          bn?: string | null
          created_at?: string
          en?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_content_overrides: {
        Row: {
          created_at: string
          date: string
          enabled: boolean
          id: string
          kind: string
          payload: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          enabled?: boolean
          id?: string
          kind: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          enabled?: boolean
          id?: string
          kind?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      hifz_srs: {
        Row: {
          ayah: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_quality: number | null
          last_reviewed_at: string | null
          next_review_at: string
          repetitions: number
          surah: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ayah: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_quality?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          surah: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ayah?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_quality?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          surah?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          created_at: string
          cta_label_ar: string | null
          cta_label_bn: string | null
          cta_label_en: string | null
          enabled: boolean
          icon: string | null
          id: string
          key: string
          link: string | null
          sort_order: number
          subtitle_ar: string | null
          subtitle_bn: string | null
          subtitle_en: string | null
          title_ar: string | null
          title_bn: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label_ar?: string | null
          cta_label_bn?: string | null
          cta_label_en?: string | null
          enabled?: boolean
          icon?: string | null
          id?: string
          key: string
          link?: string | null
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_bn?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label_ar?: string | null
          cta_label_bn?: string | null
          cta_label_en?: string | null
          enabled?: boolean
          icon?: string | null
          id?: string
          key?: string
          link?: string | null
          sort_order?: number
          subtitle_ar?: string | null
          subtitle_bn?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lesson_items: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_bn: string | null
          description_en: string | null
          enabled: boolean
          id: string
          recommended_reciter_id: string | null
          sort_order: number
          target_ayah_end: number | null
          target_ayah_start: number | null
          target_surah: number | null
          title_ar: string | null
          title_bn: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_bn?: string | null
          description_en?: string | null
          enabled?: boolean
          id: string
          recommended_reciter_id?: string | null
          sort_order?: number
          target_ayah_end?: number | null
          target_ayah_start?: number | null
          target_surah?: number | null
          title_ar?: string | null
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_bn?: string | null
          description_en?: string | null
          enabled?: boolean
          id?: string
          recommended_reciter_id?: string | null
          sort_order?: number
          target_ayah_end?: number | null
          target_ayah_start?: number | null
          target_surah?: number | null
          title_ar?: string | null
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          created_at: string
          enabled: boolean
          icon: string
          id: string
          label_ar: string | null
          label_bn: string | null
          label_en: string | null
          path: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          icon: string
          id?: string
          label_ar?: string | null
          label_bn?: string | null
          label_en?: string | null
          path: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          icon?: string
          id?: string
          label_ar?: string | null
          label_bn?: string | null
          label_en?: string | null
          path?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qaza_sync: {
        Row: {
          asr: number
          dhuhr: number
          fajr: number
          id: string
          isha: number
          maghrib: number
          updated_at: string
          user_id: string
          witr: number
        }
        Insert: {
          asr?: number
          dhuhr?: number
          fajr?: number
          id?: string
          isha?: number
          maghrib?: number
          updated_at?: string
          user_id: string
          witr?: number
        }
        Update: {
          asr?: number
          dhuhr?: number
          fajr?: number
          id?: string
          isha?: number
          maghrib?: number
          updated_at?: string
          user_id?: string
          witr?: number
        }
        Relationships: []
      }
      recitation_sessions: {
        Row: {
          accuracy: number
          ayah: number
          correct_words: number
          created_at: string
          duration_ms: number | null
          error_words: number
          hesitation_words: number
          id: string
          lesson_type: string | null
          mode: string
          reciter: string | null
          surah: number
          total_words: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          ayah: number
          correct_words?: number
          created_at?: string
          duration_ms?: number | null
          error_words?: number
          hesitation_words?: number
          id?: string
          lesson_type?: string | null
          mode?: string
          reciter?: string | null
          surah: number
          total_words: number
          user_id: string
        }
        Update: {
          accuracy?: number
          ayah?: number
          correct_words?: number
          created_at?: string
          duration_ms?: number | null
          error_words?: number
          hesitation_words?: number
          id?: string
          lesson_type?: string | null
          mode?: string
          reciter?: string | null
          surah?: number
          total_words?: number
          user_id?: string
        }
        Relationships: []
      }
      recitation_word_stats: {
        Row: {
          attempts: number
          ayah: number
          correct: number
          errors: number
          hesitations: number
          id: string
          last_seen_at: string
          surah: number
          updated_at: string
          user_id: string
          word_index: number
        }
        Insert: {
          attempts?: number
          ayah: number
          correct?: number
          errors?: number
          hesitations?: number
          id?: string
          last_seen_at?: string
          surah: number
          updated_at?: string
          user_id: string
          word_index: number
        }
        Update: {
          attempts?: number
          ayah?: number
          correct?: number
          errors?: number
          hesitations?: number
          id?: string
          last_seen_at?: string
          surah?: number
          updated_at?: string
          user_id?: string
          word_index?: number
        }
        Relationships: []
      }
      reciters: {
        Row: {
          created_at: string
          enabled: boolean
          external_id: string | null
          id: string
          is_default: boolean
          name_ar: string | null
          name_bn: string | null
          name_en: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          external_id?: string | null
          id: string
          is_default?: boolean
          name_ar?: string | null
          name_bn?: string | null
          name_en?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          external_id?: string | null
          id?: string
          is_default?: boolean
          name_ar?: string | null
          name_bn?: string | null
          name_en?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_app_settings_tiles: { Args: { _defaults: Json }; Returns: Json }
    }
    Enums: {
      admin_request_status: "pending" | "approved" | "cancelled"
      app_role: "admin" | "moderator" | "user"
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
      admin_request_status: ["pending", "approved", "cancelled"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
