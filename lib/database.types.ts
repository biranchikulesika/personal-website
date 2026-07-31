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
      active_systems: {
        Row: {
          created_at: string
          description: string | null
          hidden: boolean
          id: string
          name: string
          order: number
          stack: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          name: string
          order?: number
          stack?: string[] | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          name?: string
          order?: number
          stack?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          category: string
          coverImage: string | null
          createdAt: string
          featured: boolean
          hidden: boolean
          id: string
          notes: string | null
          status: string
          title: string
          updatedAt: string
        }
        Insert: {
          author: string
          category: string
          coverImage?: string | null
          createdAt?: string
          featured?: boolean
          hidden?: boolean
          id?: string
          notes?: string | null
          status: string
          title: string
          updatedAt?: string
        }
        Update: {
          author?: string
          category?: string
          coverImage?: string | null
          createdAt?: string
          featured?: boolean
          hidden?: boolean
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      build_logs: {
        Row: {
          ai_generated: boolean | null
          category: string | null
          created_at: string
          date: string
          description: string | null
          generated_at: string | null
          generation_model: string | null
          hidden: boolean | null
          id: string
          long_summary: string | null
          related_commits: string[] | null
          related_repositories: string[] | null
          short_summary: string | null
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          generated_at?: string | null
          generation_model?: string | null
          hidden?: boolean | null
          id?: string
          long_summary?: string | null
          related_commits?: string[] | null
          related_repositories?: string[] | null
          short_summary?: string | null
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          generated_at?: string | null
          generation_model?: string | null
          hidden?: boolean | null
          id?: string
          long_summary?: string | null
          related_commits?: string[] | null
          related_repositories?: string[] | null
          short_summary?: string | null
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      builder_status: {
        Row: {
          created_at: string
          current_focus: string
          id: string
          operational_state: string
          status_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_focus: string
          id?: string
          operational_state: string
          status_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_focus?: string
          id?: string
          operational_state?: string
          status_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          createdAt: string
          donorEmail: string | null
          donorName: string | null
          donorPhone: string | null
          id: string
          publicName: string | null
          razorpayOrderId: string | null
          razorpayPaymentId: string | null
          status: string
          updatedAt: string
        }
        Insert: {
          amount: number
          createdAt?: string
          donorEmail?: string | null
          donorName?: string | null
          donorPhone?: string | null
          id?: string
          publicName?: string | null
          razorpayOrderId?: string | null
          razorpayPaymentId?: string | null
          status?: string
          updatedAt?: string
        }
        Update: {
          amount?: number
          createdAt?: string
          donorEmail?: string | null
          donorName?: string | null
          donorPhone?: string | null
          id?: string
          publicName?: string | null
          razorpayOrderId?: string | null
          razorpayPaymentId?: string | null
          status?: string
          updatedAt?: string
        }
        Relationships: []
      }
      field_notes: {
        Row: {
          category: string
          content: string
          createdAt: string
          draft: boolean
          excerpt: string | null
          featured: boolean
          hidden: boolean
          id: string
          publishedAt: string | null
          title: string
          updatedAt: string
        }
        Insert: {
          category: string
          content: string
          createdAt?: string
          draft?: boolean
          excerpt?: string | null
          featured?: boolean
          hidden?: boolean
          id?: string
          publishedAt?: string | null
          title: string
          updatedAt?: string
        }
        Update: {
          category?: string
          content?: string
          createdAt?: string
          draft?: boolean
          excerpt?: string | null
          featured?: boolean
          hidden?: boolean
          id?: string
          publishedAt?: string | null
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      fragments: {
        Row: {
          body: string | null
          created_at: string
          hidden: boolean
          id: string
          order: number
          quote: string
          source: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          order?: number
          quote: string
          source: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          order?: number
          quote?: string
          source?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      journal_moments: {
        Row: {
          content: string
          created_at: string
          hidden: boolean
          id: string
          mood: string | null
          time_label: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          hidden?: boolean
          id?: string
          mood?: string | null
          time_label?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          hidden?: boolean
          id?: string
          mood?: string | null
          time_label?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_issues: {
        Row: {
          content: string
          createdAt: string
          hidden: boolean
          id: string
          persona: string
          previewText: string | null
          publishedAt: string | null
          subject: string | null
          title: string
          updatedAt: string
        }
        Insert: {
          content: string
          createdAt?: string
          hidden?: boolean
          id?: string
          persona: string
          previewText?: string | null
          publishedAt?: string | null
          subject?: string | null
          title: string
          updatedAt?: string
        }
        Update: {
          content?: string
          createdAt?: string
          hidden?: boolean
          id?: string
          persona?: string
          previewText?: string | null
          publishedAt?: string | null
          subject?: string | null
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      newsletter_profiles: {
        Row: {
          createdAt: string
          description: string
          expectationItems: string[] | null
          frequencyText: string
          id: string
          persona: string
          philosophyText: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description: string
          expectationItems?: string[] | null
          frequencyText: string
          id?: string
          persona: string
          philosophyText: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string
          expectationItems?: string[] | null
          frequencyText?: string
          id?: string
          persona?: string
          philosophyText?: string
          updatedAt?: string
        }
        Relationships: []
      }
      operator_focuses: {
        Row: {
          created_at: string
          description: string | null
          hidden: boolean
          id: string
          priority: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          priority?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          priority?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          auto_cover_image: boolean | null
          byline: string | null
          content: string | null
          cover_image_alt: string | null
          cover_image_caption: string | null
          cover_image_credit: string | null
          cover_image_location: string | null
          cover_image_url: string | null
          created_at: string
          draft_content: string | null
          excerpt: string | null
          featured: boolean | null
          hidden: boolean | null
          id: string
          old_slugs: string[] | null
          persona: string | null
          published_at: string | null
          reading_time: number | null
          slug: string | null
          status: Database["public"]["Enums"]["post_status"]
          subtitle: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          auto_cover_image?: boolean | null
          byline?: string | null
          content?: string | null
          cover_image_alt?: string | null
          cover_image_caption?: string | null
          cover_image_credit?: string | null
          cover_image_location?: string | null
          cover_image_url?: string | null
          created_at?: string
          draft_content?: string | null
          excerpt?: string | null
          featured?: boolean | null
          hidden?: boolean | null
          id?: string
          old_slugs?: string[] | null
          persona?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          subtitle?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          auto_cover_image?: boolean | null
          byline?: string | null
          content?: string | null
          cover_image_alt?: string | null
          cover_image_caption?: string | null
          cover_image_credit?: string | null
          cover_image_location?: string | null
          cover_image_url?: string | null
          created_at?: string
          draft_content?: string | null
          excerpt?: string | null
          featured?: boolean | null
          hidden?: boolean | null
          id?: string
          old_slugs?: string[] | null
          persona?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          subtitle?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string | null
          created_at: string
          hidden: boolean
          id: string
          order: number
          question: string
          status: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          order?: number
          question: string
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          order?: number
          question?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      redistribution_records: {
        Row: {
          amount: number
          createdAt: string
          description: string
          destination: string
          donatedAt: string
          id: string
          internalNotes: string | null
          proofUrl: string | null
          transactionReference: string | null
          updatedAt: string
        }
        Insert: {
          amount: number
          createdAt?: string
          description: string
          destination: string
          donatedAt: string
          id?: string
          internalNotes?: string | null
          proofUrl?: string | null
          transactionReference?: string | null
          updatedAt?: string
        }
        Update: {
          amount?: number
          createdAt?: string
          description?: string
          destination?: string
          donatedAt?: string
          id?: string
          internalNotes?: string | null
          proofUrl?: string | null
          transactionReference?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          createdAt: string
          email: string
          id: string
          isVerified: boolean
          source: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          id?: string
          isVerified?: boolean
          source?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          isVerified?: boolean
          source?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active: boolean
          createdAt: string
          id: string
          persona: string
          subscriberId: string
          updatedAt: string
        }
        Insert: {
          active?: boolean
          createdAt?: string
          id?: string
          persona: string
          subscriberId: string
          updatedAt?: string
        }
        Update: {
          active?: boolean
          createdAt?: string
          id?: string
          persona?: string
          subscriberId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscriberId_fkey"
            columns: ["subscriberId"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_fragments: {
        Row: {
          content: string
          created_at: string
          hidden: boolean
          id: string
          published_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          hidden?: boolean
          id?: string
          published_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          hidden?: boolean
          id?: string
          published_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      post_status: "draft" | "published" | "archived"
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
      post_status: ["draft", "published", "archived"],
    },
  },
} as const
