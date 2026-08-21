// Database types for the new domain schema.
// These map directly to the Supabase SQL migration.

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string;
          persona: string | null;
          tags: string[];
          published_at: string | null;
          last_edited_at: string | null;
          assumed_audience: string;
          intro: unknown;
          sections: unknown;
          books: unknown;
          cover_image: string | null;
          status: "published" | "unpublished";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          description?: string;
          persona?: string | null;
          tags?: string[];
          published_at?: string | null;
          last_edited_at?: string | null;
          assumed_audience?: string;
          intro?: unknown;
          sections?: unknown;
          books?: unknown;
          cover_image?: string | null;
          status?: "published" | "unpublished";
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          subtitle?: string | null;
          description?: string;
          persona?: string | null;
          tags?: string[];
          published_at?: string | null;
          last_edited_at?: string | null;
          assumed_audience?: string;
          intro?: unknown;
          sections?: unknown;
          books?: unknown;
          cover_image?: string | null;
          status?: "published" | "unpublished";
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string;
          content: unknown;
          date: string | null;
          persona: string | null;
          tags: string[];
          cover_image: string | null;
          status: "published" | "unpublished";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          description?: string;
          content?: unknown;
          date?: string | null;
          persona?: string | null;
          tags?: string[];
          cover_image?: string | null;
          status?: "published" | "unpublished";
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          subtitle?: string | null;
          description?: string;
          content?: unknown;
          date?: string | null;
          persona?: string | null;
          tags?: string[];
          cover_image?: string | null;
          status?: "published" | "unpublished";
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          slug: string;
          title: string;
          author: string;
          description: string;
          date: string | null;
          persona: string | null;
          tags: string[];
          cover: string | null;
          link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          author: string;
          description?: string;
          date?: string | null;
          persona?: string | null;
          tags?: string[];
          cover?: string | null;
          link?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          author?: string;
          description?: string;
          date?: string | null;
          persona?: string | null;
          tags?: string[];
          cover?: string | null;
          link?: string | null;
        };
        Relationships: [];
      };
      now_entries: {
        Row: {
          id: string;
          title: string;
          date: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          date: string;
          content?: string;
        };
        Update: {
          id?: string;
          title?: string;
          date?: string;
          content?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          name: string;
          src: string;
          alt: string;
          size: string;
          dimensions: string | null;
          uploaded_at: string | null;
          tag: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          src: string;
          alt?: string;
          size?: string;
          dimensions?: string | null;
          uploaded_at?: string | null;
          tag?: string;
        };
        Update: {
          id?: string;
          name?: string;
          src?: string;
          alt?: string;
          size?: string;
          dimensions?: string | null;
          uploaded_at?: string | null;
          tag?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
        };
        Relationships: [];
      };
      featured_items: {
        Row: {
          id: string;
          item_type: string;
          item_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          item_type: string;
          item_id: string;
          position: number;
        };
        Update: {
          item_type?: string;
          item_id?: string;
          position?: number;
        };
        Relationships: [];
      };
      storage_files: {
        Row: {
          id: string;
          path: string;
          created_at: string;
        };
        Insert: {
          path: string;
        };
        Update: {
          path?: string;
        };
        Relationships: [];
      };
      contributions: {
        Row: {
          id: string;
          order_id: string | null;
          payment_id: string | null;
          amount: number;
          currency: string;
          status: "pending" | "captured" | "failed";
          name: string;
          email: string | null;
          note: string | null;
          created_at: string;
          source: "razorpay" | "manual";
        };
        Insert: {
          id: string;
          order_id?: string | null;
          payment_id?: string | null;
          amount: number;
          currency?: string;
          status: "pending" | "captured" | "failed";
          name: string;
          email?: string | null;
          note?: string | null;
          created_at?: string;
          source?: "razorpay" | "manual";
        };
        Update: {
          id?: string;
          order_id?: string | null;
          payment_id?: string | null;
          amount?: number;
          currency?: string;
          status?: "pending" | "captured" | "failed";
          name?: string;
          email?: string | null;
          note?: string | null;
          created_at?: string;
          source?: "razorpay" | "manual";
        };
        Relationships: [];
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          status: "active" | "unsubscribed";
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          status?: "active" | "unsubscribed";
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          status?: "active" | "unsubscribed";
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      content_status: "published" | "unpublished";
    };
  };
}
